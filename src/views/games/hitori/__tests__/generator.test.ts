import test from 'node:test';
import assert from 'node:assert/strict';
import { validateHitori } from '../engine';
import {
  HITORI_DIFFICULTY_PARAMS,
  generateHitori,
  isSolvableLocally,
  mulberry32,
  solveHitori,
  type HitoriPuzzle,
} from '../generator';
import { createHitoriPuzzle, parseStoredPuzzle, presetPuzzle } from '../puzzleSource';
import type { CellState } from '../types';
const DIFFS = ['easy', 'medium', 'hard'] as const;
function mustGenerate(diff: (typeof DIFFS)[number], seed: number): HitoriPuzzle {
  const puzzle = generateHitori(diff, { random: mulberry32(seed) });
  assert.ok(puzzle, `generation failed for ${diff} seed ${seed}`);
  return puzzle;
}
/** Independent brute force (literal rules via validateHitori), only shading repeated numbers. */
function bruteForceCount(grid: number[][]): number {
  const n = grid.length;
  const cells: number[] = [];
  for (let i = 0; i < n * n; i++) {
    const r = Math.floor(i / n);
    const c = i % n;
    let dup = false;
    for (let k = 0; k < n; k++) {
      if (k !== c && grid[r][k] === grid[r][c]) dup = true;
      if (k !== r && grid[k][c] === grid[r][c]) dup = true;
    }
    if (dup) cells.push(i);
  }
  const states: CellState[] = Array(n * n).fill('circled');
  let count = 0;
  const rec = (k: number): void => {
    if (count > 1) return;
    if (k === cells.length) {
      if (validateHitori(grid, states).isComplete) count++;
      return;
    }
    rec(k + 1);
    const i = cells[k];
    const r = Math.floor(i / n);
    const c = i % n;
    if ((r > 0 && states[i - n] === 'shaded') || (c > 0 && states[i - 1] === 'shaded')) return;
    states[i] = 'shaded';
    rec(k + 1);
    states[i] = 'circled';
  };
  rec(0);
  return count;
}
test('generated puzzles are valid, unique and sized per difficulty', () => {
  for (const diff of DIFFS) {
    const params = HITORI_DIFFICULTY_PARAMS[diff];
    for (let seed = 1; seed <= 25; seed++) {
      const puzzle = mustGenerate(diff, seed * 7919);
      const n = params.size;
      assert.equal(puzzle.size, n);
      assert.equal(puzzle.grid.length, n);
      assert.equal(puzzle.solution.length, n);
      for (const row of puzzle.grid) {
        assert.equal(row.length, n);
        for (const v of row) assert.ok(Number.isInteger(v) && v >= 1 && v <= n, `value ${v} out of range`);
      }
      const flat = puzzle.solution.flat();
      const res = validateHitori(puzzle.grid, flat);
      assert.equal(res.isComplete, true, `${diff} seed ${seed}: ${JSON.stringify(res.violations)}`);
      const solved = solveHitori(puzzle.grid);
      assert.equal(solved.count, 1, `${diff} seed ${seed} is not unique`);
      assert.deepEqual(
        solved.solution,
        flat.map((s) => s === 'shaded')
      );
      assert.equal(solved.logical, true, 'should be solvable without guessing');
      assert.equal(isSolvableLocally(puzzle.grid), params.logic === 'local');
      const shadedCount = flat.filter((s) => s === 'shaded').length;
      assert.ok(shadedCount >= Math.ceil(params.minDensity * n * n), `${diff} too sparse: ${shadedCount}`);
      // Every shaded cell duplicates an unshaded number in its row or column.
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          if (puzzle.solution[r][c] !== 'shaded') continue;
          const v = puzzle.grid[r][c];
          let found = false;
          for (let k = 0; k < n; k++) {
            if (puzzle.solution[r][k] !== 'shaded' && puzzle.grid[r][k] === v) found = true;
            if (puzzle.solution[k][c] !== 'shaded' && puzzle.grid[k][c] === v) found = true;
          }
          assert.ok(found, `${diff} seed ${seed}: shaded (${r},${c}) is not a duplicate`);
        }
      }
    }
  }
});
test('easy puzzles are unique under an independent brute-force count', () => {
  for (let seed = 1; seed <= 8; seed++) {
    const puzzle = mustGenerate('easy', seed * 104729);
    assert.equal(bruteForceCount(puzzle.grid), 1);
  }
});
test('difficulties differ in size and shading', () => {
  const avgShaded = (diff: (typeof DIFFS)[number]) => {
    let total = 0;
    for (let seed = 1; seed <= 10; seed++) {
      total += mustGenerate(diff, seed).solution.flat().filter((s) => s === 'shaded').length;
    }
    return total / 10;
  };
  assert.ok(HITORI_DIFFICULTY_PARAMS.easy.size < HITORI_DIFFICULTY_PARAMS.medium.size);
  assert.ok(HITORI_DIFFICULTY_PARAMS.medium.size < HITORI_DIFFICULTY_PARAMS.hard.size);
  const easy = avgShaded('easy');
  const medium = avgShaded('medium');
  const hard = avgShaded('hard');
  assert.ok(easy < medium && medium < hard, `shaded averages ${easy}/${medium}/${hard}`);
});
test('repeated generation yields distinct puzzles', () => {
  for (const diff of DIFFS) {
    const random = mulberry32(2024);
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const puzzle = generateHitori(diff, { random });
      assert.ok(puzzle);
      seen.add(puzzle.signature);
    }
    assert.equal(seen.size, 50, `${diff}: only ${seen.size}/50 distinct`);
  }
});
test('avoidSignatures skips a previously served puzzle', () => {
  const first = mustGenerate('easy', 42);
  const second = generateHitori('easy', { random: mulberry32(42), avoidSignatures: [first.signature] });
  assert.ok(second);
  assert.notEqual(second.signature, first.signature);
});
test('createHitoriPuzzle never repeats within the recent window', () => {
  const random = mulberry32(99);
  const seen = new Set<string>();
  for (let i = 0; i < 30; i++) {
    const puzzle = createHitoriPuzzle('easy', random);
    assert.equal(puzzle.source, 'generated');
    assert.equal(seen.has(puzzle.signature), false, 'immediate repeat');
    seen.add(puzzle.signature);
  }
});
test('generation is fast enough for the browser', () => {
  for (const diff of DIFFS) {
    const start = performance.now();
    for (let i = 0; i < 20; i++) mustGenerate(diff, 500 + i);
    const avg = (performance.now() - start) / 20;
    assert.ok(avg < 50, `${diff} average ${avg.toFixed(1)}ms`);
  }
});
test('stored puzzles round-trip and malformed ones are rejected', () => {
  const puzzle = mustGenerate('medium', 7);
  const parsed = parseStoredPuzzle(JSON.parse(JSON.stringify(puzzle)), 'medium');
  assert.ok(parsed);
  assert.deepEqual(parsed.grid, puzzle.grid);
  assert.deepEqual(parsed.solution, puzzle.solution);
  assert.equal(parseStoredPuzzle(null, 'easy'), null);
  assert.equal(parseStoredPuzzle({ grid: [[1, 2]], solution: [] }, 'easy'), null);
  assert.equal(parseStoredPuzzle({ ...puzzle, solution: puzzle.solution.slice(1) }, 'medium'), null);
  const preset = presetPuzzle('hard', 1);
  assert.equal(preset.source, 'preset');
  assert.equal(validateHitori(preset.grid, preset.solution.flat()).isComplete, true);
});
