import type { CellState, HitoriViolation } from './types';
export function validateHitori(
  grid: number[][],
  cellStates: CellState[]
): {
  isValid: boolean;
  isComplete: boolean;
  violations: HitoriViolation[];
} {
  const size = grid.length;
  const violations: HitoriViolation[] = [];
  const getState = (r: number, c: number): CellState => cellStates[r * size + c] || 'unmarked';
  // Rule 2: No adjacent shaded cells (orthogonal)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (getState(r, c) === 'shaded') {
        if (c + 1 < size && getState(r, c + 1) === 'shaded') {
          violations.push({
            type: 'adjacent_black',
            message: `Shaded cells at (${r + 1},${c + 1}) and (${r + 1},${c + 2}) cannot touch.`,
            cells: [
              [r, c],
              [r, c + 1],
            ],
          });
        }
        if (r + 1 < size && getState(r + 1, c) === 'shaded') {
          violations.push({
            type: 'adjacent_black',
            message: `Shaded cells at (${r + 1},${c + 1}) and (${r + 2},${c + 1}) cannot touch.`,
            cells: [
              [r, c],
              [r + 1, c],
            ],
          });
        }
      }
    }
  }
  // Rule 1: No duplicate numbers among unshaded cells in any row or column
  for (let r = 0; r < size; r++) {
    const seen = new Map<number, number[]>();
    for (let c = 0; c < size; c++) {
      if (getState(r, c) !== 'shaded') {
        const val = grid[r][c];
        const existing = seen.get(val) || [];
        existing.push(c);
        seen.set(val, existing);
      }
    }
    seen.forEach((cols, val) => {
      if (cols.length > 1) {
        violations.push({
          type: 'duplicate',
          message: `Duplicate number ${val} in row ${r + 1}.`,
          cells: cols.map((col) => [r, col]),
        });
      }
    });
  }
  for (let c = 0; c < size; c++) {
    const seen = new Map<number, number[]>();
    for (let r = 0; r < size; r++) {
      if (getState(r, c) !== 'shaded') {
        const val = grid[r][c];
        const existing = seen.get(val) || [];
        existing.push(r);
        seen.set(val, existing);
      }
    }
    seen.forEach((rows, val) => {
      if (rows.length > 1) {
        violations.push({
          type: 'duplicate',
          message: `Duplicate number ${val} in column ${c + 1}.`,
          cells: rows.map((row) => [row, c]),
        });
      }
    });
  }
  // Rule 3: Unshaded cells must form a single connected orthogonal component
  let totalUnshaded = 0;
  let firstUnshaded: [number, number] | null = null;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (getState(r, c) !== 'shaded') {
        totalUnshaded++;
        if (!firstUnshaded) {
          firstUnshaded = [r, c];
        }
      }
    }
  }
  if (firstUnshaded && totalUnshaded > 0) {
    const visited = new Set<number>();
    const queue: [number, number][] = [firstUnshaded];
    visited.add(firstUnshaded[0] * size + firstUnshaded[1]);
    while (queue.length > 0) {
      const [currR, currC] = queue.shift()!;
      const neighbors: [number, number][] = [
        [currR - 1, currC],
        [currR + 1, currC],
        [currR, currC - 1],
        [currR, currC + 1],
      ];
      for (const [nr, nc] of neighbors) {
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          const key = nr * size + nc;
          if (!visited.has(key) && getState(nr, nc) !== 'shaded') {
            visited.add(key);
            queue.push([nr, nc]);
          }
        }
      }
    }
    if (visited.size < totalUnshaded) {
      const isolated: [number, number][] = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (getState(r, c) !== 'shaded' && !visited.has(r * size + c)) {
            isolated.push([r, c]);
          }
        }
      }
      violations.push({
        type: 'isolated_white',
        message: 'Unshaded cells must form a single connected group.',
        cells: isolated,
      });
    }
  }
  const hasAdjacentViolation = violations.some((v) => v.type === 'adjacent_black');
  const hasIsolatedViolation = violations.some((v) => v.type === 'isolated_white');
  return {
    isValid: !hasAdjacentViolation && !hasIsolatedViolation,
    isComplete: violations.length === 0,
    violations,
  };
}
export function isHitoriSolved(grid: number[][], cellStates: CellState[]): boolean {
  return validateHitori(grid, cellStates).isComplete;
}
/**
 * Provides an intelligent hint for the player:
 * 1. Shaded cell orthogonal neighbors must be circled.
 * 2. Sandwich pattern: identical numbers with 1 cell between -> middle cell must be circled.
 * 3. Pair of identical numbers adjacent -> any other cell in that row/col with the same value must be shaded.
 * 4. Solution comparison fallback.
 */
