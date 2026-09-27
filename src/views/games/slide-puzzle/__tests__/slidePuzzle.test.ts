import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canSlide,
  countInversions,
  getShuffledBoard,
  isSolvable,
  isSolved,
  slideInDirection,
  slideTiles,
} from '../engine';
test('isSolved identifies solved state and reject scrambled state', () => {
  const solved = Array.from({ length: 16 }, (_, i) => (i === 15 ? 0 : i + 1));
  assert.equal(isSolved(solved), true);
  const scrambled = [...solved];
  [scrambled[0], scrambled[1]] = [scrambled[1], scrambled[0]];
  assert.equal(isSolved(scrambled), false);
});
test('countInversions counts out-of-order pairs correctly ignoring blank', () => {
  const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 14, 0];
  assert.equal(countInversions(arr), 1);
});
test('isSolvable applies the 4x4 parity rule correctly', () => {
  const solved = Array.from({ length: 16 }, (_, i) => (i === 15 ? 0 : i + 1));
  assert.equal(isSolvable(solved), true);
  const unsolvable = [...solved];
  [unsolvable[0], unsolvable[1]] = [unsolvable[1], unsolvable[0]];
  assert.equal(isSolvable(unsolvable), false);
});
test('getShuffledBoard produces valid, solvable, unsolved boards', () => {
  for (let i = 0; i < 50; i++) {
    const board = getShuffledBoard();
    assert.equal(board.length, 16);
    assert.equal(isSolvable(board), true);
    assert.equal(isSolved(board), false);
    for (let num = 0; num < 16; num++) {
      assert.equal(board.includes(num), true);
    }
  }
});
test('canSlide identifies tiles in same row or column as blank', () => {
  const board = [
    1, 2, 3, 4,
    5, 6, 7, 8,
    9, 10, 11, 12,
    13, 14, 0, 15,
  ];
  assert.equal(canSlide(board, 12), true);
  assert.equal(canSlide(board, 13), true);
  assert.equal(canSlide(board, 15), true);
  assert.equal(canSlide(board, 2), true);
  assert.equal(canSlide(board, 6), true);
  assert.equal(canSlide(board, 10), true);
  assert.equal(canSlide(board, 0), false);
  assert.equal(canSlide(board, 5), false);
  assert.equal(canSlide(board, 14), false);
});
test('slideTiles shifts row tiles towards blank space', () => {
  const board = [
    1, 2, 3, 4,
    5, 6, 7, 8,
    9, 10, 11, 12,
    13, 14, 15, 0,
  ];
  const res = slideTiles(board, 12);
  assert.ok(res);
  assert.equal(res.movedCount, 3);
  assert.equal(res.newTiles[12], 0);
  assert.equal(res.newTiles[13], 13);
  assert.equal(res.newTiles[14], 14);
  assert.equal(res.newTiles[15], 15);
});
test('slideTiles shifts column tiles towards blank space', () => {
  const board = [
    1, 2, 3, 4,
    5, 6, 7, 8,
    9, 10, 11, 12,
    13, 14, 15, 0,
  ];
  const res = slideTiles(board, 3);
  assert.ok(res);
  assert.equal(res.movedCount, 3);
  assert.equal(res.newTiles[3], 0);
  assert.equal(res.newTiles[7], 4);
  assert.equal(res.newTiles[11], 8);
  assert.equal(res.newTiles[15], 12);
});
test('slideInDirection moves adjacent tile in given direction', () => {
  const board = [
    1, 2, 3, 4,
    5, 6, 0, 8,
    9, 10, 7, 12,
    13, 14, 11, 15,
  ];
  const res = slideInDirection(board, 'up');
  assert.ok(res);
  assert.equal(res.newTiles[6], 7);
  assert.equal(res.newTiles[10], 0);
});
