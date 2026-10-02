import type { TangoDifficulty, TangoPreset, TangoSignConstraint } from './types';
// Technique levels used by the grader (lowest level that makes progress is always tried first):
// 1 = direct rules: no-three (pairs + sandwiches), line quota reached, = / × propagation.
// 2 = line analysis: enumerate every legal completion of a single row/column (balance, no-three,
//     in-line signs) and fix cells that agree in all of them.
// 3 = lookahead: assume a value, propagate with levels 1-2, and reject it on contradiction.
export type TangoTechniqueLevel = 1 | 2 | 3;
export interface TangoGrade {
  solved: boolean;
  level: TangoTechniqueLevel;
  steps: Record<TangoTechniqueLevel, number>;
  grid: number[][];
}
export interface TangoDifficultySpec {
  level: TangoTechniqueLevel;
  minClues: number;
  maxClues: number;
  minSigns: number;
  maxSigns: number;
}
export const TANGO_SIZE = 6;
// Clue = one given cell or one = / × sign. Ranges are for 6x6; observed values sit well inside them.
export const TANGO_DIFFICULTY_SPECS: Record<TangoDifficulty, TangoDifficultySpec> = {
  easy: { level: 1, minClues: 16, maxClues: 24, minSigns: 2, maxSigns: 10 },
  medium: { level: 2, minClues: 10, maxClues: 18, minSigns: 2, maxSigns: 10 },
  hard: { level: 3, minClues: 6, maxClues: 15, minSigns: 2, maxSigns: 10 },
};
export type Rng = () => number;
export function createSeededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(items: T[], rng: Rng): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}
interface Edge {
  a: number;
  b: number;
  same: boolean;
}
interface Model {
  n: number;
  lines: number[][];
  validLines: Int8Array[];
  edges: Edge[];
  // Per line: the signs whose two cells both lie in that line, as [posA, posB, same].
  lineSigns: [number, number, boolean][][];
}
const validLineCache = new Map<number, Int8Array[]>();
function getValidLines(n: number): Int8Array[] {
  const cached = validLineCache.get(n);
  if (cached) return cached;
  const out: Int8Array[] = [];
  for (let mask = 0; mask < 1 << n; mask++) {
    let ones = 0;
    let ok = true;
    const line = new Int8Array(n);
    for (let i = 0; i < n; i++) {
      line[i] = mask & (1 << i) ? 1 : 2;
      if (line[i] === 1) ones++;
      if (i >= 2 && line[i] === line[i - 1] && line[i] === line[i - 2]) ok = false;
    }
    if (ok && ones === n / 2) out.push(line);
  }
  validLineCache.set(n, out);
  return out;
}
function buildModel(n: number, edges: Edge[]): Model {
  const lines: number[][] = [];
  for (let r = 0; r < n; r++) lines.push(Array.from({ length: n }, (_, c) => r * n + c));
  for (let c = 0; c < n; c++) lines.push(Array.from({ length: n }, (_, r) => r * n + c));
  const lineSigns: [number, number, boolean][][] = lines.map(() => []);
  for (const e of edges) {
    const ra = Math.floor(e.a / n);
    const rb = Math.floor(e.b / n);
    if (ra === rb) lineSigns[ra].push([e.a % n, e.b % n, e.same]);
    else lineSigns[n + (e.a % n)].push([ra, rb, e.same]);
  }
  return { n, lines, validLines: getValidLines(n), edges, lineSigns };
}
function presetToEdges(preset: Pick<TangoPreset, 'size' | 'horizontalSigns' | 'verticalSigns'>): Edge[] {
  const n = preset.size;
  return [
    ...preset.horizontalSigns.map((s) => ({ a: s.row * n + s.col, b: s.row * n + s.col + 1, same: s.sign === '=' })),
    ...preset.verticalSigns.map((s) => ({ a: s.row * n + s.col, b: (s.row + 1) * n + s.col, same: s.sign === '=' })),
  ];
}
// Level 1: returns number of cells filled, or -1 on contradiction.
function applyDirect(m: Model, g: Int8Array): number {
  const half = m.n / 2;
  let filled = 0;
  let changed = true;
  while (changed) {
    changed = false;
    for (const e of m.edges) {
      const va = g[e.a];
      const vb = g[e.b];
      if (va && vb) {
        if ((va === vb) !== e.same) return -1;
      } else if (va) {
        g[e.b] = e.same ? va : 3 - va;
        filled++;
        changed = true;
      } else if (vb) {
        g[e.a] = e.same ? vb : 3 - vb;
        filled++;
        changed = true;
      }
    }
    for (const line of m.lines) {
      for (let i = 0; i + 2 < line.length; i++) {
        const x = g[line[i]];
        const y = g[line[i + 1]];
        const z = g[line[i + 2]];
        if (x && x === y && y === z) return -1;
        if (x && x === y && !z) {
          g[line[i + 2]] = 3 - x;
          filled++;
          changed = true;
        } else if (y && y === z && !x) {
          g[line[i]] = 3 - y;
          filled++;
          changed = true;
        } else if (x && x === z && !y) {
          g[line[i + 1]] = 3 - x;
          filled++;
          changed = true;
        }
      }
      let c1 = 0;
      let c2 = 0;
      for (const idx of line) {
        if (g[idx] === 1) c1++;
        else if (g[idx] === 2) c2++;
      }
      if (c1 > half || c2 > half) return -1;
      if ((c1 === half) !== (c2 === half) && c1 + c2 < m.n) {
        const fill = c1 === half ? 2 : 1;
        for (const idx of line) {
          if (!g[idx]) {
            g[idx] = fill;
            filled++;
          }
        }
        changed = true;
      }
    }
  }
  return filled;
}
// Level 2: returns number of cells filled, or -1 on contradiction.
function applyLineAnalysis(m: Model, g: Int8Array): number {
  let filled = 0;
  for (let li = 0; li < m.lines.length; li++) {
    const line = m.lines[li];
    let empty = 0;
    for (const idx of line) if (!g[idx]) empty++;
    if (!empty) continue;
    const signs = m.lineSigns[li];
    let agree: Int8Array | null = null;
    let any = false;
    for (const cand of m.validLines) {
      let ok = true;
      for (let i = 0; i < line.length && ok; i++) {
        const v = g[line[i]];
        if (v && v !== cand[i]) ok = false;
      }
      for (let s = 0; s < signs.length && ok; s++) {
        const [pa, pb, same] = signs[s];
        if ((cand[pa] === cand[pb]) !== same) ok = false;
      }
      if (!ok) continue;
      if (!any) {
        agree = Int8Array.from(cand);
        any = true;
      } else if (agree) {
        for (let i = 0; i < line.length; i++) if (agree[i] !== cand[i]) agree[i] = 0;
      }
    }
    if (!any || !agree) return -1;
    for (let i = 0; i < line.length; i++) {
      if (!g[line[i]] && agree[i]) {
        g[line[i]] = agree[i];
        filled++;
      }
    }
    if (filled) return filled;
  }
  return filled;
}
// Run levels 1 and 2 to a fixpoint. Returns false on contradiction.
function propagate(m: Model, g: Int8Array, maxLevel: TangoTechniqueLevel, steps?: Record<TangoTechniqueLevel, number>): boolean {
  for (;;) {
    const d = applyDirect(m, g);
    if (d < 0) return false;
    if (steps && d) steps[1] += d;
    if (maxLevel < 2) return true;
    const l = applyLineAnalysis(m, g);
    if (l < 0) return false;
    if (!l) return true;
    if (steps) steps[2] += l;
  }
}
function applyLookahead(m: Model, g: Int8Array): number {
  for (let i = 0; i < g.length; i++) {
    if (g[i]) continue;
    for (const v of [1, 2]) {
      const trial = Int8Array.from(g);
      trial[i] = v;
      if (!propagate(m, trial, 2)) {
        g[i] = 3 - v;
        return 1;
      }
    }
  }
  return 0;
}
function solveModel(m: Model, start: Int8Array, maxLevel: TangoTechniqueLevel): { solved: boolean; contradiction: boolean; level: TangoTechniqueLevel; steps: Record<TangoTechniqueLevel, number>; g: Int8Array } {
  const g = Int8Array.from(start);
  const steps: Record<TangoTechniqueLevel, number> = { 1: 0, 2: 0, 3: 0 };
  for (;;) {
    if (!propagate(m, g, maxLevel, steps)) return { solved: false, contradiction: true, level: 1, steps, g };
    if (g.every((v) => v !== 0)) break;
    if (maxLevel < 3 || !applyLookahead(m, g)) return { solved: false, contradiction: false, level: 1, steps, g };
    steps[3]++;
  }
  const level: TangoTechniqueLevel = steps[3] ? 3 : steps[2] ? 2 : 1;
  return { solved: true, contradiction: false, level, steps, g };
}
function presetGridToFlat(preset: Pick<TangoPreset, 'size' | 'initialGrid'>): Int8Array {
  const n = preset.size;
  const g = new Int8Array(n * n);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) g[r * n + c] = preset.initialGrid[r][c];
  return g;
}
function flatToGrid(g: Int8Array, n: number): number[][] {
  return Array.from({ length: n }, (_, r) => Array.from(g.subarray(r * n, r * n + n)));
}
// Grade a puzzle by the deepest technique a human-style solver needs (lowest level always tried first).
export function gradeTangoPuzzle(preset: Pick<TangoPreset, 'size' | 'initialGrid' | 'horizontalSigns' | 'verticalSigns'>): TangoGrade {
  const res = solveModel(buildModel(preset.size, presetToEdges(preset)), presetGridToFlat(preset), 3);
  return { solved: res.solved, level: res.level, steps: res.steps, grid: flatToGrid(res.g, preset.size) };
}
// Brute-force solution counter (independent of the grader); stops at `limit`.
export function countTangoSolutions(preset: Pick<TangoPreset, 'size' | 'initialGrid' | 'horizontalSigns' | 'verticalSigns'>, limit = 2): number {
  const m = buildModel(preset.size, presetToEdges(preset));
  let count = 0;
  const search = (g: Int8Array): void => {
    if (count >= limit) return;
    if (applyDirect(m, g) < 0) return;
    const idx = g.indexOf(0);
    if (idx < 0) {
      count++;
      return;
    }
    for (const v of [1, 2]) {
      const next = Int8Array.from(g);
      next[idx] = v;
      search(next);
    }
  };
  search(presetGridToFlat(preset));
  return count;
}
export function generateTangoSolution(n: number, rng: Rng): Int8Array {
  const lines = getValidLines(n);
  const half = n / 2;
  const rows: Int8Array[] = [];
  const colCount = new Int8Array(n);
  const tryRow = (r: number): boolean => {
    if (r === n) {
      const cols = new Set<string>();
      for (let c = 0; c < n; c++) cols.add(rows.map((row) => row[c]).join(''));
      return cols.size === n;
    }
    for (const cand of shuffle([...lines], rng)) {
      if (rows.includes(cand)) continue;
      let ok = true;
      for (let c = 0; c < n && ok; c++) {
        if (cand[c] === 1 && colCount[c] + 1 > half) ok = false;
        if (cand[c] === 2 && r - colCount[c] + 1 > half) ok = false;
        if (r >= 2 && rows[r - 1][c] === cand[c] && rows[r - 2][c] === cand[c]) ok = false;
      }
      if (!ok) continue;
      rows.push(cand);
      for (let c = 0; c < n; c++) if (cand[c] === 1) colCount[c]++;
      if (tryRow(r + 1)) return true;
      rows.pop();
      for (let c = 0; c < n; c++) if (cand[c] === 1) colCount[c]--;
    }
    return false;
  };
  tryRow(0);
  const g = new Int8Array(n * n);
  rows.forEach((row, r) => g.set(row, r * n));
  return g;
}
type Clue = { kind: 'cell'; idx: number } | { kind: 'edge'; edge: Edge };
export interface GenerateTangoOptions {
  difficulty: TangoDifficulty;
  size?: number;
  rng?: Rng;
  avoidSignatures?: Iterable<string>;
  maxAttempts?: number;
}
export interface GeneratedTangoPuzzle extends TangoPreset {
  difficulty: TangoDifficulty;
  signature: string;
  grade: TangoGrade;
}
export function tangoSignature(preset: Pick<TangoPreset, 'solution'>): string {
  return preset.solution.map((row) => row.join('')).join('');
}
function buildPreset(n: number, solution: Int8Array, clues: Clue[]): Omit<TangoPreset, 'id' | 'title'> {
  const initial = new Int8Array(n * n);
  const horizontalSigns: TangoSignConstraint[] = [];
  const verticalSigns: TangoSignConstraint[] = [];
  for (const clue of clues) {
    if (clue.kind === 'cell') {
      initial[clue.idx] = solution[clue.idx];
      continue;
    }
    const { a, b, same } = clue.edge;
    const s: TangoSignConstraint = { row: Math.floor(a / n), col: a % n, sign: same ? '=' : 'x' };
    if (b === a + 1) horizontalSigns.push(s);
    else verticalSigns.push(s);
  }
  return { size: n, initialGrid: flatToGrid(initial, n), solution: flatToGrid(solution, n), horizontalSigns, verticalSigns };
}
function attemptPuzzle(n: number, spec: TangoDifficultySpec, rng: Rng): { solution: Int8Array; clues: Clue[]; level: TangoTechniqueLevel } | null {
  const solution = generateTangoSolution(n, rng);
  const allEdges: Edge[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const a = r * n + c;
      if (c + 1 < n) allEdges.push({ a, b: a + 1, same: solution[a] === solution[a + 1] });
      if (r + 1 < n) allEdges.push({ a, b: a + n, same: solution[a] === solution[a + n] });
    }
  }
  // Start from a full board plus a capped random set of signs, then strip clues in random order.
  const signPool = shuffle(allEdges, rng).slice(0, spec.maxSigns + 4);
  const clues: Clue[] = [
    ...Array.from({ length: n * n }, (_, idx) => ({ kind: 'cell', idx }) as Clue),
    ...signPool.map((edge) => ({ kind: 'edge', edge }) as Clue),
  ];
  const active = new Set<Clue>(clues);
  const solvesWith = (set: Set<Clue>): boolean => {
    const g = new Int8Array(n * n);
    const edges: Edge[] = [];
    for (const clue of set) {
      if (clue.kind === 'cell') g[clue.idx] = solution[clue.idx];
      else edges.push(clue.edge);
    }
    return solveModel(buildModel(n, edges), g, spec.level).solved;
  };
  for (const clue of shuffle([...clues], rng)) {
    if (active.size <= spec.minClues) break;
    active.delete(clue);
    if (!solvesWith(active)) active.add(clue);
  }
  const finalClues = clues.filter((c) => active.has(c));
  const signCount = finalClues.filter((c) => c.kind === 'edge').length;
  if (finalClues.length > spec.maxClues || signCount < spec.minSigns || signCount > spec.maxSigns) return null;
  const preset = buildPreset(n, solution, finalClues);
  const grade = gradeTangoPuzzle(preset);
  if (!grade.solved || grade.level !== spec.level) return null;
  return { solution, clues: finalClues, level: grade.level };
}
// Procedurally generate a unique-solution Tango puzzle whose grade matches the requested difficulty.
export function generateTangoPuzzle(options: GenerateTangoOptions): GeneratedTangoPuzzle {
  const { difficulty, size = TANGO_SIZE, rng = Math.random, maxAttempts = 400 } = options;
  const spec = TANGO_DIFFICULTY_SPECS[difficulty];
  const avoid = new Set(options.avoidSignatures ?? []);
  let fallback: GeneratedTangoPuzzle | null = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = attemptPuzzle(size, spec, rng);
    if (!res) continue;
    const base = buildPreset(size, res.solution, res.clues);
    const signature = tangoSignature(base);
    const puzzle: GeneratedTangoPuzzle = {
      ...base,
      id: `${difficulty}-${signature}`,
      title: `${size}×${size} ${difficulty[0].toUpperCase()}${difficulty.slice(1)}`,
      difficulty,
      signature,
      grade: gradeTangoPuzzle(base),
    };
    if (!avoid.has(signature)) return puzzle;
    fallback = fallback ?? puzzle;
  }
  if (fallback) return fallback;
  throw new Error(`Unable to generate a ${difficulty} Tango puzzle`);
}
