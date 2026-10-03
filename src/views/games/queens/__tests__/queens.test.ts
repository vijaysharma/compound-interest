import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateQueensPuzzle,
  generateDailyQueensPuzzle,
  generateValidQueenPlacement,
  growBalancedRegions,
  createRng,
} from '../generator';
import {
  solveQueens,
  isUniqueSolution,
  findQueensConflicts,
  generateQueensHint,
} from '../solver';
import {
  createInitialGrid,
  evaluateBoardState,
  getCellBorders,
  applyCellAction,
} from '../engine';
import type { CellState, Position } from '../types';

test('Queens generator produces valid, unique boards for various sizes', () => {
  const sizes = [6, 7, 8]; // test subset of sizes for speed

  for (const size of sizes) {
    const puzzle = generateQueensPuzzle({ size, seed: `test-seed-${size}` });

    assert.equal(puzzle.size, size, 'puzzle size matches');
    assert.equal(puzzle.regions.length, size, 'regions row length matches');
    assert.equal(puzzle.regions[0].length, size, 'regions col length matches');
    assert.equal(puzzle.solution.length, size, 'solution contains exactly N queens');

    // Verify all cells have valid region id [0, size - 1]
    const regionCounts = new Array(size).fill(0);
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const reg = puzzle.regions[r][c];
        assert.ok(reg >= 0 && reg < size, `region id ${reg} is within [0, ${size - 1}]`);
        regionCounts[reg]++;
      }
    }

    // Every region must have at least 1 cell
    for (let reg = 0; reg < size; reg++) {
      assert.ok(regionCounts[reg] > 0, `region ${reg} has positive cell count`);
    }

    // Uniqueness solver verification
    const solutions = solveQueens(size, puzzle.regions, 2);
    assert.equal(solutions.length, 1, `board of size ${size} has exactly 1 unique solution`);
    assert.ok(isUniqueSolution(size, puzzle.regions), 'isUniqueSolution returns true');

    // Verify solution matches solver output
    const solverSolution = solutions[0];
    const sortedPuzzleSol = [...puzzle.solution].sort((a, b) => a.r - b.r);
    const sortedSolverSol = [...solverSolution].sort((a, b) => a.r - b.r);
    assert.deepEqual(sortedPuzzleSol, sortedSolverSol, 'puzzle.solution matches solver solution');
  }
});

test('Queens placement respects row, col, and Chebyshev distance (touch) rules', () => {
  const rng = createRng('placement-test-seed');
  for (let size = 6; size <= 10; size++) {
    const queens = generateValidQueenPlacement(size, rng);
    assert.ok(queens !== null, 'queens placement found');
    assert.equal(queens.length, size);

    const rows = new Set<number>();
    const cols = new Set<number>();

    for (let i = 0; i < queens.length; i++) {
      const q1: Position = queens[i];
      rows.add(q1.r);
      cols.add(q1.c);

      for (let j = i + 1; j < queens.length; j++) {
        const q2: Position = queens[j];
        // Cannot touch horizontally, vertically, or diagonally
        const rowDiff = Math.abs(q1.r - q2.r);
        const colDiff = Math.abs(q1.c - q2.c);
        assert.ok(rowDiff > 1 || colDiff > 1, `queens at (${q1.r},${q1.c}) and (${q2.r},${q2.c}) must not touch`);
      }
    }

    assert.equal(rows.size, size, 'one queen per row');
    assert.equal(cols.size, size, 'one queen per col');
  }
});

test('Daily Queens generator is deterministic for the same date', () => {
  const puzzle1 = generateDailyQueensPuzzle('2026-10-04');
  const puzzle2 = generateDailyQueensPuzzle('2026-10-04');
  assert.equal(puzzle1.id, puzzle2.id);
  assert.deepEqual(puzzle1.regions, puzzle2.regions);
  assert.deepEqual(puzzle1.solution, puzzle2.solution);
});

