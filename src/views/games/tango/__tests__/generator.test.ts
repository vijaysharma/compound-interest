import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  TANGO_DIFFICULTY_SPECS,
  countTangoSolutions,
  createSeededRng,
  generateTangoPuzzle,
  gradeTangoPuzzle,
} from '../generator';
import { validateTango } from '../engine';
import type { TangoCellVal, TangoDifficulty, TangoPreset } from '../types';
const DIFFICULTIES: TangoDifficulty[] = ['easy', 'medium', 'hard'];
const PER_DIFFICULTY = 40;
const assertValidSolution = (p: TangoPreset) => {
  const n = p.size;
  const s = p.solution;
  const lines = [...s, ...Array.from({ length: n }, (_, c) => s.map((row) => row[c]))];
  for (const line of lines) {
    assert.equal(line.filter((v) => v === 1).length, n / 2, 'balanced line');
    assert.equal(line.filter((v) => v === 2).length, n / 2, 'balanced line');
    for (let i = 0; i + 2 < n; i++) {
      assert.ok(!(line[i] === line[i + 1] && line[i] === line[i + 2]), 'no three in a row');
    }
  }
  for (const h of p.horizontalSigns) {
    assert.equal(s[h.row][h.col] === s[h.row][h.col + 1], h.sign === '=', 'horizontal sign holds');
  }
  for (const v of p.verticalSigns) {
    assert.equal(s[v.row][v.col] === s[v.row + 1][v.col], v.sign === '=', 'vertical sign holds');
  }
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (p.initialGrid[r][c] !== 0) assert.equal(p.initialGrid[r][c], s[r][c], 'givens match solution');
    }
  }
  const result = validateTango(s as TangoCellVal[][], p);
  assert.ok(result.isComplete, 'engine accepts the solution');
};
for (const difficulty of DIFFICULTIES) {
  test(`${difficulty}: generated puzzles are valid, unique, correctly graded and distinct`, () => {
    const rng = createSeededRng(difficulty.length * 7919);
    const spec = TANGO_DIFFICULTY_SPECS[difficulty];
    const signatures = new Set<string>();
    const recent: string[] = [];
    for (let i = 0; i < PER_DIFFICULTY; i++) {
      const p = generateTangoPuzzle({ difficulty, rng, avoidSignatures: recent });
      assert.equal(p.size, 6);
      assertValidSolution(p);
      assert.equal(countTangoSolutions(p, 2), 1, 'exactly one solution');
      const grade = gradeTangoPuzzle(p);
      assert.ok(grade.solved, 'solvable by logic alone');
      assert.equal(grade.level, spec.level, 'grade matches difficulty');
      assert.deepEqual(grade.grid, p.solution, 'logic solver reaches the stored solution');
      const givens = p.initialGrid.flat().filter((v) => v !== 0).length;
      const signs = p.horizontalSigns.length + p.verticalSigns.length;
      assert.ok(givens + signs >= spec.minClues && givens + signs <= spec.maxClues, 'clue count in range');
      assert.ok(signs >= spec.minSigns && signs <= spec.maxSigns, 'sign count in range');
      assert.ok(!recent.includes(p.signature), 'does not repeat a recent puzzle');
      signatures.add(p.signature);
      recent.unshift(p.signature);
    }
    assert.equal(signatures.size, PER_DIFFICULTY, 'all puzzles distinct');
  });
}
test('difficulty levels are ordered by clue count on average', () => {
  const rng = createSeededRng(42);
  const avg = (d: TangoDifficulty) => {
    let total = 0;
    for (let i = 0; i < 20; i++) {
      const p = generateTangoPuzzle({ difficulty: d, rng });
      total += p.initialGrid.flat().filter((v) => v !== 0).length + p.horizontalSigns.length + p.verticalSigns.length;
    }
    return total / 20;
  };
  const easy = avg('easy');
  const medium = avg('medium');
  const hard = avg('hard');
  assert.ok(easy > medium && medium > hard, `expected easy > medium > hard, got ${easy}, ${medium}, ${hard}`);
});
test('grader rejects an under-constrained puzzle', () => {
  const empty: TangoPreset = {
    id: 'empty',
    title: 'empty',
    size: 6,
    initialGrid: Array.from({ length: 6 }, () => Array(6).fill(0)),
    solution: Array.from({ length: 6 }, () => Array(6).fill(1)),
    horizontalSigns: [],
    verticalSigns: [],
  };
  assert.equal(gradeTangoPuzzle(empty).solved, false);
  assert.equal(countTangoSolutions(empty, 2), 2);
});
test('unseeded generation is randomised per game', () => {
  const a = generateTangoPuzzle({ difficulty: 'easy' });
  const b = generateTangoPuzzle({ difficulty: 'easy', avoidSignatures: [a.signature] });
  assert.notEqual(a.signature, b.signature);
});
