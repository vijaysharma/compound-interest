export const GRID_SIZE = 4;
export const TOTAL_TILES = 16;
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
export const getShuffledBoard = (): number[] => {
  const tiles = Array.from({ length: TOTAL_TILES }, (_, i) => (i === TOTAL_TILES - 1 ? 0 : i + 1));
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  if (!isSolvable(tiles)) {
    let firstNonZero = -1;
    let secondNonZero = -1;
    for (let i = 0; i < tiles.length; i++) {
      if (tiles[i] !== 0) {
        if (firstNonZero === -1) {
          firstNonZero = i;
        } else if (secondNonZero === -1) {
          secondNonZero = i;
          break;
        }
      }
    }
    if (firstNonZero !== -1 && secondNonZero !== -1) {
      [tiles[firstNonZero], tiles[secondNonZero]] = [tiles[secondNonZero], tiles[firstNonZero]];
    }
  }
  if (isSolved(tiles)) {
    const blankIdx = tiles.indexOf(0);
    const swapTarget = blankIdx === 15 ? 14 : 15;
    [tiles[blankIdx], tiles[swapTarget]] = [tiles[swapTarget], tiles[blankIdx]];
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
): { newTiles: number[]; movedCount: number } | null => {
  const blankIdx = tiles.indexOf(0);
  if (blankIdx === -1 || clickedIdx === blankIdx) return null;
  const blankRow = Math.floor(blankIdx / GRID_SIZE);
  const blankCol = blankIdx % GRID_SIZE;
  const clickedRow = Math.floor(clickedIdx / GRID_SIZE);
  const clickedCol = clickedIdx % GRID_SIZE;
  const next = [...tiles];
  if (blankRow === clickedRow) {
    const step = clickedCol < blankCol ? -1 : 1;
    for (let c = blankCol; c !== clickedCol; c += step) {
      next[blankRow * GRID_SIZE + c] = next[blankRow * GRID_SIZE + (c + step)];
    }
    next[clickedIdx] = 0;
    return { newTiles: next, movedCount: Math.abs(blankCol - clickedCol) };
  }
  if (blankCol === clickedCol) {
    const step = clickedRow < blankRow ? -1 : 1;
    for (let r = blankRow; r !== clickedRow; r += step) {
      next[r * GRID_SIZE + blankCol] = next[(r + step) * GRID_SIZE + blankCol];
    }
    next[clickedIdx] = 0;
    return { newTiles: next, movedCount: Math.abs(blankRow - clickedRow) };
  }
  return null;
};
export const slideInDirection = (
  tiles: number[],
  dir: 'up' | 'down' | 'left' | 'right'
): { newTiles: number[]; movedCount: number } | null => {
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
