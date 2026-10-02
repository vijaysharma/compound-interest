import type { CellState, HitoriDifficulty, HitoriPresetConfig } from './types';
/**
 * Procedural Hitori generator.
 *
 * Algorithm (per attempt):
 * 1. Shading: visit cells in random order and shade a cell when it has no shaded
 *    orthogonal neighbour and shading it keeps every unshaded cell orthogonally
 *    connected, until the target density is reached.
 * 2. Fill: build a random Latin square (randomised backtracking), so every row and
 *    column is duplicate-free; the unshaded cells keep these numbers.
 * 3. Decoys: each shaded cell is rewritten to a number that already appears on an
 *    unshaded cell of its row or column, so it is a genuine duplicate.
 * 4. Verify: the solver below counts solutions (stopping at 2). Only puzzles with
 *    exactly one solution that also meet the difficulty's deduction requirement
 *    are accepted. Failed decoy assignments are re-rolled a few times before a
 *    new shading / Latin square is drawn.
 *
 * Uniqueness follows the standard Hitori convention used by solving guides: a
 * number that is not repeated anywhere in its row or column is never shaded.
 */
export interface HitoriDifficultyParams {
  size: number;
  /** Fraction of cells to shade (greedy placement may land slightly below). */
  density: number;
  /** Minimum fraction of cells that must end up shaded. */
  minDensity: number;
  /**
   * Deduction style required:
   * - 'local': solvable with local rules only (pairs, sandwiches, "neighbours of a
   *   shaded cell are white") - no connectivity reasoning needed.
   * - 'connectivity': needs at least one "shading this would cut the white region"
   *   deduction to finish.
   * Every puzzle must be solvable by single-cell lookahead, i.e. no trial-and-error.
   */
  logic: 'local' | 'connectivity';
  /** Minimum productive lookahead passes (deduction depth); relaxed after half the attempts. */
  minSweeps: number;
}
export const HITORI_DIFFICULTY_PARAMS: Record<HitoriDifficulty, HitoriDifficultyParams> = {
  easy: { size: 5, density: 0.24, minDensity: 0.2, logic: 'local', minSweeps: 1 },
  medium: { size: 7, density: 0.28, minDensity: 0.24, logic: 'connectivity', minSweeps: 1 },
  hard: { size: 8, density: 0.36, minDensity: 0.3, logic: 'connectivity', minSweeps: 2 },
};
export interface HitoriPuzzle extends HitoriPresetConfig {
  difficulty: HitoriDifficulty;
  signature: string;
  source: 'generated' | 'preset';
}
export interface GenerateOptions {
  random?: () => number;
  avoidSignatures?: Iterable<string>;
  maxAttempts?: number;
}
export interface SolveResult {
  /** Number of solutions found, capped at 2. */
  count: number;
  /** First solution found: true = shaded. */
  solution: boolean[] | null;
  /** Productive lookahead passes at the root before guessing or finishing. */
  sweeps: number;
  /** True when the root deduction solved the grid without any guessing. */
  logical: boolean;
}
const UNKNOWN = 0;
const WHITE = 1;
const BLACK = 2;
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(arr: T[], random: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}
export function puzzleSignature(grid: number[][]): string {
  return grid.map((row) => row.join('')).join('/');
}
class HitoriSolver {
  readonly n: number;
  readonly size: number;
  readonly vals: Int8Array;
  readonly candidate: Uint8Array;
  readonly neighbors: Int16Array[];
  /** Other cells in the same row/column holding the same number. */
  readonly twins: Int16Array[];
  private readonly queue: Int16Array;
  private readonly seen: Uint8Array;
  /** When false, deductions use only local rules (adjacency + duplicates), not connectivity. */
  private useConnectivity = true;
  constructor(grid: number[][]) {
    const n = grid.length;
    this.n = n;
    this.size = n * n;
    this.vals = new Int8Array(this.size);
    this.candidate = new Uint8Array(this.size);
    this.neighbors = [];
    this.twins = [];
    this.queue = new Int16Array(this.size * 8 + 8);
    this.seen = new Uint8Array(this.size);
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        this.vals[r * n + c] = grid[r][c];
      }
    }
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const i = r * n + c;
        const nb: number[] = [];
        if (r > 0) nb.push(i - n);
        if (r < n - 1) nb.push(i + n);
        if (c > 0) nb.push(i - 1);
        if (c < n - 1) nb.push(i + 1);
        this.neighbors.push(Int16Array.from(nb));
        const tw: number[] = [];
        for (let k = 0; k < n; k++) {
          if (k !== c && grid[r][k] === grid[r][c]) tw.push(r * n + k);
          if (k !== r && grid[k][c] === grid[r][c]) tw.push(k * n + c);
        }
        this.twins.push(Int16Array.from(tw));
        this.candidate[i] = tw.length > 0 ? 1 : 0;
      }
    }
  }
  initialState(): Uint8Array {
    const state = new Uint8Array(this.size);
    for (let i = 0; i < this.size; i++) {
      if (!this.candidate[i]) state[i] = WHITE;
    }
    return state;
  }
  /** Applies forced consequences of pending assignments; returns false on contradiction. */
  private propagate(state: Uint8Array, pending: number[]): boolean {
    const queue = this.queue;
    let head = 0;
    let tail = 0;
    for (const p of pending) queue[tail++] = p;
    while (head < tail) {
      const code = queue[head++];
      const i = code >> 1;
      const want = code & 1 ? BLACK : WHITE;
      const cur = state[i];
      if (cur === want) continue;
      if (cur !== UNKNOWN) return false;
      if (want === BLACK && !this.candidate[i]) return false;
      state[i] = want;
      if (want === BLACK) {
        for (const nb of this.neighbors[i]) {
          if (state[nb] === BLACK) return false;
          if (state[nb] === UNKNOWN) queue[tail++] = nb << 1;
        }
      } else {
        for (const tw of this.twins[i]) {
          if (state[tw] === WHITE) return false;
          if (state[tw] === UNKNOWN) queue[tail++] = (tw << 1) | 1;
        }
      }
      if (tail >= queue.length - 8) {
        // Compact the queue (never expected for n <= 9, but keeps us safe).
        queue.copyWithin(0, head, tail);
        tail -= head;
        head = 0;
      }
    }
    return !this.useConnectivity || this.connected(state);
  }
  /** All non-black cells must be reachable from one another. */
  private connected(state: Uint8Array): boolean {
    const seen = this.seen;
    seen.fill(0);
    let start = -1;
    let total = 0;
    for (let i = 0; i < this.size; i++) {
      if (state[i] !== BLACK) {
        total++;
        if (start < 0) start = i;
      }
    }
    if (start < 0) return true;
    const stack: number[] = [start];
    seen[start] = 1;
    let reached = 1;
    while (stack.length > 0) {
      const cur = stack.pop()!;
      for (const nb of this.neighbors[cur]) {
        if (!seen[nb] && state[nb] !== BLACK) {
          seen[nb] = 1;
          reached++;
          stack.push(nb);
        }
      }
    }
    return reached === total;
  }
  /**
   * Single-cell lookahead ("failed literal"): if assuming a value for a cell leads
   * to a contradiction, the opposite value is forced. Returns the number of
   * full-grid passes that produced at least one deduction, or -1 on contradiction.
   */
  private deduce(state: Uint8Array): number {
    if (!this.propagate(state, [])) return -1;
    let sweeps = 0;
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < this.size; i++) {
        if (state[i] !== UNKNOWN) continue;
        const trialBlack = state.slice();
        if (!this.propagate(trialBlack, [(i << 1) | 1])) {
          if (!this.propagate(state, [i << 1])) return -1;
          changed = true;
          continue;
        }
        const trialWhite = state.slice();
        if (!this.propagate(trialWhite, [i << 1])) {
          if (!this.propagate(state, [(i << 1) | 1])) return -1;
          changed = true;
        }
      }
      if (changed) sweeps++;
    }
    return sweeps;
  }
  solve(): SolveResult {
    const result: SolveResult = { count: 0, solution: null, sweeps: 0, logical: false };
    const root = this.initialState();
    const sweeps = this.deduce(root);
    if (sweeps < 0) return result;
    result.sweeps = sweeps;
    result.logical = root.indexOf(UNKNOWN) < 0;
    this.search(root, result);
    return result;
  }
  /** True when single-cell lookahead using only local rules (no connectivity reasoning) solves the grid. */
  solvableLocally(): boolean {
    this.useConnectivity = false;
    const state = this.initialState();
    const ok = this.deduce(state) >= 0 && state.indexOf(UNKNOWN) < 0;
    this.useConnectivity = true;
    return ok;
  }
  private search(state: Uint8Array, result: SolveResult): void {
    if (result.count >= 2) return;
    const pick = state.indexOf(UNKNOWN);
    if (pick < 0) {
      result.count++;
      if (!result.solution) result.solution = Array.from(state, (s) => s === BLACK);
      return;
    }
    for (const code of [(pick << 1) | 1, pick << 1]) {
      const next = state.slice();
      if (this.propagate(next, [code]) && this.deduce(next) >= 0) {
        this.search(next, result);
        if (result.count >= 2) return;
      }
    }
  }
}
export function solveHitori(grid: number[][]): SolveResult {
  return new HitoriSolver(grid).solve();
}
/** Whether the puzzle can be finished using only local duplicate/adjacency deductions. */
export function isSolvableLocally(grid: number[][]): boolean {
  return new HitoriSolver(grid).solvableLocally();
}
function buildShading(n: number, target: number, random: () => number): boolean[] {
  const shaded: boolean[] = Array(n * n).fill(false);
  const order = shuffle(Array.from({ length: n * n }, (_, i) => i), random);
  let count = 0;
  const isConnected = (): boolean => {
    let start = -1;
    let total = 0;
    for (let i = 0; i < n * n; i++) {
      if (!shaded[i]) {
        total++;
        if (start < 0) start = i;
      }
    }
    const seen = new Uint8Array(n * n);
    const stack = [start];
    seen[start] = 1;
    let reached = 1;
    while (stack.length > 0) {
      const cur = stack.pop()!;
      const r = Math.floor(cur / n);
      const c = cur % n;
      const nbs = [r > 0 ? cur - n : -1, r < n - 1 ? cur + n : -1, c > 0 ? cur - 1 : -1, c < n - 1 ? cur + 1 : -1];
      for (const nb of nbs) {
        if (nb >= 0 && !seen[nb] && !shaded[nb]) {
          seen[nb] = 1;
          reached++;
          stack.push(nb);
        }
      }
    }
    return reached === total;
  };
  for (const i of order) {
    if (count >= target) break;
    const r = Math.floor(i / n);
    const c = i % n;
    if ((r > 0 && shaded[i - n]) || (r < n - 1 && shaded[i + n]) || (c > 0 && shaded[i - 1]) || (c < n - 1 && shaded[i + 1])) {
      continue;
    }
    shaded[i] = true;
    if (isConnected()) {
      count++;
    } else {
      shaded[i] = false;
    }
  }
  return shaded;
}
function buildLatinSquare(n: number, random: () => number): number[][] {
  const grid: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  const rowUsed = Array.from({ length: n }, () => new Uint8Array(n + 1));
  const colUsed = Array.from({ length: n }, () => new Uint8Array(n + 1));
  let steps = 0;
  const fill = (pos: number): boolean => {
    if (pos === n * n) return true;
    if (++steps > 20000) return false;
    const r = Math.floor(pos / n);
    const c = pos % n;
    const options = shuffle(Array.from({ length: n }, (_, k) => k + 1), random);
    for (const v of options) {
      if (rowUsed[r][v] || colUsed[c][v]) continue;
      grid[r][c] = v;
      rowUsed[r][v] = 1;
      colUsed[c][v] = 1;
      if (fill(pos + 1)) return true;
      rowUsed[r][v] = 0;
      colUsed[c][v] = 0;
    }
    grid[r][c] = 0;
    return false;
  };
  if (fill(0)) return grid;
  // Fallback: shuffled cyclic Latin square (always valid).
  const rows = shuffle(Array.from({ length: n }, (_, i) => i), random);
  const cols = shuffle(Array.from({ length: n }, (_, i) => i), random);
  const symbols = shuffle(Array.from({ length: n }, (_, i) => i + 1), random);
  return rows.map((r) => cols.map((c) => symbols[(r + c) % n]));
}
function assignDecoys(latin: number[][], shaded: boolean[], random: () => number): number[][] {
  const n = latin.length;
  const grid = latin.map((row) => row.slice());
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!shaded[r * n + c]) continue;
      const pool: number[] = [];
      for (let k = 0; k < n; k++) {
        if (!shaded[r * n + k]) pool.push(latin[r][k]);
        if (!shaded[k * n + c]) pool.push(latin[k][c]);
      }
      grid[r][c] = pool[Math.floor(random() * pool.length)];
    }
  }
  return grid;
}
function toSolution(shaded: boolean[], n: number): CellState[][] {
  return Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c): CellState => (shaded[r * n + c] ? 'shaded' : 'circled'))
  );
}
function labelFor(difficulty: HitoriDifficulty, n: number): string {
  return `${n}×${n} ${difficulty.charAt(0).toUpperCase()}${difficulty.slice(1)}`;
}
/**
 * Generates a random Hitori with a unique solution for the given difficulty.
 * Returns null if no acceptable puzzle was found within `maxAttempts` boards.
 */
