import type { SudokuDifficulty } from './types';
export function isValid(grid: number[][], r: number, c: number, val: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (grid[r][i] === val) return false;
    if (grid[i][c] === val) return false;
  }
  const boxRow = Math.floor(r / 3) * 3;
  const boxCol = Math.floor(c / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[boxRow + i][boxCol + j] === val) return false;
    }
  }
  return true;
}
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function solveSudoku(grid: number[][]): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of nums) {
          if (isValid(grid, r, c, num)) {
            grid[r][c] = num;
            if (solveSudoku(grid)) return true;
            grid[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}
export function countSolutions(grid: number[][], count = { val: 0 }, limit = 2): number {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValid(grid, r, c, num)) {
            grid[r][c] = num;
            countSolutions(grid, count, limit);
            grid[r][c] = 0;
            if (count.val >= limit) return count.val;
          }
        }
        return count.val;
      }
    }
  }
  count.val++;
  return count.val;
}
export function generateFullBoard(): number[][] {
  const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
  for (let box = 0; box < 9; box += 3) {
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    let idx = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        grid[box + r][box + c] = nums[idx++];
      }
    }
  }
  solveSudoku(grid);
  return grid;
}
export function generatePuzzle(difficulty: SudokuDifficulty): { initial: number[][]; solution: number[][] } {
  const solution = generateFullBoard();
  const puzzle = solution.map((row) => [...row]);
  const cluesMap: Record<SudokuDifficulty, number> = {
    easy: 38,
    medium: 30,
    hard: 25,
  };
  const targetClues = cluesMap[difficulty];
  const positions: [number, number][] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push([r, c]);
    }
  }
  const shuffledPositions = shuffle(positions);
  let clues = 81;
  for (const [r, c] of shuffledPositions) {
    if (clues <= targetClues) break;
    const temp = puzzle[r][c];
    puzzle[r][c] = 0;
    const copy = puzzle.map((row) => [...row]);
    const solCount = { val: 0 };
    countSolutions(copy, solCount, 2);
    if (solCount.val !== 1) {
      puzzle[r][c] = temp;
    } else {
      clues--;
    }
  }
  return { initial: puzzle, solution };
}
