export type CellState = 'empty' | 'x' | 'queen';

export interface Position {
  r: number;
  c: number;
}

export interface QueensPuzzle {
  id: string;
  size: number; // 6, 7, 8, 9, or 10
  regions: number[][]; // size x size, region IDs from 0 to size - 1
  solution: Position[]; // length === size
  seed: string;
  createdAt: string;
}

export interface QueensConflict {
  type: 'row' | 'col' | 'region' | 'adjacent';
  cells: Position[];
}

export interface QueensHint {
  type: 'conflict' | 'deduction' | 'safe_line' | 'safe_region';
  highlightCells: Position[];
  message: string;
  cell?: Position;
  suggestedAction?: 'queen' | 'x';
}

export interface QueensMove {
  r: number;
  c: number;
  prev: CellState;
  next: CellState;
}

export interface QueensStats {
  gamesPlayed: number;
  gamesWon: number;
  bestTime: number; // in seconds
  totalTime: number; // in seconds
  currentStreak: number;
  maxStreak: number;
  lastPlayedDate?: string;
}