export function generateHitori(difficulty: HitoriDifficulty, options: GenerateOptions = {}): HitoriPuzzle | null {
  const params = HITORI_DIFFICULTY_PARAMS[difficulty];
  const random = options.random ?? Math.random;
  const avoid = new Set(options.avoidSignatures ?? []);
  const maxAttempts = options.maxAttempts ?? 400;
  const n = params.size;
  const target = Math.round(params.density * n * n);
  const minShaded = Math.ceil(params.minDensity * n * n);
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // After many misses, relax the deduction-depth floor so generation always terminates quickly.
    const minSweeps = attempt < maxAttempts / 2 ? params.minSweeps : 1;
    const shaded = buildShading(n, target, random);
    if (shaded.filter(Boolean).length < minShaded) continue;
    const latin = buildLatinSquare(n, random);
    for (let reroll = 0; reroll < 4; reroll++) {
      const grid = assignDecoys(latin, shaded, random);
      const signature = puzzleSignature(grid);
      if (avoid.has(signature)) continue;
      const res = solveHitori(grid);
      if (res.count !== 1 || !res.solution) continue;
      if (!res.logical || res.sweeps < minSweeps) continue;
      if (isSolvableLocally(grid) !== (params.logic === 'local')) continue;
      // The solver's unique solution is the intended one by construction; use it as canonical.
      return {
        difficulty,
        size: n,
        label: labelFor(difficulty, n),
        grid,
        solution: toSolution(res.solution, n),
        signature,
        source: 'generated',
      };
    }
  }
  return null;
}
