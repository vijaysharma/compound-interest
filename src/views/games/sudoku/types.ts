export type SudokuDifficulty = 'easy' | 'medium' | 'hard';
export interface SudokuCell {
  row: number;
  col: number;
  value: number; // 0 for empty
  solution: number;
  isGiven: boolean;
  notes: Set<number>;
  error?: boolean;
}
export interface SudokuMove {
  row: number;
  col: number;
  prevValue: number;
  nextValue: number;
  prevNotes: number[];
  nextNotes: number[];
}
export interface SudokuState {
  grid: number[][]; // current values (0 for empty)
  solution: number[][];
  initial: number[][]; // given clues
  notes: Record<string, number[]>; // key 'r-c' -> list of notes
  difficulty: SudokuDifficulty;
  elapsedSeconds: number;
  isPaused: boolean;
  isComplete: boolean;
  hintsUsed: number;
}
