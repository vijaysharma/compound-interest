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
/** Board sizes offered in the picker; any rows × cols within these bounds is playable. */
export const MIN_DIM = 3;
export const MAX_DIM = 8;
export const isSolved = (tiles: number[]): boolean => {
  for (let i = 0; i < tiles.length - 1; i++) {
    if (tiles[i] !== i + 1) return false;
  }
  return tiles[tiles.length - 1] === 0;
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
// Odd width: solvable iff inversions are even. Even width: iff inversions + blank row (counted
// from the bottom, 1-based) is odd.
export const isSolvable = (tiles: number[], cols = GRID_SIZE): boolean => {
  const blankIdx = tiles.indexOf(0);
  if (blankIdx === -1) return false;
  const inversions = countInversions(tiles);
  if (cols % 2 === 1) return inversions % 2 === 0;
  const blankRowFromBottom = tiles.length / cols - Math.floor(blankIdx / cols);
  return (inversions + blankRowFromBottom) % 2 === 1;
};
/** Sum of each tile's grid distance from its solved position (blank excluded). */
export const manhattanDistance = (tiles: number[], cols = GRID_SIZE): number => {
  let total = 0;
  for (let i = 0; i < tiles.length; i++) {
    const val = tiles[i];
    if (val === 0) continue;
    const target = val - 1;
    total += Math.abs(Math.floor(i / cols) - Math.floor(target / cols)) + Math.abs((i % cols) - (target % cols));
  }
  return total;
};
/**
 * Lower bound on scramble quality. A uniformly random solvable 4x4 board averages a Manhattan
 * distance of ~37 (optimal solutions ~52 moves); anything under this would feel nearly solved.
 */
export const MIN_SCRAMBLE_DISTANCE = 24;
/** Same bar scaled to other sizes (24 for 4×4); small boards get a gentler one. */
export const minScrambleDistance = (cellCount: number): number =>
  Math.round(cellCount * (cellCount >= 16 ? 1.5 : 1));
/** Deterministic solvable scramble for the server render; replaced by a random one on mount. */
export const INITIAL_BOARD: readonly number[] = [12, 1, 10, 2, 7, 11, 4, 14, 5, 0, 9, 15, 8, 13, 6, 3];
const randomPermutation = (rows: number, cols: number): number[] => {
  const total = rows * cols;
  const tiles = Array.from({ length: total }, (_, i) => (i === total - 1 ? 0 : i + 1));
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  if (!isSolvable(tiles, cols)) {
    // Swapping any two numbered tiles flips inversion parity, turning an unsolvable board solvable.
    const a = tiles.findIndex((t) => t !== 0);
    const b = tiles.findIndex((t, i) => i > a && t !== 0);
    [tiles[a], tiles[b]] = [tiles[b], tiles[a]];
  }
  return tiles;
};
export const getShuffledBoard = (rows = GRID_SIZE, cols = GRID_SIZE): number[] => {
  const minDistance = minScrambleDistance(rows * cols);
  let tiles = randomPermutation(rows, cols);
  for (let attempt = 0; attempt < 50 && (isSolved(tiles) || manhattanDistance(tiles, cols) < minDistance); attempt++) {
    tiles = randomPermutation(rows, cols);
  }
  return tiles;
};
export const canSlide = (tiles: number[], clickedIdx: number, cols = GRID_SIZE): boolean => {
  const blankIdx = tiles.indexOf(0);
  if (blankIdx === -1 || clickedIdx === blankIdx) return false;
  const blankRow = Math.floor(blankIdx / cols);
  const blankCol = blankIdx % cols;
  const clickedRow = Math.floor(clickedIdx / cols);
  const clickedCol = clickedIdx % cols;
  return blankRow === clickedRow || blankCol === clickedCol;
};
export const slideTiles = (
  tiles: number[],
  clickedIdx: number,
  cols = GRID_SIZE
): SlideResult | null => {
  const blankIdx = tiles.indexOf(0);
  if (blankIdx === -1 || clickedIdx === blankIdx) return null;
  const blankRow = Math.floor(blankIdx / cols);
  const blankCol = blankIdx % cols;
  const clickedRow = Math.floor(clickedIdx / cols);
  const clickedCol = clickedIdx % cols;
  const next = [...tiles];
  const moves: SlideStep[] = [];
  if (blankRow === clickedRow) {
    if (clickedCol < blankCol) {
      // Tiles to left of blank shift RIGHT
      for (let c = blankCol - 1; c >= clickedCol; c--) {
        const fromIdx = blankRow * cols + c;
        const toIdx = blankRow * cols + (c + 1);
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
        const fromIdx = blankRow * cols + c;
        const toIdx = blankRow * cols + (c - 1);
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
        const fromIdx = r * cols + blankCol;
        const toIdx = (r + 1) * cols + blankCol;
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
        const fromIdx = r * cols + blankCol;
        const toIdx = (r - 1) * cols + blankCol;
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
  dir: 'up' | 'down' | 'left' | 'right',
  cols = GRID_SIZE
): SlideResult | null => {
  const blankIdx = tiles.indexOf(0);
  if (blankIdx === -1) return null;
  const blankRow = Math.floor(blankIdx / cols);
  const blankCol = blankIdx % cols;
  let targetRow = blankRow;
  let targetCol = blankCol;
  if (dir === 'up') targetRow = blankRow + 1;
  else if (dir === 'down') targetRow = blankRow - 1;
  else if (dir === 'left') targetCol = blankCol + 1;
  else if (dir === 'right') targetCol = blankCol - 1;
  if (targetRow < 0 || targetRow >= tiles.length / cols || targetCol < 0 || targetCol >= cols) {
    return null;
  }
  const targetIdx = targetRow * cols + targetCol;
  return slideTiles(tiles, targetIdx, cols);
};
export const slideTileInDirection = (
  tiles: number[],
  startIdx: number,
  dir: 'up' | 'down' | 'left' | 'right',
  cols = GRID_SIZE
): SlideResult | null => {
  const blankIdx = tiles.indexOf(0);
  if (blankIdx === -1 || startIdx === blankIdx) return null;
  const blankRow = Math.floor(blankIdx / cols);
  const blankCol = blankIdx % cols;
  const startRow = Math.floor(startIdx / cols);
  const startCol = startIdx % cols;
  if (startRow === blankRow) {
    if (blankCol > startCol && dir === 'right') {
      return slideTiles(tiles, startIdx, cols);
    }
    if (blankCol < startCol && dir === 'left') {
      return slideTiles(tiles, startIdx, cols);
    }
  }
  if (startCol === blankCol) {
    if (blankRow > startRow && dir === 'down') {
      return slideTiles(tiles, startIdx, cols);
    }
    if (blankRow < startRow && dir === 'up') {
      return slideTiles(tiles, startIdx, cols);
    }
  }
  return slideInDirection(tiles, dir, cols);
};