export function getHint(
  grid: number[][],
  currentStates: CellState[],
  solution?: CellState[][]
): {
  row: number;
  col: number;
  suggestedState: CellState;
  explanation: string;
} | null {
  const size = grid.length;
  const getState = (r: number, c: number): CellState => currentStates[r * size + c] || 'unmarked';
  // Strategy 1: Any shaded cell must have circled orthogonal neighbors
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (getState(r, c) === 'shaded') {
        const neighbors: [number, number][] = [
          [r - 1, c],
          [r + 1, c],
          [r, c - 1],
          [r, c + 1],
        ];
        for (const [nr, nc] of neighbors) {
          if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
            if (getState(nr, nc) === 'unmarked') {
              return {
                row: nr,
                col: nc,
                suggestedState: 'circled',
                explanation: `Adjacent to shaded cell at (${r + 1}, ${c + 1}). Shaded cells cannot touch.`,
              };
            }
          }
        }
      }
    }
  }
  // Strategy 2: Sandwich rule - if grid[r][c-1] === grid[r][c+1], middle must be circled
  for (let r = 0; r < size; r++) {
    for (let c = 1; c < size - 1; c++) {
      if (grid[r][c - 1] === grid[r][c + 1] && getState(r, c) === 'unmarked') {
        return {
          row: r,
          col: c,
          suggestedState: 'circled',
          explanation: `Number ${grid[r][c]} is sandwiched between two ${grid[r][c - 1]}s. If shaded, both ends would be circled, causing an illegal duplicate.`,
        };
      }
    }
  }
  for (let c = 0; c < size; c++) {
    for (let r = 1; r < size - 1; r++) {
      if (grid[r - 1][c] === grid[r + 1][c] && getState(r, c) === 'unmarked') {
        return {
          row: r,
          col: c,
          suggestedState: 'circled',
          explanation: `Number ${grid[r][c]} is sandwiched between two ${grid[r - 1][c]}s in this column. It must remain unshaded.`,
        };
      }
    }
  }
  // Strategy 3: Adjacent duplicate pair -> any 3rd instance in that row/col must be shaded
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size - 1; c++) {
      if (grid[r][c] === grid[r][c + 1]) {
        const val = grid[r][c];
        for (let otherC = 0; otherC < size; otherC++) {
          if (otherC !== c && otherC !== c + 1 && grid[r][otherC] === val && getState(r, otherC) === 'unmarked') {
            return {
              row: r,
              col: otherC,
              suggestedState: 'shaded',
              explanation: `Adjacent pair of ${val}s exists in this row. Any third ${val} must be shaded to avoid duplicate unshaded cells.`,
            };
          }
        }
      }
    }
  }
  // Strategy 4: Fallback to preset solution
  if (solution) {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const curr = getState(r, c);
        const sol = solution[r][c];
        if (curr !== sol) {
          return {
            row: r,
            col: c,
            suggestedState: sol,
            explanation: sol === 'shaded' ? 'This duplicate cell should be shaded.' : 'Keep this cell unshaded.',
          };
        }
      }
    }
  }
  return null;
}
