export type MinesweeperDifficulty = 'easy' | 'medium' | 'hard';
export type CellState = 'hidden' | 'revealed' | 'flagged';
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
export const WEB_PRESETS: Record<MinesweeperDifficulty, PresetConfig> = {
  easy: { rows: 9, cols: 9, mines: 10, label: 'Easy (9×9)' },
  medium: { rows: 16, cols: 16, mines: 40, label: 'Medium (16×16)' },
  hard: { rows: 24, cols: 24, mines: 99, label: 'Expert (24×24)' },
};
export const MOBILE_PRESETS: Record<MinesweeperDifficulty, PresetConfig> = {
  easy: { rows: 9, cols: 9, mines: 10, label: 'Easy (9×9)' },
  medium: { rows: 16, cols: 14, mines: 35, label: 'Medium (14×16)' },
  hard: { rows: 20, cols: 14, mines: 55, label: 'Expert (14×20)' },
};
export const PRESETS = WEB_PRESETS;
export const getPreset = (diff: MinesweeperDifficulty, isMobile: boolean): PresetConfig =>
  (isMobile ? MOBILE_PRESETS[diff] : WEB_PRESETS[diff]);
