import type { SudokuDifficulty } from './types';
/**
 * Clue bands per difficulty. A puzzle is accepted when its clue count falls in
 * the band and its logical grade (see `gradePuzzle`) matches the difficulty.
 */
export const CLUE_BANDS: Record<SudokuDifficulty, { min: number; max: number }> = {
  easy: { min: 36, max: 40 },
  medium: { min: 29, max: 33 },
  hard: { min: 23, max: 28 },
};
const ALL = 0x3fe; // bits 1..9
const BOX_OF: number[] = Array.from({ length: 81 }, (_, i) => Math.floor(Math.floor(i / 9) / 3) * 3 + Math.floor((i % 9) / 3));
const PEER_UNITS: number[][] = (() => {
  const units: number[][] = [];
  for (let r = 0; r < 9; r++) units.push(Array.from({ length: 9 }, (_, c) => r * 9 + c));
  for (let c = 0; c < 9; c++) units.push(Array.from({ length: 9 }, (_, r) => r * 9 + c));
  for (let b = 0; b < 9; b++) {
    const br = Math.floor(b / 3) * 3;
    const bc = (b % 3) * 3;
    units.push(Array.from({ length: 9 }, (_, k) => (br + Math.floor(k / 3)) * 9 + bc + (k % 3)));
  }
  return units;
})();
function popcount(n: number): number {
  let count = 0;
  let x = n;
  while (x) {
    x &= x - 1;
    count++;
  }
  return count;
}
export function isValid(grid: number[][], r: number, c: number, val: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (grid[r][i] === val) return false;
    if (grid[i][c] === val) return false;
  }
  const boxRow = Math.floor(r / 3) * 3;
  const boxCol = Math.floor(c / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[boxRow + i][boxCol + j] === val) return false;
    }
  }
  return true;
}
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
interface BitState {
  cells: number[];
  rows: number[];
  cols: number[];
  boxes: number[];
}
function toBitState(grid: number[][]): BitState | null {
  const state: BitState = { cells: grid.flat(), rows: Array(9).fill(0), cols: Array(9).fill(0), boxes: Array(9).fill(0) };
  for (let i = 0; i < 81; i++) {
    const v = state.cells[i];
    if (!v) continue;
    const bit = 1 << v;
    const r = Math.floor(i / 9);
    const c = i % 9;
    const b = BOX_OF[i];
    if ((state.rows[r] | state.cols[c] | state.boxes[b]) & bit) return null;
    state.rows[r] |= bit;
    state.cols[c] |= bit;
    state.boxes[b] |= bit;
  }
  return state;
}
/**
 * Bitmask backtracking search with minimum-remaining-values cell choice.
 * Stops once `limit` solutions are found. Optionally randomises digit order and
 * records the first solution found.
 */
function search(state: BitState, limit: number, randomise: boolean, out: { count: number; first: number[] | null }): void {
  let best = -1;
  let bestMask = 0;
  let bestCount = 10;
  for (let i = 0; i < 81; i++) {
    if (state.cells[i]) continue;
    const mask = ALL & ~(state.rows[Math.floor(i / 9)] | state.cols[i % 9] | state.boxes[BOX_OF[i]]);
    const count = popcount(mask);
    if (count < bestCount) {
      best = i;
      bestMask = mask;
      bestCount = count;
      if (count <= 1) break;
    }
  }
  if (best === -1) {
    out.count++;
    if (!out.first) out.first = [...state.cells];
    return;
  }
  if (bestCount === 0) return;
  const digits: number[] = [];
  for (let d = 1; d <= 9; d++) if (bestMask & (1 << d)) digits.push(d);
  const order = randomise ? shuffle(digits) : digits;
  const r = Math.floor(best / 9);
  const c = best % 9;
  const b = BOX_OF[best];
  for (const d of order) {
    const bit = 1 << d;
    state.cells[best] = d;
    state.rows[r] |= bit;
    state.cols[c] |= bit;
    state.boxes[b] |= bit;
    search(state, limit, randomise, out);
    state.cells[best] = 0;
    state.rows[r] &= ~bit;
    state.cols[c] &= ~bit;
    state.boxes[b] &= ~bit;
    if (out.count >= limit) return;
  }
}
function toGrid(cells: number[]): number[][] {
  return Array.from({ length: 9 }, (_, r) => cells.slice(r * 9, r * 9 + 9));
}
/** Fills `grid` in place with a (random) solution. Returns false if unsolvable. */
export function solveSudoku(grid: number[][]): boolean {
  const state = toBitState(grid);
  if (!state) return false;
  const out = { count: 0, first: null as number[] | null };
  search(state, 1, true, out);
  if (!out.first) return false;
  const solved = toGrid(out.first);
  for (let r = 0; r < 9; r++) grid[r] = solved[r];
  return true;
}
/** Counts solutions up to `limit` (default 2). Does not mutate `grid`. */
export function countSolutions(grid: number[][], count = { val: 0 }, limit = 2): number {
  const state = toBitState(grid);
  if (!state) return count.val;
  const out = { count: 0, first: null as number[] | null };
  search(state, limit, false, out);
  count.val += out.count;
  return count.val;
}
export function hasUniqueSolution(grid: number[][]): boolean {
  return countSolutions(grid, { val: 0 }, 2) === 1;
}
/**
 * Human-style logical grade. Applies naked singles and hidden singles until
 * stuck; level 1 if those alone solve it. Otherwise adds naked pairs and
 * pointing / box-line reductions; level 2 if that solves it, else level 3
 * (needs harder techniques or guessing).
 */
