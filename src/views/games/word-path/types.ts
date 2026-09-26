export type Difficulty = 'easy' | 'medium' | 'hard';
export type Direction = '^' | '>' | 'v' | '<' | '';
export interface Coordinate {
  row: number;
  col: number;
}
export interface ThemeColor {
  id: string;
  name: string;
  primary: string;
  bg: string;
  border: string;
  text: string;
}
export interface Tile {
  id: string;
  row: number;
  col: number;
  letter: string;
  arrow: Direction;
  wordId: string;
  stepIndex: number;
  isStart: boolean;
  isEnd: boolean;
  isWall?: boolean;
}
export interface WordSolution {
  id: string;
  word: string;
  themeColor: ThemeColor;
  path: Coordinate[];
}
export interface BoardDefinition {
  id: string;
  title: string;
  theme: string;
  difficulty: Difficulty;
  rows: number;
  cols: number;
  words: WordSolution[];
  grid: Tile[][];
}
export const THEME_COLORS: ThemeColor[] = [
  {
    id: 'purple',
    name: 'Purple',
    primary: '#A855F7',
    bg: '#F3E8FF',
    border: '#7E22CE',
    text: '#581C87',
  },
  {
    id: 'green',
    name: 'Green',
    primary: '#22C55E',
    bg: '#DCFCE7',
    border: '#15803D',
    text: '#14532D',
  },
  {
    id: 'orange',
    name: 'Orange',
    primary: '#F97316',
    bg: '#FFEDD5',
    border: '#C2410C',
    text: '#7C2D12',
  },
  {
    id: 'pink',
    name: 'Pink',
    primary: '#EC4899',
    bg: '#FCE7F3',
    border: '#BE185D',
    text: '#831843',
  },
  {
    id: 'yellow',
    name: 'Yellow',
    primary: '#EAB308',
    bg: '#FEF9C3',
    border: '#A16207',
    text: '#713F12',
  },
  {
    id: 'teal',
    name: 'Teal',
    primary: '#14B8A6',
    bg: '#CCFBF1',
    border: '#0F766E',
    text: '#134E4A',
  },
  {
    id: 'blue',
    name: 'Blue',
    primary: '#3B82F6',
    bg: '#DBEAFE',
    border: '#1D4ED8',
    text: '#1E3A8A',
  },
];
