export type HitoriDifficulty = 'easy' | 'medium' | 'hard';
export type CellState = 'unmarked' | 'shaded' | 'circled';
export interface HitoriPresetConfig {
  size: number;
  label: string;
  grid: number[][];
  solution: CellState[][]; // 'shaded' or 'circled'
}
export interface HitoriMove {
  row: number;
  col: number;
  from: CellState;
  to: CellState;
}
export interface HitoriViolation {
  type: 'duplicate' | 'adjacent_black' | 'isolated_white';
  message: string;
  cells: [number, number][];
}
