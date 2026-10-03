import type { Position, QueensPuzzle } from './types';
import { isUniqueSolution } from './solver';

/**
 * Deterministic PRNG (Mulberry32)
 */
export function createRng(seedStr: string): () => number {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(31, h) + seedStr.charCodeAt(i);
  }
  let a = h >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Shuffles an array in place using the provided PRNG
 */
function shuffle<T>(array: T[], rng: () => number): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Finds a valid non-touching N-queens permutation:
 * Exactly 1 queen per row and column, and no two queens in adjacent rows touch (|c1 - c2| > 1).
 */
export function generateValidQueenPlacement(size: number, rng: () => number): Position[] | null {
  const cols = new Array(size).fill(-1);
  const usedCols = new Array(size).fill(false);

  function place(r: number): boolean {
    if (r === size) return true;

    const candidateCols: number[] = [];
    for (let c = 0; c < size; c++) {
      if (!usedCols[c]) {
        if (r === 0 || Math.abs(cols[r - 1] - c) > 1) {
          candidateCols.push(c);
        }
      }
    }
    shuffle(candidateCols, rng);

    for (const c of candidateCols) {
      cols[r] = c;
      usedCols[c] = true;
      if (place(r + 1)) return true;
      usedCols[c] = false;
      cols[r] = -1;
    }

    return false;
  }

  const success = place(0);
  if (!success) return null;

  return cols.map((c, r) => ({ r, c }));
}

/**
 * Partitions the N x N grid into N connected, organic, balanced regions
 * with each region initially seeded at one queen's position.
 */
export function growBalancedRegions(
  size: number,
  queenPositions: Position[],
  rng: () => number
): number[][] {
  const regions: number[][] = Array.from({ length: size }, () => new Array(size).fill(-1));
  const regionSizes = new Array(size).fill(0);
  const frontiers: Position[][] = Array.from({ length: size }, () => []);

  // Seed each region with its queen
  queenPositions.forEach((pos, regId) => {
    regions[pos.r][pos.c] = regId;
    regionSizes[regId] = 1;

    // Add unassigned orthogonal neighbors
    const deltas = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    for (const [dr, dc] of deltas) {
      const nr = pos.r + dr;
      const nc = pos.c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        frontiers[regId].push({ r: nr, c: nc });
      }
    }
  });

  let remaining = size * size - size;
  const deltas = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  while (remaining > 0) {
    // Collect regions that can expand
    const activeRegions: number[] = [];
    for (let reg = 0; reg < size; reg++) {
      // Filter frontier cells that are still unassigned
      frontiers[reg] = frontiers[reg].filter((p) => regions[p.r][p.c] === -1);
      if (frontiers[reg].length > 0) {
        activeRegions.push(reg);
      }
    }

    if (activeRegions.length === 0) {
      // Emergency fill: if any cell was isolated, assign to an adjacent region
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (regions[r][c] === -1) {
            for (const [dr, dc] of deltas) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < size && nc >= 0 && nc < size && regions[nr][nc] !== -1) {
                regions[r][c] = regions[nr][nc];
                regionSizes[regions[nr][nc]]++;
                remaining--;
                break;
              }
            }
          }
        }
      }
      break;
    }

    // Sort active regions by size ascending (smallest regions expand first for balance)
    activeRegions.sort((a, b) => regionSizes[a] - regionSizes[b]);

    // Pick among the smallest active regions
    const pickCount = Math.min(3, activeRegions.length);
    const chosenReg = activeRegions[Math.floor(rng() * pickCount)];

    // Pick a random unassigned frontier cell
    const frontier = frontiers[chosenReg];
    const pickIdx = Math.floor(rng() * frontier.length);
    const cell = frontier.splice(pickIdx, 1)[0];

    if (regions[cell.r][cell.c] === -1) {
      regions[cell.r][cell.c] = chosenReg;
      regionSizes[chosenReg]++;
      remaining--;

      // Add newly exposed neighbors to chosenReg's frontier
      for (const [dr, dc] of deltas) {
        const nr = cell.r + dr;
        const nc = cell.c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && regions[nr][nc] === -1) {
          frontier.push({ r: nr, c: nc });
        }
      }
    }
  }

  return regions;
}

const SUPPORTED_SIZES = [6, 7, 8, 9, 10];

/**
 * Procedurally generates a verified uniquely-solvable Queens puzzle.
 * - Chooses random size from 6x6 to 10x10 if not specified.
 * - Generates valid Queen placements.
 * - Grows natural connected regions.
 * - Solves and validates for uniqueness.
 */
export function generateQueensPuzzle(options: {
  seed?: string;
  size?: number;
  maxAttempts?: number;
} = {}): QueensPuzzle {
  const seed = options.seed || `queens_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const maxAttempts = options.maxAttempts || 80;
  const rng = createRng(seed);

  // If size not specified, randomly pick from 6, 7, 8, 9, 10
  const size = options.size && SUPPORTED_SIZES.includes(options.size)
    ? options.size
    : SUPPORTED_SIZES[Math.floor(rng() * SUPPORTED_SIZES.length)];

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const attemptSeed = `${seed}_att_${attempt}`;
    const attemptRng = createRng(attemptSeed);

    const queenPositions = generateValidQueenPlacement(size, attemptRng);
    if (!queenPositions) continue;

    const regions = growBalancedRegions(size, queenPositions, attemptRng);

    // Verify all cells are assigned
    let allAssigned = true;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (regions[r][c] < 0) {
          allAssigned = false;
          break;
        }
      }
      if (!allAssigned) break;
    }
    if (!allAssigned) continue;

    // Verify UNIQUE solution
    if (isUniqueSolution(size, regions)) {
      return {
        id: `qp_${seed}_${size}`,
        size,
        regions,
        solution: queenPositions,
        seed,
        createdAt: new Date().toISOString(),
      };
    }
  }

  // Fallback safe generation with guaranteed uniqueness
  let fallbackAttempt = 0;
  while (true) {
    const fbRng = createRng(`fb_${seed}_${fallbackAttempt}`);
    const fbQueens = generateValidQueenPlacement(size, fbRng);
    if (fbQueens) {
      const fbRegions = growBalancedRegions(size, fbQueens, fbRng);
      if (isUniqueSolution(size, fbRegions)) {
        return {
          id: `qp_${seed}_fb_${fallbackAttempt}`,
          size,
          regions: fbRegions,
          solution: fbQueens,
          seed,
          createdAt: new Date().toISOString(),
        };
      }
    }
    fallbackAttempt++;
  }
}

/**
 * Generates Daily Queens Puzzle based on date string (YYYY-MM-DD)
 */
export function generateDailyQueensPuzzle(dateStr: string = new Date().toISOString().slice(0, 10)): QueensPuzzle {
  const dailySeed = `daily_queens_${dateStr}`;
  return generateQueensPuzzle({ seed: dailySeed });
}
