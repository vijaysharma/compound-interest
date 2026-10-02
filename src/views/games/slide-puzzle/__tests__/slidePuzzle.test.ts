import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canSlide,
  countInversions,
  getShuffledBoard,
  INITIAL_BOARD,
  isSolvable,
  manhattanDistance,
  MIN_SCRAMBLE_DISTANCE,
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
  assert.equal(res.moves.length, 1);
  assert.equal(res.moves[0].directionRelativeToBlank, 'UP');
  assert.equal(res.moves[0].fromIndex, 10);
  assert.equal(res.moves[0].toIndex, 6);
  assert.equal(res.moves[0].tileValue, 7);
});
test('directional relative movement tracking records single and multi-tile movements', () => {
  // Blank at index 5 (row 1, col 1)
  const board = [
    1, 2, 3, 4,
    5, 0, 7, 8,
    9, 10, 11, 12,
    13, 14, 15, 16,
  ];
  // Tile 2 at index 1 is ABOVE blank (index 5) -> slides DOWN into blank
  const downRes = slideTiles(board, 1);
  assert.ok(downRes);
  assert.equal(downRes.moves.length, 1);
  assert.equal(downRes.moves[0].directionRelativeToBlank, 'DOWN');
  assert.equal(downRes.moves[0].fromIndex, 1);
  assert.equal(downRes.moves[0].toIndex, 5);
  assert.equal(downRes.moves[0].tileValue, 2);
  // Tile 10 at index 9 is BELOW blank (index 5) -> slides UP into blank
  const upRes = slideTiles(board, 9);
  assert.ok(upRes);
  assert.equal(upRes.moves.length, 1);
  assert.equal(upRes.moves[0].directionRelativeToBlank, 'UP');
  assert.equal(upRes.moves[0].fromIndex, 9);
  assert.equal(upRes.moves[0].toIndex, 5);
  assert.equal(upRes.moves[0].tileValue, 10);
  // Tile 5 at index 4 is LEFT of blank (index 5) -> slides RIGHT into blank
  const rightRes = slideTiles(board, 4);
  assert.ok(rightRes);
  assert.equal(rightRes.moves.length, 1);
  assert.equal(rightRes.moves[0].directionRelativeToBlank, 'RIGHT');
  assert.equal(rightRes.moves[0].fromIndex, 4);
  assert.equal(rightRes.moves[0].toIndex, 5);
  assert.equal(rightRes.moves[0].tileValue, 5);
  // Tile 7 at index 6 is RIGHT of blank (index 5) -> slides LEFT into blank
  const leftRes = slideTiles(board, 6);
  assert.ok(leftRes);
  assert.equal(leftRes.moves.length, 1);
  assert.equal(leftRes.moves[0].directionRelativeToBlank, 'LEFT');
  assert.equal(leftRes.moves[0].fromIndex, 6);
  assert.equal(leftRes.moves[0].toIndex, 5);
  assert.equal(leftRes.moves[0].tileValue, 7);
});
test('multi-tile line slide tracks all intermediate movements relative to blank', () => {
  // Blank at index 0 (row 0, col 0)
  const board = [
    0, 2, 3, 4,
    5, 6, 7, 8,
    9, 10, 11, 12,
    13, 14, 15, 16,
  ];
  // Click index 3 (row 0, col 3) -> tiles 2, 3, 4 slide LEFT towards blank at 0
  const lineRes = slideTiles(board, 3);
  assert.ok(lineRes);
  assert.equal(lineRes.moves.length, 3);
  // First tile moving is at index 1 into 0
  assert.equal(lineRes.moves[0].fromIndex, 1);
  assert.equal(lineRes.moves[0].toIndex, 0);
  assert.equal(lineRes.moves[0].directionRelativeToBlank, 'LEFT');
  assert.equal(lineRes.moves[0].tileValue, 2);
  // Second tile moving is at index 2 into 1
  assert.equal(lineRes.moves[1].fromIndex, 2);
  assert.equal(lineRes.moves[1].toIndex, 1);
  assert.equal(lineRes.moves[1].directionRelativeToBlank, 'LEFT');
  assert.equal(lineRes.moves[1].tileValue, 3);
  // Third tile moving is at index 3 into 2
  assert.equal(lineRes.moves[2].fromIndex, 3);
  assert.equal(lineRes.moves[2].toIndex, 2);
  assert.equal(lineRes.moves[2].directionRelativeToBlank, 'LEFT');
  assert.equal(lineRes.moves[2].tileValue, 4);
});
test('slideTileInDirection slides aligned tiles towards blank and ignores wrong directions', () => {
  // Blank at index 15 (row 3, col 3)
  const board = [
    1, 2, 3, 4,
    5, 6, 7, 8,
    9, 10, 11, 12,
    13, 14, 15, 0,
  ];
  // Tile 13 at index 12: blank is to the right. Swiping 'right' should slide
  const validSwipe = slideInDirection(board, 'right');
  assert.ok(validSwipe);
  assert.equal(validSwipe.newTiles[15], 15);
  // Swiping 'left' from index 12 (away from blank) should not move
  // Note: slideInDirection('left') checks targetCol = blankCol + 1 = 4 (out of bounds) -> null
  const invalidSwipe = slideInDirection(board, 'left');
  assert.equal(invalidSwipe, null);
});
test('isSolvable agrees with boards reached by real moves from the solved state', () => {
  const dirs = ['up', 'down', 'left', 'right'] as const;
  for (let trial = 0; trial < 50; trial++) {
    let tiles = Array.from({ length: 16 }, (_, i) => (i === 15 ? 0 : i + 1));
    for (let step = 0; step < 200; step++) {
      const result = slideInDirection(tiles, dirs[Math.floor(Math.random() * 4)]);
      if (result) tiles = result.newTiles;
    }
    assert.equal(isSolvable(tiles), true);
    const swapped = [...tiles];
    const a = swapped.findIndex((t) => t !== 0);
    const b = swapped.findIndex((t, i) => i > a && t !== 0);
    [swapped[a], swapped[b]] = [swapped[b], swapped[a]];
    assert.equal(isSolvable(swapped), false);
  }
});
test('shuffles are well scrambled, distinct, and fast', () => {
  const seen = new Set<string>();
  const start = performance.now();
  for (let i = 0; i < 500; i++) {
    const board = getShuffledBoard();
    assert.equal(isSolvable(board), true);
    assert.ok(manhattanDistance(board) >= MIN_SCRAMBLE_DISTANCE, `near-solved board ${board.join(',')}`);
    seen.add(board.join(','));
  }
  assert.equal(seen.size, 500);
  assert.ok((performance.now() - start) / 500 < 5);
});
test('the server-render INITIAL_BOARD is a valid solvable scramble', () => {
  const board = [...INITIAL_BOARD];
  assert.equal(new Set(board).size, 16);
  assert.equal(isSolvable(board), true);
  assert.equal(isSolved(board), false);
  assert.ok(manhattanDistance(board) >= MIN_SCRAMBLE_DISTANCE);
});
