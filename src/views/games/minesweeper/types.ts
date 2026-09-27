export type MinesweeperDifficulty = 'easy' | 'medium' | 'hard';
export type CellState = 'hidden' | 'revealed' | 'flagged' | 'question';
export interface Cell {
  row: number;
  col: number;
  isMine: boolean;
  state: CellState;
  neighborMines: number;
  exploded?: boolean;
}
export interface PresetConfig {
  rows: number;
  cols: number;
  mines: number;
  label: string;
}
export const PRESETS: Record<MinesweeperDifficulty, PresetConfig> = {
  easy: { rows: 9, cols: 9, mines: 10, label: 'Beginner (9×9)' },
  medium: { rows: 14, cols: 14, mines: 32, label: 'Intermediate (14×14)' },
  hard: { rows: 14, cols: 28, mines: 80, label: 'Expert (14×28)' },
};
