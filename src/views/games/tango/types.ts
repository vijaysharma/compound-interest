export type TangoDifficulty = 'easy' | 'medium' | 'hard';

// 0: empty, 1: Primary circle (Moon/Dark), 2: Light circle (Sun/Light)
export type TangoCellVal = 0 | 1 | 2;

export interface TangoSignConstraint {
  row: number;
  col: number;
  sign: '=' | 'x';
}

export interface TangoPreset {
  id: string;
  title: string;
  size: number;
  initialGrid: number[][]; // size x size, values 0, 1, 2
  solution: number[][];    // size x size, values 1, 2
  horizontalSigns: TangoSignConstraint[]; // between (row, col) and (row, col + 1)
  verticalSigns: TangoSignConstraint[];   // between (row, col) and (row + 1, col)
}

export interface TangoViolation {
  type: 'three_in_a_row' | 'count_exceeded' | 'equality_violation' | 'duplicate_line';
  message: string;
  cells: [number, number][];
}

export interface TangoValidationResult {
  isValid: boolean;
  isComplete: boolean;
  violations: TangoViolation[];
}

export interface TangoMove {
  row: number;
  col: number;
  from: TangoCellVal;
  to: TangoCellVal;
}