export function gradePuzzle(grid: number[][]): 1 | 2 | 3 {
  const cells = grid.flat();
  const cand: number[] = Array(81).fill(0);
  const recompute = () => {
    for (let i = 0; i < 81; i++) {
      if (cells[i]) {
        cand[i] = 0;
        continue;
      }
      let used = 0;
      for (const unit of [PEER_UNITS[Math.floor(i / 9)], PEER_UNITS[9 + (i % 9)], PEER_UNITS[18 + BOX_OF[i]]]) {
        for (const j of unit) if (cells[j]) used |= 1 << cells[j];
      }
      cand[i] &= ALL & ~used;
    }
  };
  for (let i = 0; i < 81; i++) cand[i] = cells[i] ? 0 : ALL;
  recompute();
  const applySingles = (): boolean => {
    for (let i = 0; i < 81; i++) {
      if (!cells[i] && popcount(cand[i]) === 1) {
        cells[i] = Math.log2(cand[i]);
        recompute();
        return true;
      }
    }
    for (const unit of PEER_UNITS) {
      for (let d = 1; d <= 9; d++) {
        const bit = 1 << d;
        let spot = -1;
        let n = 0;
        for (const j of unit) {
          if (cand[j] & bit) {
            spot = j;
            n++;
          }
        }
        if (n === 1) {
          cells[spot] = d;
          recompute();
          return true;
        }
      }
    }
    return false;
  };
  const applyEliminations = (): boolean => {
    let changed = false;
    for (const unit of PEER_UNITS) {
      for (let a = 0; a < 9; a++) {
        const ia = unit[a];
        if (popcount(cand[ia]) !== 2) continue;
        for (let b = a + 1; b < 9; b++) {
          if (cand[unit[b]] !== cand[ia]) continue;
          for (const j of unit) {
            if (j !== ia && j !== unit[b] && cand[j] & cand[ia]) {
              cand[j] &= ~cand[ia];
              changed = true;
            }
          }
        }
      }
    }
    for (let b = 0; b < 9; b++) {
      const box = PEER_UNITS[18 + b];
      for (let d = 1; d <= 9; d++) {
        const bit = 1 << d;
        const spots = box.filter((j) => cand[j] & bit);
        if (spots.length < 2) continue;
        const sameRow = spots.every((j) => Math.floor(j / 9) === Math.floor(spots[0] / 9));
        const sameCol = spots.every((j) => j % 9 === spots[0] % 9);
        const line = sameRow ? PEER_UNITS[Math.floor(spots[0] / 9)] : sameCol ? PEER_UNITS[9 + (spots[0] % 9)] : null;
        if (!line) continue;
        for (const j of line) {
          if (BOX_OF[j] !== b && cand[j] & bit) {
            cand[j] &= ~bit;
            changed = true;
          }
        }
      }
    }
    return changed;
  };
  let usedAdvanced = false;
  for (;;) {
    while (applySingles()) {
      // keep applying singles
    }
    if (cells.every(Boolean)) return usedAdvanced ? 2 : 1;
    if (!applyEliminations()) return 3;
    usedAdvanced = true;
  }
}
export function generateFullBoard(): number[][] {
  const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
  solveSudoku(grid);
  return grid;
}
function digClues(solution: number[][], minClues: number): number[][] {
  const puzzle = solution.map((row) => [...row]);
  let clues = 81;
  for (const idx of shuffle(Array.from({ length: 81 }, (_, i) => i))) {
    if (clues <= minClues) break;
    const r = Math.floor(idx / 9);
    const c = idx % 9;
    const temp = puzzle[r][c];
    puzzle[r][c] = 0;
    if (hasUniqueSolution(puzzle)) {
      clues--;
    } else {
      puzzle[r][c] = temp;
    }
  }
  return puzzle;
}
const TARGET_GRADE: Record<SudokuDifficulty, (grade: number) => boolean> = {
  easy: (g) => g === 1,
  medium: (g) => g <= 2,
  hard: (g) => g >= 2,
};
const MAX_ATTEMPTS = 40;
/**
 * Generates a puzzle with exactly one solution whose clue count is inside the
 * difficulty's band and whose logical grade suits the difficulty. Falls back
 * to the closest candidate if no attempt satisfies every constraint.
 */
export function generatePuzzle(difficulty: SudokuDifficulty): { initial: number[][]; solution: number[][] } {
  const band = CLUE_BANDS[difficulty];
  let fallback: { initial: number[][]; solution: number[][] } | null = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const solution = generateFullBoard();
    const target = band.min + Math.floor(Math.random() * (band.max - band.min + 1));
    const initial = digClues(solution, target);
    const clues = initial.flat().filter(Boolean).length;
    if (clues > band.max) continue;
    if (!fallback) fallback = { initial, solution };
    if (TARGET_GRADE[difficulty](gradePuzzle(initial))) return { initial, solution };
  }
  if (fallback) return fallback;
  const solution = generateFullBoard();
  return { initial: digClues(solution, band.min), solution };
}
