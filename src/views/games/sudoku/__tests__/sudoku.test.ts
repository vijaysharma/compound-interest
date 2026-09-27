import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePuzzle } from '../generator';
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
