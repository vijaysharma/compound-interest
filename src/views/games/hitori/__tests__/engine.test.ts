import test from 'node:test';
import assert from 'node:assert/strict';
import { validateHitori, getHint } from '../engine';
import { HITORI_PRESETS } from '../presets';
import type { CellState } from '../types';
test('validates correct Hitori solution', () => {
  const preset = HITORI_PRESETS.easy[0];
  const solution = preset.solution.flat();
  const res = validateHitori(preset.grid, solution);
  assert.equal(res.isComplete, true);
  assert.equal(res.violations.length, 0);
});
test('detects adjacent shaded cells violation', () => {
  const grid = [
    [1, 2],
    [2, 1],
  ];
  // Two adjacent shaded cells horizontally: (0,0) and (0,1)
  const states: CellState[] = ['shaded', 'shaded', 'circled', 'circled'];
  const res = validateHitori(grid, states);
  assert.equal(res.isComplete, false);
  assert.equal(res.violations.some((v) => v.type === 'adjacent_black'), true);
});
test('detects duplicate unshaded numbers violation', () => {
  const grid = [
    [2, 2],
    [1, 3],
  ];
  // Both are unshaded -> duplicate 2 in row 0
  const states: CellState[] = ['circled', 'circled', 'circled', 'circled'];
  const res = validateHitori(grid, states);
  assert.equal(res.isComplete, false);
  assert.equal(res.violations.some((v) => v.type === 'duplicate'), true);
});
test('detects isolated unshaded cells violation', () => {
  // 3x3 board where shading cuts a corner cell off
  const grid = [
    [1, 2, 3],
    [2, 3, 1],
    [3, 1, 2],
  ];
  // (0,1) and (1,0) shaded cuts off (0,0) from the rest of the board
  const states: CellState[] = [
    'circled', 'shaded', 'circled',
    'shaded', 'circled', 'circled',
    'circled', 'circled', 'circled',
  ];
  const res = validateHitori(grid, states);
  assert.equal(res.isComplete, false);
  assert.equal(res.violations.some((v) => v.type === 'isolated_white'), true);
});
test('hint provides guidance on sandwich rule and neighbor circling', () => {
  // Row with sandwich: 2, 5, 2
  const grid = [
    [2, 5, 2],
    [3, 1, 4],
    [4, 3, 1],
  ];
  const states: CellState[] = Array(9).fill('unmarked');
  const hint = getHint(grid, states);
  assert.ok(hint);
  assert.equal(hint.row, 0);
  assert.equal(hint.col, 1);
  assert.equal(hint.suggestedState, 'circled');
});
