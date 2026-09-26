import { test } from 'node:test';
import assert from 'node:assert/strict';
import { areNeighbors, getDirection, generateProceduralBoard, getBoardSignature } from '../generator';
import {
  PRESET_BOARDS,
  EASY_BOARD_1,
  EASY_BOARD_2,
  MEDIUM_BOARD_SCREENSHOT,
  MEDIUM_BOARD_TECH,
  HARD_BOARD_1,
} from '../boards';
import { GENERAL_WORDS_BY_LENGTH } from '../lexicon';
import type { BoardDefinition } from '../types';
test('areNeighbors correctly identifies cardinal adjacent cells', () => {
  assert.equal(areNeighbors({ row: 1, col: 2 }, { row: 1, col: 3 }), true);
  assert.equal(areNeighbors({ row: 1, col: 2 }, { row: 1, col: 1 }), true);
  assert.equal(areNeighbors({ row: 1, col: 2 }, { row: 2, col: 2 }), true);
  assert.equal(areNeighbors({ row: 1, col: 2 }, { row: 0, col: 2 }), true);
  // Diagonal, identical, and distant cells must return false
  assert.equal(areNeighbors({ row: 1, col: 2 }, { row: 2, col: 3 }), false);
  assert.equal(areNeighbors({ row: 1, col: 2 }, { row: 0, col: 1 }), false);
  assert.equal(areNeighbors({ row: 1, col: 2 }, { row: 1, col: 2 }), false);
  assert.equal(areNeighbors({ row: 0, col: 0 }, { row: 4, col: 4 }), false);
});
test('getDirection returns correct directional arrow string', () => {
  assert.equal(getDirection({ row: 2, col: 1 }, { row: 1, col: 1 }), '^');
  assert.equal(getDirection({ row: 1, col: 1 }, { row: 2, col: 1 }), 'v');
  assert.equal(getDirection({ row: 1, col: 2 }, { row: 1, col: 1 }), '<');
  assert.equal(getDirection({ row: 1, col: 1 }, { row: 1, col: 2 }), '>');
  assert.equal(getDirection({ row: 1, col: 1 }, { row: 1, col: 1 }), '');
});
const validateBoardIntegrity = (
  board: BoardDefinition,
  expectedRows: number,
  expectedCols: number,
  expectedLetterCells?: number
) => {
  assert.equal(board.rows, expectedRows, `Expected rows to be ${expectedRows}`);
  assert.equal(board.cols, expectedCols, `Expected cols to be ${expectedCols}`);
  assert.equal(board.grid.length, expectedRows, 'Grid rows length mismatch');
  board.grid.forEach((row) => {
    assert.equal(row.length, expectedCols, 'Grid cols length mismatch');
  });
  const visited = new Set<string>();
  const wordsSet = new Set<string>();
  let totalLettersInWords = 0;
  board.words.forEach((wordSol) => {
    assert.ok(wordSol.word.length >= 2, `Word ${wordSol.word} must have at least 2 letters`);
    assert.equal(
      wordSol.word.length,
      wordSol.path.length,
      `Word ${wordSol.word} length does not match path length ${wordSol.path.length}`
    );
    assert.ok(!wordsSet.has(wordSol.word), `Duplicate word detected in board: ${wordSol.word}`);
    wordsSet.add(wordSol.word);
    totalLettersInWords += wordSol.word.length;
    wordSol.path.forEach((coord, idx) => {
      const key = `${coord.row},${coord.col}`;
      assert.ok(!visited.has(key), `Cell ${key} is visited multiple times (overlap detected)`);
      visited.add(key);
      assert.ok(coord.row >= 0 && coord.row < expectedRows, `Row ${coord.row} out of bounds`);
      assert.ok(coord.col >= 0 && coord.col < expectedCols, `Col ${coord.col} out of bounds`);
      const tile = board.grid[coord.row][coord.col];
      assert.equal(tile.letter, wordSol.word[idx], `Tile letter mismatch at (${coord.row},${coord.col})`);
      assert.equal(tile.wordId, wordSol.id, `Tile wordId mismatch at (${coord.row},${coord.col})`);
      assert.equal(tile.stepIndex, idx, `Tile stepIndex mismatch at (${coord.row},${coord.col})`);
      assert.equal(tile.isWall, false, `Word tile at (${coord.row},${coord.col}) must not be a wall`);
      if (idx === 0) {
        assert.equal(tile.isStart, true, 'Start tile flag mismatch');
      }
      if (idx === wordSol.path.length - 1) {
        assert.equal(tile.isEnd, true, 'End tile flag mismatch');
        assert.equal(tile.arrow, '', 'End tile must not have direction arrow');
      } else {
        const nextCoord = wordSol.path[idx + 1];
        assert.ok(
          areNeighbors(coord, nextCoord),
          `Path step ${idx} to ${idx + 1} in ${wordSol.word} is not adjacent`
        );
        const expectedArrow = getDirection(coord, nextCoord);
        assert.equal(
          tile.arrow,
          expectedArrow,
          `Tile arrow mismatch at (${coord.row},${coord.col})`
        );
      }
    });
  });
  const expectedLetters = expectedLetterCells ?? expectedRows * expectedCols;
  assert.equal(
    totalLettersInWords,
    expectedLetters,
    `Total word letters (${totalLettersInWords}) must equal expected letter count (${expectedLetters})`
  );
  assert.equal(
    visited.size,
    expectedLetters,
    `Coverage requirement failed: covered ${visited.size} of ${expectedLetters} letter cells`
  );
  // Verify non-word tiles are marked as walls
  for (let r = 0; r < expectedRows; r++) {
    for (let c = 0; c < expectedCols; c++) {
      const isWordCell = visited.has(`${r},${c}`);
      const tile = board.grid[r][c];
      if (!isWordCell) {
        assert.equal(tile.isWall, true, `Non-word tile at (${r},${c}) must be marked as wall`);
        assert.equal(tile.letter, '', `Non-word tile at (${r},${c}) must have empty letter`);
      }
    }
  }
};
test('EASY_BOARD_1 satisfies 100% grid coverage and valid path mechanics', () => {
  validateBoardIntegrity(EASY_BOARD_1, 5, 5);
});
test('EASY_BOARD_2 satisfies 100% grid coverage and valid path mechanics', () => {
  validateBoardIntegrity(EASY_BOARD_2, 5, 5);
});
test('MEDIUM_BOARD_SCREENSHOT satisfies reference layout and path mechanics', () => {
  validateBoardIntegrity(MEDIUM_BOARD_SCREENSHOT, 7, 7, 39);
});
test('MEDIUM_BOARD_TECH satisfies 100% grid coverage and valid path mechanics', () => {
  validateBoardIntegrity(MEDIUM_BOARD_TECH, 7, 6);
});
test('HARD_BOARD_1 satisfies 100% grid coverage and valid path mechanics', () => {
  validateBoardIntegrity(HARD_BOARD_1, 8, 8);
});
test('all PRESET_BOARDS pass integrity tests', () => {
  PRESET_BOARDS.easy.forEach((board) => validateBoardIntegrity(board, 5, 5));
  validateBoardIntegrity(PRESET_BOARDS.medium[0], 7, 7, 39);
  validateBoardIntegrity(PRESET_BOARDS.medium[1], 7, 6);
  PRESET_BOARDS.hard.forEach((board) => validateBoardIntegrity(board, 8, 8));
});
test('all words in GENERAL_WORDS_BY_LENGTH strictly match their length key', () => {
  Object.entries(GENERAL_WORDS_BY_LENGTH).forEach(([lenStr, words]) => {
    const len = Number(lenStr);
    words.forEach((w) => {
      assert.equal(w.length, len, `Word ${w} in length ${len} bucket has actual length ${w.length}`);
    });
  });
});
test('generateProceduralBoard generates valid non-overlapping 100% coverage board', () => {
  const easyBoard = generateProceduralBoard('easy', 'Nature & Earth');
  validateBoardIntegrity(easyBoard, 5, 5);
  const mediumBoard = generateProceduralBoard('medium', 'Tech & Computing');
  validateBoardIntegrity(mediumBoard, 6, 7);
  const hardBoard = generateProceduralBoard('hard', 'Space & Cosmos');
  validateBoardIntegrity(hardBoard, 8, 8);
});
test('generateProceduralBoard avoids excluded signatures and produces unique puzzles', () => {
  const board1 = generateProceduralBoard('easy');
  const sig1 = getBoardSignature(board1);
  const board2 = generateProceduralBoard('easy', { excludeSignatures: new Set([sig1]) });
  const sig2 = getBoardSignature(board2);
  assert.notEqual(sig1, sig2, 'Generated board must be distinct from excluded signature');
});
