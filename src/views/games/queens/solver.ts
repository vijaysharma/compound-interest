import type { Position, CellState, QueensHint, QueensConflict } from './types';

/**
 * Fast backtracking solver for Queens puzzle
 * Finds up to maxSolutions placements of N queens on an N x N board.
 */
export function solveQueens(
  size: number,
  regions: number[][],
  maxSolutions = 2
): Position[][] {
  const solutions: Position[][] = [];
  const queens: number[] = new Array(size).fill(-1); // queens[r] = col

  function backtrack(r: number, usedCols: number, usedRegions: number): void {
    if (solutions.length >= maxSolutions) return;

    if (r === size) {
      solutions.push(queens.map((c, row) => ({ r: row, c })));
      return;
    }

    const prevCol = r > 0 ? queens[r - 1] : -99;

    for (let c = 0; c < size; c++) {
      // 1. Column already taken?
      if ((usedCols & (1 << c)) !== 0) continue;

      // 2. Touch rule: cannot touch queen in row r - 1
      if (Math.abs(prevCol - c) <= 1) continue;

      // 3. Region already taken?
      const reg = regions[r][c];
      if (reg < 0 || (usedRegions & (1 << reg)) !== 0) continue;

      // Place queen at (r, c)
      queens[r] = c;
      backtrack(r + 1, usedCols | (1 << c), usedRegions | (1 << reg));
      queens[r] = -1;

      if (solutions.length >= maxSolutions) return;
    }
  }

  backtrack(0, 0, 0);
  return solutions;
}

/**
 * Returns true if and only if the puzzle has exactly ONE unique solution
 */
export function isUniqueSolution(size: number, regions: number[][]): boolean {
  const solutions = solveQueens(size, regions, 2);
  return solutions.length === 1;
}

/**
 * Checks all placed queens for rule conflicts:
 * - Same row
 * - Same column
 * - Same region
 * - Touching (adjacent horizontally, vertically, or diagonally)
 */
export function findQueensConflicts(
  size: number,
  regions: number[][],
  grid: CellState[][]
): QueensConflict[] {
  const conflicts: QueensConflict[] = [];
  const queens: Position[] = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 'queen') {
        queens.push({ r, c });
      }
    }
  }

  for (let i = 0; i < queens.length; i++) {
    for (let j = i + 1; j < queens.length; j++) {
      const q1 = queens[i];
      const q2 = queens[j];

      // 1. Row clash
      if (q1.r === q2.r) {
        conflicts.push({ type: 'row', cells: [q1, q2] });
      }
      // 2. Col clash
      if (q1.c === q2.c) {
        conflicts.push({ type: 'col', cells: [q1, q2] });
      }
      // 3. Region clash
      if (regions[q1.r][q1.c] === regions[q2.r][q2.c]) {
        conflicts.push({ type: 'region', cells: [q1, q2] });
      }
      // 4. Touch clash (Chebyshev distance === 1)
      if (Math.abs(q1.r - q2.r) <= 1 && Math.abs(q1.c - q2.c) <= 1) {
        conflicts.push({ type: 'adjacent', cells: [q1, q2] });
      }
    }
  }

  return conflicts;
}

/**
 * Generates an intelligent, educational hint without giving away the full solution.
 */
