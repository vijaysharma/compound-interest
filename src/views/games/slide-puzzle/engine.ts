export const GRID_SIZE = 4;
export const TOTAL_TILES = 16;
export type DirectionRelativeToBlank = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type MoveType = 'TAP' | 'SWIPE';
export type MovementControlMode = 'tap' | 'swipe' | 'hybrid';
export interface SlideStep {
  tileValue: number;
  fromIndex: number;
  toIndex: number;
  directionRelativeToBlank: DirectionRelativeToBlank;
}
export interface SlideMove {
  tileValue: number;
  fromIndex: number;
  toIndex: number; // Position of the blank tile before movement
  directionRelativeToBlank: DirectionRelativeToBlank;
  moveType: MoveType;
  timestamp: number;
}
export interface SlideResult {
  newTiles: number[];
  movedCount: number;
  moves: SlideStep[];
}
export const isSolved = (tiles: number[]): boolean => {
  for (let i = 0; i < TOTAL_TILES - 1; i++) {
    if (tiles[i] !== i + 1) return false;
  }
  return tiles[TOTAL_TILES - 1] === 0;
};
export const countInversions = (tiles: number[]): number => {
  let inversions = 0;
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i] === 0) continue;
    for (let j = i + 1; j < tiles.length; j++) {
      if (tiles[j] === 0) continue;
      if (tiles[i] > tiles[j]) {
        inversions++;
      }
    }
  }
  return inversions;
};
export const isSolvable = (tiles: number[]): boolean => {
  const blankIdx = tiles.indexOf(0);
  if (blankIdx === -1) return false;
  const blankRowFromBottom = GRID_SIZE - Math.floor(blankIdx / GRID_SIZE);
  const inversions = countInversions(tiles);
  return (inversions + blankRowFromBottom) % 2 === 1;
};
/** Sum of each tile's grid distance from its solved position (blank excluded). */
export const manhattanDistance = (tiles: number[]): number => {
  let total = 0;
  for (let i = 0; i < tiles.length; i++) {
    const val = tiles[i];
    if (val === 0) continue;
    const target = val - 1;
    total += Math.abs(Math.floor(i / GRID_SIZE) - Math.floor(target / GRID_SIZE)) + Math.abs((i % GRID_SIZE) - (target % GRID_SIZE));
  }
  return total;
};
/**
 * Lower bound on scramble quality. A uniformly random solvable 4x4 board averages a Manhattan
 * distance of ~37 (optimal solutions ~52 moves); anything under this would feel nearly solved.
 */
