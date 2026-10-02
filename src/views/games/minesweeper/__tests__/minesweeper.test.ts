import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkWinCondition,
  createEmptyBoard,
  floodFillReveal,
  getNeighbors,
  populateMines,
} from '../engine';
import { getPreset } from '../types';
test('createEmptyBoard initializes all cells to hidden and 0 neighbors', () => {
  const board = createEmptyBoard(9, 9);
  assert.equal(board.length, 9);
  assert.equal(board[0].length, 9);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      assert.equal(board[r][c].state, 'hidden');
      assert.equal(board[r][c].isMine, false);
      assert.equal(board[r][c].neighborMines, 0);
    }
  }
});
test('populateMines guarantees first-click safety for target cell and its neighbors', () => {
  const board = createEmptyBoard(9, 9);
  populateMines(board, 9, 9, 10, 4, 4);
  assert.equal(board[4][4].isMine, false);
  const neighbors = getNeighbors(4, 4, 9, 9);
  for (const [nr, nc] of neighbors) {
    assert.equal(board[nr][nc].isMine, false);
  }
  let totalMines = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c].isMine) totalMines++;
    }
  }
  assert.equal(totalMines, 10);
});
test('floodFillReveal reveals adjacent zero-mine cells recursively', () => {
  const board = createEmptyBoard(5, 5);
  board[4][4].isMine = true;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (board[r][c].isMine) continue;
      const nb = getNeighbors(r, c, 5, 5);
      board[r][c].neighborMines = nb.filter(([nr, nc]) => board[nr][nc].isMine).length;
    }
  }
  floodFillReveal(board, 0, 0, 5, 5);
  assert.equal(board[0][0].state, 'revealed');
  assert.equal(board[1][1].state, 'revealed');
  assert.equal(board[4][4].state, 'hidden');
});
test('checkWinCondition detects game win when all non-mine cells are revealed', () => {
  const board = createEmptyBoard(3, 3);
  board[0][0].isMine = true;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (!board[r][c].isMine) {
        board[r][c].state = 'revealed';
      }
    }
  }
  assert.equal(checkWinCondition(board, 3, 3, 1), true);
  board[0][1].state = 'hidden';
  assert.equal(checkWinCondition(board, 3, 3, 1), false);
});
test('getPreset selects responsive grid presets for web and mobile', () => {
  const webEasy = getPreset('easy', false);
  assert.equal(webEasy.cols, 9);
  assert.equal(webEasy.rows, 9);
  const webMed = getPreset('medium', false);
  assert.equal(webMed.cols, 16);
  assert.equal(webMed.rows, 16);
  const webHard = getPreset('hard', false);
  assert.equal(webHard.cols, 24);
  assert.equal(webHard.rows, 24);
  const mobEasy = getPreset('easy', true);
  assert.equal(mobEasy.cols, 9);
  assert.equal(mobEasy.rows, 9);
  const mobMed = getPreset('medium', true);
  assert.equal(mobMed.cols, 14);
  assert.equal(mobMed.rows, 16);
  const mobHard = getPreset('hard', true);
  assert.equal(mobHard.cols, 14);
  assert.equal(mobHard.rows, 20);
});
const DIFFS = ['easy', 'medium', 'hard'] as const;
const layoutKey = (board: ReturnType<typeof createEmptyBoard>) =>
  board.flat().map((cell) => (cell.isMine ? '1' : '0')).join('');
test('every preset places the exact mine count with a safe 3x3 opening anywhere, including corners', () => {
  [false, true].forEach((isMobile) => {
    DIFFS.forEach((diff) => {
      const { rows, cols, mines } = getPreset(diff, isMobile);
      const clicks: [number, number][] = [[0, 0], [rows - 1, cols - 1], [0, cols - 1], [Math.floor(rows / 2), Math.floor(cols / 2)]];
      for (const [r, c] of clicks) {
        for (let i = 0; i < 20; i++) {
          const board = createEmptyBoard(rows, cols);
          populateMines(board, rows, cols, mines, r, c);
          assert.equal(board.flat().filter((cell) => cell.isMine).length, mines);
          assert.equal(board[r][c].isMine, false);
          assert.equal(board[r][c].neighborMines, 0, 'first click must open a cascade');
          for (const [nr, nc] of getNeighbors(r, c, rows, cols)) assert.equal(board[nr][nc].isMine, false);
          board.flat().forEach((cell) => {
            if (cell.isMine) return;
            const expected = getNeighbors(cell.row, cell.col, rows, cols).filter(([nr, nc]) => board[nr][nc].isMine).length;
            assert.equal(cell.neighborMines, expected);
          });
        }
      }
    });
  });
});
test('mine density rises with difficulty on both web and mobile presets', () => {
  [false, true].forEach((isMobile) => {
    const density = DIFFS.map((diff) => {
      const { rows, cols, mines } = getPreset(diff, isMobile);
      return mines / (rows * cols);
    });
    assert.ok(density[0] < density[1] && density[1] < density[2], `densities ${density.join(', ')}`);
  });
});
test('mine layouts are distinct across many games and populate quickly', () => {
  DIFFS.forEach((diff) => {
    const { rows, cols, mines } = getPreset(diff, false);
    const seen = new Set<string>();
    const start = performance.now();
    for (let i = 0; i < 200; i++) {
      const board = createEmptyBoard(rows, cols);
      populateMines(board, rows, cols, mines, 0, 0);
      seen.add(layoutKey(board));
    }
    const avgMs = (performance.now() - start) / 200;
    assert.equal(seen.size, 200);
    assert.ok(avgMs < 20, `${diff} average populate ${avgMs.toFixed(2)}ms`);
  });
});
test('floodFillReveal never reveals a mine and stops at numbered borders', () => {
  const { rows, cols, mines } = getPreset('hard', false);
  for (let i = 0; i < 20; i++) {
    const board = createEmptyBoard(rows, cols);
    populateMines(board, rows, cols, mines, 5, 5);
    floodFillReveal(board, 5, 5, rows, cols);
    board.flat().forEach((cell) => {
      if (cell.isMine) assert.equal(cell.state, 'hidden');
    });
  }
});
