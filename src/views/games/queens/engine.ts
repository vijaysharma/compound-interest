import type { CellState, Position, QueensConflict } from './types';
import { findQueensConflicts } from './solver';

/**
 * 10 distinct, pleasant, accessible region colors for light and dark modes
 */
export interface RegionTheme {
  name: string;
  bgLight: string;
  bgDark: string;
  borderLight: string;
  borderDark: string;
  accent: string;
}

export const REGION_THEMES: RegionTheme[] = [
  {
    name: 'Rose Coral',
    bgLight: 'rgba(254, 205, 211, 0.55)', // rose-200
    bgDark: 'rgba(159, 18, 57, 0.35)',
    borderLight: '#f43f5e',
    borderDark: '#fb7185',
    accent: '#e11d48',
  },
  {
    name: 'Sky Azure',
    bgLight: 'rgba(191, 219, 254, 0.55)', // blue-200
    bgDark: 'rgba(30, 58, 138, 0.35)',
    borderLight: '#3b82f6',
    borderDark: '#60a5fa',
    accent: '#2563eb',
  },
  {
    name: 'Emerald Mint',
    bgLight: 'rgba(187, 247, 208, 0.55)', // green-200
    bgDark: 'rgba(6, 78, 59, 0.35)',
    borderLight: '#10b981',
    borderDark: '#34d399',
    accent: '#059669',
  },
  {
    name: 'Amber Sand',
    bgLight: 'rgba(254, 240, 138, 0.55)', // yellow-200
    bgDark: 'rgba(113, 63, 18, 0.35)',
    borderLight: '#eab308',
    borderDark: '#fde047',
    accent: '#ca8a04',
  },
  {
    name: 'Purple Orchid',
    bgLight: 'rgba(233, 213, 255, 0.55)', // purple-200
    bgDark: 'rgba(88, 28, 135, 0.35)',
    borderLight: '#a855f7',
    borderDark: '#c084fc',
    accent: '#9333ea',
  },
  {
    name: 'Teal Lagoon',
    bgLight: 'rgba(153, 246, 228, 0.55)', // teal-200
    bgDark: 'rgba(19, 78, 74, 0.35)',
    borderLight: '#14b8a6',
    borderDark: '#2dd4bf',
    accent: '#0d9488',
  },
  {
    name: 'Warm Orange',
    bgLight: 'rgba(254, 215, 170, 0.55)', // orange-200
    bgDark: 'rgba(124, 45, 18, 0.35)',
    borderLight: '#f97316',
    borderDark: '#fb923c',
    accent: '#ea580c',
  },
  {
    name: 'Periwinkle Indigo',
    bgLight: 'rgba(199, 210, 254, 0.55)', // indigo-200
    bgDark: 'rgba(49, 46, 129, 0.35)',
    borderLight: '#6366f1',
    borderDark: '#818cf8',
    accent: '#4f46e5',
  },
  {
    name: 'Fuchsia Berry',
    bgLight: 'rgba(251, 207, 232, 0.55)', // fuchsia-200
    bgDark: 'rgba(112, 26, 117, 0.35)',
    borderLight: '#d946ef',
    borderDark: '#e879f9',
    accent: '#c026d3',
  },
  {
    name: 'Slate Stone',
    bgLight: 'rgba(203, 213, 225, 0.55)', // slate-200
    bgDark: 'rgba(30, 41, 59, 0.45)',
    borderLight: '#64748b',
    borderDark: '#94a3b8',
    accent: '#475569',
  },
];

export function createInitialGrid(size: number): CellState[][] {
  return Array.from({ length: size }, () => new Array(size).fill('empty'));
}

/**
 * Determines cell borders based on whether adjacent cells belong to a different region or the board boundary.
 */
export function getCellBorders(
  r: number,
  c: number,
  size: number,
  regions: number[][]
): {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
} {
  const currentReg = regions[r][c];
  return {
    top: r === 0 || regions[r - 1][c] !== currentReg,
    bottom: r === size - 1 || regions[r + 1][c] !== currentReg,
    left: c === 0 || regions[r][c - 1] !== currentReg,
    right: c === size - 1 || regions[r][c + 1] !== currentReg,
  };
}

/**
 * Checks whether the current board state fulfills all victory conditions
 */
export function evaluateBoardState(
  size: number,
  regions: number[][],
  grid: CellState[][]
): {
  isWon: boolean;
  placedQueens: number;
  conflicts: QueensConflict[];
  rowsCompleted: number;
  colsCompleted: number;
  regionsCompleted: number;
} {
  let placedQueens = 0;
  const conflicts = findQueensConflicts(size, regions, grid);

  const rowCounts = new Array(size).fill(0);
  const colCounts = new Array(size).fill(0);
  const regCounts = new Array(size).fill(0);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 'queen') {
        placedQueens++;
        rowCounts[r]++;
        colCounts[c]++;
        const reg = regions[r][c];
        if (reg >= 0 && reg < size) {
          regCounts[reg]++;
        }
      }
    }
  }

  const rowsCompleted = rowCounts.filter((cnt) => cnt === 1).length;
  const colsCompleted = colCounts.filter((cnt) => cnt === 1).length;
  const regionsCompleted = regCounts.filter((cnt) => cnt === 1).length;

  const isWon =
    placedQueens === size &&
    conflicts.length === 0 &&
    rowsCompleted === size &&
    colsCompleted === size &&
    regionsCompleted === size;

  return {
    isWon,
    placedQueens,
    conflicts,
    rowsCompleted,
    colsCompleted,
    regionsCompleted,
  };
}

/**
 * Applies a cell modification:
 * - single click/tap: toggle 'x' <-> 'empty'
 * - double click/tap: toggle 'queen' <-> 'empty'
 */
export function applyCellAction(
  grid: CellState[][],
  r: number,
  c: number,
  action: 'single_click' | 'double_click' | 'toggle_queen' | 'toggle_x'
): CellState[][] {
  const size = grid.length;
  const nextGrid = grid.map((row) => [...row]);
  const current = grid[r][c];

  if (action === 'single_click' || action === 'toggle_x') {
    if (current === 'x') {
      nextGrid[r][c] = 'empty';
    } else if (current === 'empty') {
      nextGrid[r][c] = 'x';
    } else if (current === 'queen') {
      // If user single clicks a queen, clear it
      nextGrid[r][c] = 'empty';
    }
  } else if (action === 'double_click' || action === 'toggle_queen') {
    if (current === 'queen') {
      nextGrid[r][c] = 'empty';
    } else {
      nextGrid[r][c] = 'queen';
    }
  }

  return nextGrid;
}
