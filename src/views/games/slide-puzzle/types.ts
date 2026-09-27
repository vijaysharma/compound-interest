export interface SlidePuzzleState {
  tiles: number[];
  moves: number;
  elapsedSeconds: number;
  isWon: boolean;
  isStarted: boolean;
}
export type SlideDirection = 'up' | 'down' | 'left' | 'right';
