import type { Cell } from './types';
export function createEmptyBoard(rows: number, cols: number): Cell[][] {
  const board: Cell[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        row: r,
        col: c,
        isMine: false,
        state: 'hidden',
        neighborMines: 0,
      });
    }
    board.push(row);
  }
  return board;
}
export function getNeighbors(r: number, c: number, rows: number, cols: number): [number, number][] {
  const neighbors: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        neighbors.push([nr, nc]);
      }
    }
  }
  return neighbors;
}
export function populateMines(
  board: Cell[][],
  rows: number,
  cols: number,
  totalMines: number,
  safeR: number,
  safeC: number
): void {
  const safeZone = new Set<string>();
  safeZone.add(`${safeR}-${safeC}`);
  const safeNeighbors = getNeighbors(safeR, safeC, rows, cols);
  if (rows * cols - totalMines > safeNeighbors.length + 1) {
    safeNeighbors.forEach(([nr, nc]) => safeZone.add(`${nr}-${nc}`));
  }
  const candidateCoords: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!safeZone.has(`${r}-${c}`)) {
        candidateCoords.push([r, c]);
      }
    }
  }
  for (let i = candidateCoords.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidateCoords[i], candidateCoords[j]] = [candidateCoords[j], candidateCoords[i]];
  }
  const minesToPlace = Math.min(totalMines, candidateCoords.length);
  for (let i = 0; i < minesToPlace; i++) {
    const [mr, mc] = candidateCoords[i];
    board[mr][mc].isMine = true;
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].isMine) continue;
      const neighbors = getNeighbors(r, c, rows, cols);
      const mineCount = neighbors.filter(([nr, nc]) => board[nr][nc].isMine).length;
      board[r][c].neighborMines = mineCount;
    }
  }
}
export function floodFillReveal(board: Cell[][], startR: number, startC: number, rows: number, cols: number): void {
  const queue: [number, number][] = [[startR, startC]];
  const visited = new Set<string>();
  visited.add(`${startR}-${startC}`);
  while (queue.length > 0) {
    const [currR, currC] = queue.shift()!;
    const cell = board[currR][currC];
    if (cell.state === 'flagged') continue;
    cell.state = 'revealed';
    if (cell.neighborMines === 0 && !cell.isMine) {
      const neighbors = getNeighbors(currR, currC, rows, cols);
      for (const [nr, nc] of neighbors) {
        const key = `${nr}-${nc}`;
        if (!visited.has(key)) {
          visited.add(key);
          const nCell = board[nr][nc];
          if (nCell.state === 'hidden' || nCell.state === 'question') {
            if (nCell.neighborMines === 0 && !nCell.isMine) {
              queue.push([nr, nc]);
            } else if (!nCell.isMine) {
              nCell.state = 'revealed';
            }
          }
        }
      }
    }
  }
}
export function checkWinCondition(board: Cell[][], rows: number, cols: number, totalMines: number): boolean {
  let revealedCount = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].state === 'revealed') {
        revealedCount++;
      }
    }
  }
  return revealedCount === rows * cols - totalMines;
}
export function getFlaggedCount(board: Cell[][]): number {
  let count = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell.state === 'flagged') count++;
    }
  }
  return count;
}
