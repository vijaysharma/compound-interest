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
  medium: { rows: 16, cols: 16, mines: 40, label: 'Intermediate (16×16)' },
  hard: { rows: 16, cols: 30, mines: 99, label: 'Expert (30×16)' },
};
