import type {
  TangoCellVal,
  TangoPreset,
  TangoValidationResult,
  TangoViolation,
} from './types';
export function validateTango(
  grid: TangoCellVal[][],
  preset: TangoPreset
): TangoValidationResult {
  const size = preset.size;
  const violations: TangoViolation[] = [];
  const maxPerLine = size / 2;
  // 1. Check No 3-in-a-row horizontally
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size - 2; c++) {
      const v = grid[r][c];
      if (v !== 0 && v === grid[r][c + 1] && v === grid[r][c + 2]) {
        violations.push({
          type: 'three_in_a_row',
          message: `Three ${v === 1 ? 'Primary' : 'Light'} circles in a row in row ${r + 1}.`,
          cells: [
            [r, c],
            [r, c + 1],
            [r, c + 2],
          ],
        });
      }
    }
  }
  // Check No 3-in-a-row vertically
  for (let c = 0; c < size; c++) {
    for (let r = 0; r < size - 2; r++) {
      const v = grid[r][c];
      if (v !== 0 && v === grid[r + 1][c] && v === grid[r + 2][c]) {
        violations.push({
          type: 'three_in_a_row',
          message: `Three ${v === 1 ? 'Primary' : 'Light'} circles in a column in column ${c + 1}.`,
          cells: [
            [r, c],
            [r + 1, c],
            [r + 2, c],
          ],
        });
      }
    }
  }
  // 2. Count limit per row & column
  for (let r = 0; r < size; r++) {
    let count1 = 0;
    let count2 = 0;
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 1) count1++;
      if (grid[r][c] === 2) count2++;
    }
    if (count1 > maxPerLine) {
      violations.push({
        type: 'count_exceeded',
        message: `Too many Primary circles in row ${r + 1} (max ${maxPerLine}).`,
        cells: grid[r].map((v, c) => (v === 1 ? [r, c] : null)).filter(Boolean) as [number, number][],
      });
    }
    if (count2 > maxPerLine) {
      violations.push({
        type: 'count_exceeded',
        message: `Too many Light circles in row ${r + 1} (max ${maxPerLine}).`,
        cells: grid[r].map((v, c) => (v === 2 ? [r, c] : null)).filter(Boolean) as [number, number][],
      });
    }
  }
  for (let c = 0; c < size; c++) {
    let count1 = 0;
    let count2 = 0;
    for (let r = 0; r < size; r++) {
      if (grid[r][c] === 1) count1++;
      if (grid[r][c] === 2) count2++;
    }
    if (count1 > maxPerLine) {
      violations.push({
        type: 'count_exceeded',
        message: `Too many Primary circles in column ${c + 1} (max ${maxPerLine}).`,
        cells: Array.from({ length: size }, (_, r) => (grid[r][c] === 1 ? [r, c] : null)).filter(Boolean) as [number, number][],
      });
    }
    if (count2 > maxPerLine) {
      violations.push({
        type: 'count_exceeded',
        message: `Too many Light circles in column ${c + 1} (max ${maxPerLine}).`,
        cells: Array.from({ length: size }, (_, r) => (grid[r][c] === 2 ? [r, c] : null)).filter(Boolean) as [number, number][],
      });
    }
  }
  // 3. Equality and Cross signs
  for (const h of preset.horizontalSigns) {
    const left = grid[h.row][h.col];
    const right = grid[h.row][h.col + 1];
    if (left !== 0 && right !== 0) {
      if (h.sign === '=' && left !== right) {
        violations.push({
          type: 'equality_violation',
          message: `Equal sign violated at row ${h.row + 1}, columns ${h.col + 1} and ${h.col + 2}.`,
          cells: [
            [h.row, h.col],
            [h.row, h.col + 1],
          ],
        });
      } else if (h.sign === 'x' && left === right) {
        violations.push({
          type: 'equality_violation',
          message: `Cross (opposite) sign violated at row ${h.row + 1}, columns ${h.col + 1} and ${h.col + 2}.`,
          cells: [
            [h.row, h.col],
            [h.row, h.col + 1],
          ],
        });
      }
    }
  }
  for (const v of preset.verticalSigns) {
    const top = grid[v.row][v.col];
    const bottom = grid[v.row + 1][v.col];
    if (top !== 0 && bottom !== 0) {
      if (v.sign === '=' && top !== bottom) {
        violations.push({
          type: 'equality_violation',
          message: `Equal sign violated at column ${v.col + 1}, rows ${v.row + 1} and ${v.row + 2}.`,
          cells: [
            [v.row, v.col],
            [v.row + 1, v.col],
          ],
        });
      } else if (v.sign === 'x' && top === bottom) {
        violations.push({
          type: 'equality_violation',
          message: `Cross (opposite) sign violated at column ${v.col + 1}, rows ${v.row + 1} and ${v.row + 2}.`,
          cells: [
            [v.row, v.col],
            [v.row + 1, v.col],
          ],
        });
      }
    }
  }
  // 4. Full completion check
  let isFull = true;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 0) {
        isFull = false;
        break;
      }
    }
    if (!isFull) break;
  }
  // 5. Unique rows and columns (when full)
  if (isFull) {
    const rowStrs = grid.map((r) => r.join(''));
    const seenRows = new Map<string, number>();
    rowStrs.forEach((str, r) => {
      if (seenRows.has(str)) {
        const prevR = seenRows.get(str)!;
        violations.push({
          type: 'duplicate_line',
          message: `Rows ${prevR + 1} and ${r + 1} are identical.`,
          cells: [
            ...Array.from({ length: size }, (_, c) => [prevR, c] as [number, number]),
            ...Array.from({ length: size }, (_, c) => [r, c] as [number, number]),
          ],
        });
      } else {
        seenRows.set(str, r);
      }
    });
    const colStrs = Array.from({ length: size }, (_, c) =>
      grid.map((r) => r[c]).join('')
    );
    const seenCols = new Map<string, number>();
    colStrs.forEach((str, c) => {
      if (seenCols.has(str)) {
        const prevC = seenCols.get(str)!;
        violations.push({
          type: 'duplicate_line',
          message: `Columns ${prevC + 1} and ${c + 1} are identical.`,
          cells: [
            ...Array.from({ length: size }, (_, r) => [r, prevC] as [number, number]),
            ...Array.from({ length: size }, (_, r) => [r, c] as [number, number]),
          ],
        });
      } else {
        seenCols.set(str, c);
      }
    });
  }
  const isValid = violations.length === 0;
  const isComplete = isFull && isValid;
  return {
    isValid,
    isComplete,
    violations,
  };
}
export function getTangoHint(
  grid: TangoCellVal[][],
  preset: TangoPreset
): {
  row: number;
  col: number;
  suggestedVal: TangoCellVal;
  explanation: string;
} | null {
  const size = preset.size;
  const maxPerLine = size / 2;
  // 1. Two consecutive identical cells -> next must be opposite
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = grid[r][c];
      if (v !== 0 && v === grid[r][c + 1]) {
        const opp: TangoCellVal = v === 1 ? 2 : 1;
        const oppName = opp === 1 ? 'Primary' : 'Light';
        if (c > 0 && grid[r][c - 1] === 0) {
          return {
            row: r,
            col: c - 1,
            suggestedVal: opp,
            explanation: `No 3 in a row: cell (${r + 1}, ${c}) must be ${oppName} to prevent three in a row.`,
          };
        }
        if (c + 2 < size && grid[r][c + 2] === 0) {
          return {
            row: r,
            col: c + 2,
            suggestedVal: opp,
            explanation: `No 3 in a row: cell (${r + 1}, ${c + 3}) must be ${oppName} to prevent three in a row.`,
          };
        }
      }
    }
  }
  // Vertical two consecutive
  for (let c = 0; c < size; c++) {
    for (let r = 0; r < size - 1; r++) {
      const v = grid[r][c];
      if (v !== 0 && v === grid[r + 1][c]) {
        const opp: TangoCellVal = v === 1 ? 2 : 1;
        const oppName = opp === 1 ? 'Primary' : 'Light';
        if (r > 0 && grid[r - 1][c] === 0) {
          return {
            row: r - 1,
            col: c,
            suggestedVal: opp,
            explanation: `No 3 in a column: cell (${r}, ${c + 1}) must be ${oppName} to prevent three in a row.`,
          };
        }
        if (r + 2 < size && grid[r + 2][c] === 0) {
          return {
            row: r + 2,
            col: c,
            suggestedVal: opp,
            explanation: `No 3 in a column: cell (${r + 3}, ${c + 1}) must be ${oppName} to prevent three in a row.`,
          };
        }
      }
    }
  }
  // 2. Sandwich: A _ A -> middle must be B
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size - 2; c++) {
      const v = grid[r][c];
      if (v !== 0 && grid[r][c + 1] === 0 && v === grid[r][c + 2]) {
        const opp: TangoCellVal = v === 1 ? 2 : 1;
        return {
          row: r,
          col: c + 1,
          suggestedVal: opp,
          explanation: `Sandwich rule: cell (${r + 1}, ${c + 2}) must be opposite to avoid three ${v === 1 ? 'Primary' : 'Light'} in a row.`,
        };
      }
    }
  }
  for (let c = 0; c < size; c++) {
    for (let r = 0; r < size - 2; r++) {
      const v = grid[r][c];
      if (v !== 0 && grid[r + 1][c] === 0 && v === grid[r + 2][c]) {
        const opp: TangoCellVal = v === 1 ? 2 : 1;
        return {
          row: r + 1,
          col: c,
          suggestedVal: opp,
          explanation: `Sandwich rule: cell (${r + 2}, ${c + 1}) must be opposite to avoid three ${v === 1 ? 'Primary' : 'Light'} in a column.`,
        };
      }
    }
  }
  // 3. Equality signs
  for (const h of preset.horizontalSigns) {
    const left = grid[h.row][h.col];
    const right = grid[h.row][h.col + 1];
    if (left !== 0 && right === 0) {
      const target: TangoCellVal = h.sign === '=' ? left : left === 1 ? 2 : 1;
      return {
        row: h.row,
        col: h.col + 1,
        suggestedVal: target,
        explanation: `${h.sign === '=' ? 'Equal (=)' : 'Cross (×)'} sign dictates cell (${h.row + 1}, ${h.col + 2}) must be ${target === 1 ? 'Primary' : 'Light'}.`,
      };
    }
    if (right !== 0 && left === 0) {
      const target: TangoCellVal = h.sign === '=' ? right : right === 1 ? 2 : 1;
      return {
        row: h.row,
        col: h.col,
        suggestedVal: target,
        explanation: `${h.sign === '=' ? 'Equal (=)' : 'Cross (×)'} sign dictates cell (${h.row + 1}, ${h.col + 1}) must be ${target === 1 ? 'Primary' : 'Light'}.`,
      };
    }
  }
  for (const v of preset.verticalSigns) {
    const top = grid[v.row][v.col];
    const bottom = grid[v.row + 1][v.col];
    if (top !== 0 && bottom === 0) {
      const target: TangoCellVal = v.sign === '=' ? top : top === 1 ? 2 : 1;
      return {
        row: v.row + 1,
        col: v.col,
        suggestedVal: target,
        explanation: `${v.sign === '=' ? 'Equal (=)' : 'Cross (×)'} sign dictates cell (${v.row + 2}, ${v.col + 1}) must be ${target === 1 ? 'Primary' : 'Light'}.`,
      };
    }
    if (bottom !== 0 && top === 0) {
      const target: TangoCellVal = v.sign === '=' ? bottom : bottom === 1 ? 2 : 1;
      return {
        row: v.row,
        col: v.col,
        suggestedVal: target,
        explanation: `${v.sign === '=' ? 'Equal (=)' : 'Cross (×)'} sign dictates cell (${v.row + 1}, ${v.col + 1}) must be ${target === 1 ? 'Primary' : 'Light'}.`,
      };
    }
  }
  // 4. Line count reached
  for (let r = 0; r < size; r++) {
    let count1 = 0;
    let count2 = 0;
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 1) count1++;
      if (grid[r][c] === 2) count2++;
    }
    if (count1 === maxPerLine) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === 0) {
          return {
            row: r,
            col: c,
            suggestedVal: 2,
            explanation: `Row ${r + 1} already has all ${maxPerLine} Primary circles. Remaining empty cells must be Light.`,
          };
        }
      }
    }
    if (count2 === maxPerLine) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === 0) {
          return {
            row: r,
            col: c,
            suggestedVal: 1,
            explanation: `Row ${r + 1} already has all ${maxPerLine} Light circles. Remaining empty cells must be Primary.`,
          };
        }
      }
    }
  }
  for (let c = 0; c < size; c++) {
    let count1 = 0;
    let count2 = 0;
    for (let r = 0; r < size; r++) {
      if (grid[r][c] === 1) count1++;
      if (grid[r][c] === 2) count2++;
    }
    if (count1 === maxPerLine) {
      for (let r = 0; r < size; r++) {
        if (grid[r][c] === 0) {
          return {
            row: r,
            col: c,
            suggestedVal: 2,
            explanation: `Column ${c + 1} already has all ${maxPerLine} Primary circles. Remaining empty cells must be Light.`,
          };
        }
      }
    }
    if (count2 === maxPerLine) {
      for (let r = 0; r < size; r++) {
        if (grid[r][c] === 0) {
          return {
            row: r,
            col: c,
            suggestedVal: 1,
            explanation: `Column ${c + 1} already has all ${maxPerLine} Light circles. Remaining empty cells must be Primary.`,
          };
        }
      }
    }
  }
  // 5. Fallback: solution cell
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 0) {
        const solVal = preset.solution[r][c] as TangoCellVal;
        return {
          row: r,
          col: c,
          suggestedVal: solVal,
          explanation: `By logical elimination, cell (${r + 1}, ${c + 1}) must be ${solVal === 1 ? 'Primary' : 'Light'}.`,
        };
      }
    }
  }
  return null;
}