export function generateQueensHint(
  size: number,
  regions: number[][],
  grid: CellState[][],
  solution: Position[]
): QueensHint | null {
  // 1. First check if any current Queen placements are illegal
  const conflicts = findQueensConflicts(size, regions, grid);
  if (conflicts.length > 0) {
    const firstConflict = conflicts[0];
    let msg = 'Two queens cannot be placed in the same line or region.';
    if (firstConflict.type === 'adjacent') {
      msg = 'Queens cannot touch each other, even diagonally!';
    } else if (firstConflict.type === 'row') {
      msg = 'Two queens cannot share the same row.';
    } else if (firstConflict.type === 'col') {
      msg = 'Two queens cannot share the same column.';
    } else if (firstConflict.type === 'region') {
      msg = 'Each coloured region can only contain one queen.';
    }
    return {
      type: 'conflict',
      highlightCells: firstConflict.cells,
      message: msg,
    };
  }

  // 2. Check if user put an 'X' on a cell that is actually supposed to hold a Queen
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 'x') {
        const isSolutionQueen = solution.some((sq) => sq.r === r && sq.c === c);
        if (isSolutionQueen) {
          return {
            type: 'conflict',
            highlightCells: [{ r, c }],
            message: `Re-evaluate cell (R${r + 1}, C${c + 1}). It was marked with an X, but it might be safe for a Queen!`,
            cell: { r, c },
          };
        }
      }
    }
  }

  // 3. Deduction: Check if any row has only 1 remaining un-eliminated cell
  for (let r = 0; r < size; r++) {
    const hasQueenInRow = grid[r].some((cell) => cell === 'queen');
    if (!hasQueenInRow) {
      const candidates: Position[] = [];
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === 'empty') {
          candidates.push({ r, c });
        }
      }
      if (candidates.length === 1) {
        return {
          type: 'deduction',
          highlightCells: candidates,
          message: `Row ${r + 1} has only one available spot left for a Queen!`,
          cell: candidates[0],
          suggestedAction: 'queen',
        };
      }
      if (candidates.length > 1 && candidates.length <= 2) {
        return {
          type: 'safe_line',
          highlightCells: candidates,
          message: `Focus on Row ${r + 1}: only ${candidates.length} candidate squares remain.`,
        };
      }
    }
  }

  // 4. Deduction: Check if any column has only 1 remaining un-eliminated cell
  for (let c = 0; c < size; c++) {
    let hasQueenInCol = false;
    for (let r = 0; r < size; r++) {
      if (grid[r][c] === 'queen') hasQueenInCol = true;
    }
    if (!hasQueenInCol) {
      const candidates: Position[] = [];
      for (let r = 0; r < size; r++) {
        if (grid[r][c] === 'empty') candidates.push({ r, c });
      }
      if (candidates.length === 1) {
        return {
          type: 'deduction',
          highlightCells: candidates,
          message: `Column ${c + 1} has only one available spot left for a Queen!`,
          cell: candidates[0],
          suggestedAction: 'queen',
        };
      }
    }
  }

  // 5. Deduction: Check if any region has only 1 remaining un-eliminated cell
  for (let reg = 0; reg < size; reg++) {
    let hasQueenInReg = false;
    const candidates: Position[] = [];

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (regions[r][c] === reg) {
          if (grid[r][c] === 'queen') hasQueenInReg = true;
          if (grid[r][c] === 'empty') candidates.push({ r, c });
        }
      }
    }

    if (!hasQueenInReg) {
      if (candidates.length === 1) {
        return {
          type: 'safe_region',
          highlightCells: candidates,
          message: `This coloured region has only one valid square remaining!`,
          cell: candidates[0],
          suggestedAction: 'queen',
        };
      }
      if (candidates.length === 2) {
        return {
          type: 'safe_region',
          highlightCells: candidates,
          message: `This coloured region is down to its final 2 candidates.`,
        };
      }
    }
  }

  // 6. Suggest eliminating impossible cells adjacent to placed queens
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 'queen') {
        const emptyNeighbors: Position[] = [];
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
              if (grid[nr][nc] === 'empty') {
                emptyNeighbors.push({ r: nr, nc: nc } as unknown as Position);
              }
            }
          }
        }
        if (emptyNeighbors.length > 0) {
          return {
            type: 'deduction',
            highlightCells: [{ r, c }],
            message: `Tip: All 8 cells surrounding a Queen can be safely marked with an X.`,
          };
        }
      }
    }
  }

  // 7. General gentle nudge: highlight an unplaced Queen's row from the solution
  const unplacedSolution = solution.filter(
    (sq) => grid[sq.r][sq.c] !== 'queen'
  );
  if (unplacedSolution.length > 0) {
    const target = unplacedSolution[0];
    const rowCandidates: Position[] = [];
    for (let c = 0; c < size; c++) {
      if (grid[target.r][c] === 'empty') {
        rowCandidates.push({ r: target.r, c });
      }
    }
    return {
      type: 'safe_line',
      highlightCells: rowCandidates.length > 0 ? rowCandidates : [target],
      message: `Take a closer look at Row ${target.r + 1} and its intersecting coloured regions.`,
    };
  }

  return null;
}