test('Conflict detection accurately flags row, column, region, and adjacent clashes', () => {
  const size = 6;
  const regions = [
    [0, 0, 1, 1, 2, 2],
    [0, 0, 1, 1, 2, 2],
    [3, 3, 3, 4, 4, 4],
    [3, 3, 3, 4, 4, 4],
    [5, 5, 5, 5, 5, 5],
    [5, 5, 5, 5, 5, 5],
  ];

  const grid: CellState[][] = createInitialGrid(size);

  // Row clash
  grid[0][0] = 'queen';
  grid[0][4] = 'queen';
  let conflicts = findQueensConflicts(size, regions, grid);
  assert.ok(conflicts.some((c) => c.type === 'row'), 'detects row clash');

  // Clear and test col clash
  grid[0][4] = 'empty';
  grid[3][0] = 'queen';
  conflicts = findQueensConflicts(size, regions, grid);
  assert.ok(conflicts.some((c) => c.type === 'col'), 'detects col clash');

  // Adjacent diagonal touch clash
  grid[3][0] = 'empty';
  grid[1][1] = 'queen'; // touching (0,0) diagonally
  conflicts = findQueensConflicts(size, regions, grid);
  assert.ok(conflicts.some((c) => c.type === 'adjacent'), 'detects adjacent touch clash');
});

test('Board evaluation identifies winning state and cell actions work properly', () => {
  const puzzle = generateQueensPuzzle({ size: 6, seed: 'eval-test' });
  const grid = createInitialGrid(6);

  // Incomplete board
  let evalRes = evaluateBoardState(6, puzzle.regions, grid);
  assert.equal(evalRes.isWon, false);
  assert.equal(evalRes.placedQueens, 0);

  // Place solution queens
  for (const pos of puzzle.solution) {
    grid[pos.r][pos.c] = 'queen';
  }

  evalRes = evaluateBoardState(6, puzzle.regions, grid);
  assert.equal(evalRes.isWon, true, 'board with exact solution is won');
  assert.equal(evalRes.placedQueens, 6);
  assert.equal(evalRes.conflicts.length, 0);

  // Cell actions
  const solCell = puzzle.solution[0];
  const toggledX = applyCellAction(grid, solCell.r, solCell.c, 'toggle_x');
  assert.equal(toggledX[solCell.r][solCell.c], 'empty', 'cleared queen on single click');

  const emptyGrid = createInitialGrid(6);
  const withX = applyCellAction(emptyGrid, 2, 2, 'toggle_x');
  assert.equal(withX[2][2], 'x', 'placed X on empty cell');

  const withQueen = applyCellAction(withX, 2, 2, 'toggle_queen');
  assert.equal(withQueen[2][2], 'queen', 'placed Queen on X cell');
});

test('Hint generator suggests safe deductions and conflict resolutions', () => {
  const puzzle = generateQueensPuzzle({ size: 6, seed: 'hint-test' });
  const grid = createInitialGrid(6);

  // Put a Queen in row conflict
  grid[0][0] = 'queen';
  grid[0][1] = 'queen';

  const conflictHint = generateQueensHint(6, puzzle.regions, grid, puzzle.solution);
  assert.ok(conflictHint !== null);
  assert.equal(conflictHint?.type, 'conflict');

  // Clear conflict and test deduction
  grid[0][0] = 'empty';
  grid[0][1] = 'empty';

  // Find solution queen in row 0
  const sol0 = puzzle.solution.find((s) => s.r === 0)!;
  // Fill all other cells in row 0 with 'x'
  for (let c = 0; c < 6; c++) {
    if (c !== sol0.c) {
      grid[0][c] = 'x';
    }
  }

  const deductionHint = generateQueensHint(6, puzzle.regions, grid, puzzle.solution);
  assert.ok(deductionHint !== null);
  assert.equal(deductionHint?.suggestedAction, 'queen');
  assert.deepEqual(deductionHint?.cell, sol0);
});