export const MIN_SCRAMBLE_DISTANCE = 24;
/** Deterministic solvable scramble for the server render; replaced by a random one on mount. */
export const INITIAL_BOARD: readonly number[] = [12, 1, 10, 2, 7, 11, 4, 14, 5, 0, 9, 15, 8, 13, 6, 3];
const randomPermutation = (): number[] => {
  const tiles = Array.from({ length: TOTAL_TILES }, (_, i) => (i === TOTAL_TILES - 1 ? 0 : i + 1));
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  if (!isSolvable(tiles)) {
    // Swapping any two numbered tiles flips inversion parity, turning an unsolvable board solvable.
    const a = tiles.findIndex((t) => t !== 0);
    const b = tiles.findIndex((t, i) => i > a && t !== 0);
    [tiles[a], tiles[b]] = [tiles[b], tiles[a]];
  }
  return tiles;
};
export const getShuffledBoard = (): number[] => {
  let tiles = randomPermutation();
  for (let attempt = 0; attempt < 50 && (isSolved(tiles) || manhattanDistance(tiles) < MIN_SCRAMBLE_DISTANCE); attempt++) {
    tiles = randomPermutation();
  }
  return tiles;
};
export const canSlide = (tiles: number[], clickedIdx: number): boolean => {
  const blankIdx = tiles.indexOf(0);
  if (blankIdx === -1 || clickedIdx === blankIdx) return false;
  const blankRow = Math.floor(blankIdx / GRID_SIZE);
  const blankCol = blankIdx % GRID_SIZE;
  const clickedRow = Math.floor(clickedIdx / GRID_SIZE);
  const clickedCol = clickedIdx % GRID_SIZE;
  return blankRow === clickedRow || blankCol === clickedCol;
};
export const slideTiles = (
  tiles: number[],
  clickedIdx: number
): SlideResult | null => {
  const blankIdx = tiles.indexOf(0);
  if (blankIdx === -1 || clickedIdx === blankIdx) return null;
  const blankRow = Math.floor(blankIdx / GRID_SIZE);
  const blankCol = blankIdx % GRID_SIZE;
  const clickedRow = Math.floor(clickedIdx / GRID_SIZE);
  const clickedCol = clickedIdx % GRID_SIZE;
  const next = [...tiles];
  const moves: SlideStep[] = [];
  if (blankRow === clickedRow) {
    if (clickedCol < blankCol) {
      // Tiles to left of blank shift RIGHT
      for (let c = blankCol - 1; c >= clickedCol; c--) {
        const fromIdx = blankRow * GRID_SIZE + c;
        const toIdx = blankRow * GRID_SIZE + (c + 1);
        moves.push({
          tileValue: tiles[fromIdx],
          fromIndex: fromIdx,
          toIndex: toIdx,
          directionRelativeToBlank: 'RIGHT',
        });
        next[toIdx] = next[fromIdx];
      }
      next[clickedIdx] = 0;
      return { newTiles: next, movedCount: Math.abs(blankCol - clickedCol), moves };
    } else {
      // Tiles to right of blank shift LEFT
      for (let c = blankCol + 1; c <= clickedCol; c++) {
        const fromIdx = blankRow * GRID_SIZE + c;
        const toIdx = blankRow * GRID_SIZE + (c - 1);
        moves.push({
          tileValue: tiles[fromIdx],
          fromIndex: fromIdx,
          toIndex: toIdx,
          directionRelativeToBlank: 'LEFT',
        });
        next[toIdx] = next[fromIdx];
      }
      next[clickedIdx] = 0;
      return { newTiles: next, movedCount: Math.abs(blankCol - clickedCol), moves };
    }
  }
  if (blankCol === clickedCol) {
    if (clickedRow < blankRow) {
      // Tiles above blank shift DOWN
      for (let r = blankRow - 1; r >= clickedRow; r--) {
        const fromIdx = r * GRID_SIZE + blankCol;
        const toIdx = (r + 1) * GRID_SIZE + blankCol;
        moves.push({
          tileValue: tiles[fromIdx],
          fromIndex: fromIdx,
          toIndex: toIdx,
          directionRelativeToBlank: 'DOWN',
        });
        next[toIdx] = next[fromIdx];
      }
      next[clickedIdx] = 0;
      return { newTiles: next, movedCount: Math.abs(blankRow - clickedRow), moves };
    } else {
      // Tiles below blank shift UP
      for (let r = blankRow + 1; r <= clickedRow; r++) {
        const fromIdx = r * GRID_SIZE + blankCol;
        const toIdx = (r - 1) * GRID_SIZE + blankCol;
        moves.push({
          tileValue: tiles[fromIdx],
          fromIndex: fromIdx,
          toIndex: toIdx,
          directionRelativeToBlank: 'UP',
        });
        next[toIdx] = next[fromIdx];
      }
      next[clickedIdx] = 0;
      return { newTiles: next, movedCount: Math.abs(blankRow - clickedRow), moves };
    }
  }
  return null;
};
export const slideInDirection = (
  tiles: number[],
  dir: 'up' | 'down' | 'left' | 'right'
): SlideResult | null => {
  const blankIdx = tiles.indexOf(0);
  if (blankIdx === -1) return null;
  const blankRow = Math.floor(blankIdx / GRID_SIZE);
  const blankCol = blankIdx % GRID_SIZE;
  let targetRow = blankRow;
  let targetCol = blankCol;
  if (dir === 'up') targetRow = blankRow + 1;
  else if (dir === 'down') targetRow = blankRow - 1;
  else if (dir === 'left') targetCol = blankCol + 1;
  else if (dir === 'right') targetCol = blankCol - 1;
  if (targetRow < 0 || targetRow >= GRID_SIZE || targetCol < 0 || targetCol >= GRID_SIZE) {
    return null;
  }
  const targetIdx = targetRow * GRID_SIZE + targetCol;
  return slideTiles(tiles, targetIdx);
};
export const slideTileInDirection = (
  tiles: number[],
  startIdx: number,
  dir: 'up' | 'down' | 'left' | 'right'
): SlideResult | null => {
  const blankIdx = tiles.indexOf(0);
  if (blankIdx === -1 || startIdx === blankIdx) return null;
  const blankRow = Math.floor(blankIdx / GRID_SIZE);
  const blankCol = blankIdx % GRID_SIZE;
  const startRow = Math.floor(startIdx / GRID_SIZE);
  const startCol = startIdx % GRID_SIZE;
  if (startRow === blankRow) {
    if (blankCol > startCol && dir === 'right') {
      return slideTiles(tiles, startIdx);
    }
    if (blankCol < startCol && dir === 'left') {
      return slideTiles(tiles, startIdx);
    }
  }
  if (startCol === blankCol) {
    if (blankRow > startRow && dir === 'down') {
      return slideTiles(tiles, startIdx);
    }
    if (blankRow < startRow && dir === 'up') {
      return slideTiles(tiles, startIdx);
    }
  }
  return slideInDirection(tiles, dir);
};
