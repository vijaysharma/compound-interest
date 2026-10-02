import test from 'node:test';
import assert from 'node:assert/strict';
import { CLUE_BANDS, countSolutions, generatePuzzle, gradePuzzle, hasUniqueSolution, solveSudoku } from '../generator';
import { PRESET_SUDOKU } from '../presets';
test('generatePuzzle produces 9x9 grid with valid clue counts for each difficulty', () => {
  const easy = generatePuzzle('easy');
  assert.equal(easy.initial.length, 9);
  assert.equal(easy.solution.length, 9);
  const medium = generatePuzzle('medium');
  assert.equal(medium.initial.length, 9);
  assert.equal(medium.solution.length, 9);
  const hard = generatePuzzle('hard');
  assert.equal(hard.initial.length, 9);
  assert.equal(hard.solution.length, 9);
});
test('PRESET_SUDOKU contains valid solutions where each row, column, and 3x3 block has 1-9', () => {
  (['easy', 'medium', 'hard'] as const).forEach((diff) => {
    const preset = PRESET_SUDOKU[diff];
    const solution = preset.solution;
    assert.equal(solution.length, 9);
    for (let r = 0; r < 9; r++) {
      const rowDigits = new Set(solution[r]);
      assert.equal(rowDigits.size, 9);
      for (let n = 1; n <= 9; n++) {
        assert.equal(rowDigits.has(n), true);
      }
    }
    for (let c = 0; c < 9; c++) {
      const colDigits = new Set(solution.map((row) => row[c]));
      assert.equal(colDigits.size, 9);
    }
    for (let br = 0; br < 9; br += 3) {
      for (let bc = 0; bc < 9; bc += 3) {
        const boxDigits = new Set<number>();
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            boxDigits.add(solution[br + r][bc + c]);
          }
        }
        assert.equal(boxDigits.size, 9);
      }
    }
  });
});
const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
const clueCount = (grid: number[][]) => grid.flat().filter(Boolean).length;
test('generated puzzles have exactly one solution that matches the returned solution', () => {
  DIFFICULTIES.forEach((diff) => {
    for (let i = 0; i < 25; i++) {
      const { initial, solution } = generatePuzzle(diff);
      assert.equal(hasUniqueSolution(initial), true, `${diff} puzzle is not unique`);
      const solved = initial.map((row) => [...row]);
      assert.equal(solveSudoku(solved), true);
      assert.deepEqual(solved, solution);
      initial.flat().forEach((v, idx) => {
        if (v) assert.equal(v, solution.flat()[idx]);
      });
    }
  });
});
test('countSolutions detects multiple solutions and leaves the grid untouched', () => {
  const empty = Array.from({ length: 9 }, () => Array(9).fill(0));
  assert.equal(countSolutions(empty, { val: 0 }, 2), 2);
  assert.equal(empty.flat().every((v) => v === 0), true);
  assert.equal(hasUniqueSolution(PRESET_SUDOKU.hard.initial), true);
});
test('difficulty levels use separated clue bands and logical grades', () => {
  DIFFICULTIES.forEach((diff) => {
    for (let i = 0; i < 30; i++) {
      const { initial } = generatePuzzle(diff);
      const clues = clueCount(initial);
      assert.ok(clues >= CLUE_BANDS[diff].min && clues <= CLUE_BANDS[diff].max, `${diff} clues ${clues}`);
      const grade = gradePuzzle(initial);
      if (diff === 'easy') assert.equal(grade, 1, 'easy puzzles must be solvable with singles only');
      if (diff === 'hard') assert.ok(grade >= 2, 'hard puzzles must need more than singles');
    }
  });
  assert.ok(CLUE_BANDS.easy.min > CLUE_BANDS.medium.max);
  assert.ok(CLUE_BANDS.medium.min > CLUE_BANDS.hard.max);
});
test('generated puzzles are distinct across many sessions and generate quickly', () => {
  DIFFICULTIES.forEach((diff) => {
    const seen = new Set<string>();
    const start = performance.now();
    for (let i = 0; i < 100; i++) seen.add(generatePuzzle(diff).initial.flat().join(''));
    const avgMs = (performance.now() - start) / 100;
    assert.equal(seen.size, 100, `${diff} produced repeated puzzles`);
    assert.ok(avgMs < 50, `${diff} average generation ${avgMs.toFixed(1)}ms`);
  });
});
