import type { Position, QueensPuzzle } from './types';
import { isUniqueSolution } from './solver';
import { QUEENS_PRESETS, type QueensPreset } from './presets';

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
 * Partitions the N x N grid into N connected, natural regions with varying sizes
 * (some small/constrained to provide logical deduction anchors).
 */
export function growBalancedRegions(
  size: number,
  queenPositions: Position[],
  rng: () => number
): number[][] {
  const regions: number[][] = Array.from({ length: size }, () => new Array(size).fill(-1));
  const regionSizes = new Array(size).fill(0);

  // Allocate varied target sizes: half the regions smaller (2-3 cells), rest larger
  const targetSizes = new Array(size).fill(0);
  let totalAssigned = 0;
  const numSmall = Math.max(1, Math.floor(size / 2));
  for (let i = 0; i < numSmall; i++) {
    targetSizes[i] = Math.floor(rng() * 2) + 2; // 2 or 3 cells
    totalAssigned += targetSizes[i];
  }
  const remainingCells = size * size - totalAssigned;
  const avg = Math.floor(remainingCells / (size - numSmall));
  for (let i = numSmall; i < size; i++) {
    targetSizes[i] = avg;
    totalAssigned += avg;
  }
  targetSizes[size - 1] += size * size - totalAssigned;

  // Shuffle target sizes
  shuffle(targetSizes, rng);

  const frontiers: Position[][] = Array.from({ length: size }, () => []);
  const deltas = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  // Seed each region with its queen
  queenPositions.forEach((pos, regId) => {
    regions[pos.r][pos.c] = regId;
    regionSizes[regId] = 1;

    for (const [dr, dc] of deltas) {
      const nr = pos.r + dr;
      const nc = pos.c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        frontiers[regId].push({ r: nr, c: nc });
      }
    }
  });

  let remaining = size * size - size;

  while (remaining > 0) {
    const activeRegions: number[] = [];
    for (let reg = 0; reg < size; reg++) {
      frontiers[reg] = frontiers[reg].filter((p) => regions[p.r][p.c] === -1);
      if (frontiers[reg].length > 0 && regionSizes[reg] < targetSizes[reg]) {
        activeRegions.push(reg);
      }
    }

    if (activeRegions.length === 0) {
      for (let reg = 0; reg < size; reg++) {
        if (frontiers[reg].length > 0) activeRegions.push(reg);
      }
    }

    if (activeRegions.length === 0) {
      // Emergency fill: assign unassigned cells to any adjacent region
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

    const chosenReg = activeRegions[Math.floor(rng() * activeRegions.length)];
    const frontier = frontiers[chosenReg];
    const pickIdx = Math.floor(rng() * frontier.length);
    const cell = frontier.splice(pickIdx, 1)[0];

    if (regions[cell.r][cell.c] === -1) {
      regions[cell.r][cell.c] = chosenReg;
      regionSizes[chosenReg]++;
      remaining--;

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

/**
 * Applies dihedral symmetry (D4) and region color permutation to a verified preset.
 * Guarantees isomorphic uniqueness in <0.1ms.
 */
function transformPreset(
  preset: QueensPreset,
  size: number,
  rng: () => number
): { regions: number[][]; solution: Position[] } {
  const symmetry = Math.floor(rng() * 8);
  const perm = Array.from({ length: size }, (_, i) => i);
  shuffle(perm, rng);

  const mapCoord = (r: number, c: number): Position => {
    switch (symmetry) {
      case 0: return { r, c };
      case 1: return { r: c, c: size - 1 - r };
      case 2: return { r: size - 1 - r, c: size - 1 - c };
      case 3: return { r: size - 1 - c, c: r };
      case 4: return { r: size - 1 - r, c };
      case 5: return { r, c: size - 1 - c };
      case 6: return { r: c, c: r };
      case 7: return { r: size - 1 - c, c: size - 1 - r };
      default: return { r, c };
    }
  };

  const newRegions = Array.from({ length: size }, () => new Array(size).fill(0));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const mapped = mapCoord(r, c);
      newRegions[mapped.r][mapped.c] = perm[preset.regions[r][c]];
    }
  }

  const newSolution = preset.solution.map((pos) => mapCoord(pos.r, pos.c));
  return { regions: newRegions, solution: newSolution };
}

const SUPPORTED_SIZES = [6, 7, 8, 9, 10];

/**
 * Fast, non-blocking procedural Queens puzzle generator:
 * 1. Attempts dynamic procedural generation for up to 25 attempts (~5-10ms).
 * 2. If not found within bounded attempts, instantiates an isomorphic transformed preset
 *    (random dihedral rotation/reflection + color permutation) with 100% uniqueness guarantee.
 * 3. Never freezes or blocks the main thread.
 */
export function generateQueensPuzzle(options: {
  seed?: string;
  size?: number;
  maxAttempts?: number;
} = {}): QueensPuzzle {
  const seed = options.seed || `queens_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const maxAttempts = Math.min(options.maxAttempts ?? 25, 40);
  const rng = createRng(seed);

  const size = options.size && SUPPORTED_SIZES.includes(options.size)
    ? options.size
    : SUPPORTED_SIZES[Math.floor(rng() * SUPPORTED_SIZES.length)];

  // Fast procedural generation attempt
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const attemptSeed = `${seed}_att_${attempt}`;
    const attemptRng = createRng(attemptSeed);

    const queenPositions = generateValidQueenPlacement(size, attemptRng);
    if (!queenPositions) continue;

    const regions = growBalancedRegions(size, queenPositions, attemptRng);

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

  // Instant isomorphic fallback using verified presets
  const presetsForSize = QUEENS_PRESETS[size] || QUEENS_PRESETS[6];
  const presetIndex = Math.floor(rng() * presetsForSize.length);
  const basePreset = presetsForSize[presetIndex];
  const { regions: fbRegions, solution: fbSolution } = transformPreset(basePreset, size, rng);

  return {
    id: `qp_${seed}_iso_${presetIndex}`,
    size,
    regions: fbRegions,
    solution: fbSolution,
    seed,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Generates Daily Queens Puzzle based on date string (YYYY-MM-DD)
 */
export function generateDailyQueensPuzzle(dateStr: string = new Date().toISOString().slice(0, 10)): QueensPuzzle {
  const dailySeed = `daily_queens_${dateStr}`;
  return generateQueensPuzzle({ seed: dailySeed, size: 7 });
}
