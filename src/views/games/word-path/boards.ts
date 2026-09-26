import type { BoardDefinition, Difficulty } from './types';
import { buildBoardFromWords } from './generator';
// ── EASY BOARDS (5x5 = 25 cells) ─────────────────────────────────────────────
export const EASY_BOARD_1: BoardDefinition = buildBoardFromWords(
  'easy-nature',
  'Nature & Earth',
  'Nature & Earth',
  'easy',
  5,
  5,
  [
    {
      word: 'EARTH',
      path: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 0, col: 3 },
        { row: 0, col: 4 },
      ],
    },
    {
      word: 'OCEAN',
      path: [
        { row: 1, col: 4 },
        { row: 1, col: 3 },
        { row: 1, col: 2 },
        { row: 1, col: 1 },
        { row: 1, col: 0 },
      ],
    },
    {
      word: 'CANYON',
      path: [
        { row: 2, col: 0 },
        { row: 3, col: 0 },
        { row: 4, col: 0 },
        { row: 4, col: 1 },
        { row: 3, col: 1 },
        { row: 2, col: 1 },
      ],
    },
    {
      word: 'MOUNTAINS',
      path: [
        { row: 2, col: 2 },
        { row: 3, col: 2 },
        { row: 4, col: 2 },
        { row: 4, col: 3 },
        { row: 3, col: 3 },
        { row: 2, col: 3 },
        { row: 2, col: 4 },
        { row: 3, col: 4 },
        { row: 4, col: 4 },
      ],
    },
  ]
);
export const EASY_BOARD_2: BoardDefinition = buildBoardFromWords(
  'easy-space',
  'Cosmic Exploration',
  'Space & Cosmos',
  'easy',
  5,
  5,
  [
    {
      word: 'MOON',
      path: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 1, col: 1 },
        { row: 1, col: 0 },
      ],
    },
    {
      word: 'ORBIT',
      path: [
        { row: 2, col: 0 },
        { row: 3, col: 0 },
        { row: 4, col: 0 },
        { row: 4, col: 1 },
        { row: 3, col: 1 },
      ],
    },
    {
      word: 'ECLIPSE',
      path: [
        { row: 2, col: 1 },
        { row: 2, col: 2 },
        { row: 1, col: 2 },
        { row: 0, col: 2 },
        { row: 0, col: 3 },
        { row: 1, col: 3 },
        { row: 2, col: 3 },
      ],
    },
    {
      word: 'SATELLITE',
      path: [
        { row: 0, col: 4 },
        { row: 1, col: 4 },
        { row: 2, col: 4 },
        { row: 3, col: 4 },
        { row: 4, col: 4 },
        { row: 4, col: 3 },
        { row: 4, col: 2 },
        { row: 3, col: 2 },
        { row: 3, col: 3 },
      ],
    },
  ]
);
// ── MEDIUM BOARDS ────────────────────────────────────────────────────────────
/**
 * Screenshot board: "Optics & Visuals" (7x7 grid)
 * Matches the reference design with 5 hidden words:
 * 1. OPTIC (5 letters, Purple)
 * 2. PICTURE (7 letters, Green)
 * 3. GRAPHICS (8 letters, Orange)
 * 4. CINEMATIC (9 letters, Pink)
 * 5. MICROSCOPE (10 letters, Yellow)
 */
export const MEDIUM_BOARD_SCREENSHOT: BoardDefinition = buildBoardFromWords(
  'medium-optics',
  'Optics & Visuals',
  'Optics & Visuals',
  'medium',
  7,
  7,
  [
    {
      // OPTIC: 5 letters (Purple)
      word: 'OPTIC',
      path: [
        { row: 3, col: 3 }, // O (badge start)
        { row: 3, col: 4 }, // P (>)
        { row: 2, col: 4 }, // T (^)
        { row: 1, col: 4 }, // I (^)
        { row: 0, col: 4 }, // C (end)
      ],
    },
    {
      // PICTURE: 7 letters (Green)
      word: 'PICTURE',
      path: [
        { row: 0, col: 5 }, // P (badge start)
        { row: 0, col: 6 }, // I (>)
        { row: 1, col: 6 }, // C (v)
        { row: 1, col: 5 }, // T (<)
        { row: 2, col: 5 }, // U (v)
        { row: 3, col: 5 }, // R (v)
        { row: 4, col: 5 }, // E (end)
      ],
    },
    {
      // GRAPHICS: 8 letters (Orange)
      word: 'GRAPHICS',
      path: [
        { row: 2, col: 0 }, // G (badge start)
        { row: 3, col: 0 }, // R (v)
        { row: 4, col: 0 }, // A (v)
        { row: 4, col: 1 }, // P (>)
        { row: 5, col: 1 }, // H (v)
        { row: 6, col: 1 }, // I (v)
        { row: 6, col: 0 }, // C (<)
        { row: 5, col: 0 }, // S (end)
      ],
    },
    {
      // CINEMATIC: 9 letters (Pink)
      word: 'CINEMATIC',
      path: [
        { row: 2, col: 6 }, // C (badge start)
        { row: 3, col: 6 }, // I (v)
        { row: 4, col: 6 }, // N (v)
        { row: 5, col: 6 }, // E (v)
        { row: 6, col: 6 }, // M (v)
        { row: 6, col: 5 }, // A (<)
        { row: 5, col: 5 }, // T (^)
        { row: 5, col: 4 }, // I (<)
        { row: 5, col: 3 }, // C (end)
      ],
    },
    {
      // MICROSCOPE: 10 letters (Yellow)
      word: 'MICROSCOPE',
      path: [
        { row: 0, col: 1 }, // M (badge start)
        { row: 0, col: 2 }, // I (>)
        { row: 1, col: 2 }, // C (v)
        { row: 2, col: 2 }, // R (v)
        { row: 3, col: 2 }, // O (v)
        { row: 3, col: 1 }, // S (<)
        { row: 2, col: 1 }, // C (^)
        { row: 1, col: 1 }, // O (^)
        { row: 1, col: 0 }, // P (<)
        { row: 0, col: 0 }, // E (end)
      ],
    },
  ]
);
export const MEDIUM_BOARD_TECH: BoardDefinition = buildBoardFromWords(
  'medium-tech',
  'Tech & Code',
  'Tech & Computing',
  'medium',
  7,
  6,
  [
    {
      word: 'ROUTER',
      path: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 0, col: 3 },
        { row: 0, col: 4 },
        { row: 0, col: 5 },
      ],
    },
    {
      word: 'NETWORK',
      path: [
        { row: 1, col: 5 },
        { row: 1, col: 4 },
        { row: 1, col: 3 },
        { row: 1, col: 2 },
        { row: 1, col: 1 },
        { row: 1, col: 0 },
        { row: 2, col: 0 },
      ],
    },
    {
      word: 'TERMINAL',
      path: [
        { row: 2, col: 1 },
        { row: 2, col: 2 },
        { row: 2, col: 3 },
        { row: 2, col: 4 },
        { row: 2, col: 5 },
        { row: 3, col: 5 },
        { row: 3, col: 4 },
        { row: 3, col: 3 },
      ],
    },
    {
      word: 'ALGORITHM',
      path: [
        { row: 3, col: 2 },
        { row: 3, col: 1 },
        { row: 3, col: 0 },
        { row: 4, col: 0 },
        { row: 4, col: 1 },
        { row: 4, col: 2 },
        { row: 4, col: 3 },
        { row: 4, col: 4 },
        { row: 4, col: 5 },
      ],
    },
    {
      word: 'TECHNOLOGIES',
      path: [
        { row: 5, col: 5 },
        { row: 5, col: 4 },
        { row: 5, col: 3 },
        { row: 5, col: 2 },
        { row: 5, col: 1 },
        { row: 5, col: 0 },
        { row: 6, col: 0 },
        { row: 6, col: 1 },
        { row: 6, col: 2 },
        { row: 6, col: 3 },
        { row: 6, col: 4 },
        { row: 6, col: 5 },
      ],
    },
  ]
);
// ── HARD BOARDS (8x8 = 64 cells) ─────────────────────────────────────────────
export const HARD_BOARD_1: BoardDefinition = buildBoardFromWords(
  'hard-cosmos',
  'Deep Space & Physics',
  'Space & Cosmos',
  'hard',
  8,
  8,
  [
    {
      word: 'ASTEROID',
      path: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 0, col: 3 },
        { row: 0, col: 4 },
        { row: 0, col: 5 },
        { row: 0, col: 6 },
        { row: 0, col: 7 },
      ],
    },
    {
      word: 'SPECTRUM',
      path: [
        { row: 1, col: 7 },
        { row: 1, col: 6 },
        { row: 1, col: 5 },
        { row: 1, col: 4 },
        { row: 1, col: 3 },
        { row: 1, col: 2 },
        { row: 1, col: 1 },
        { row: 1, col: 0 },
      ],
    },
    {
      word: 'TELESCOPE',
      path: [
        { row: 2, col: 0 },
        { row: 2, col: 1 },
        { row: 2, col: 2 },
        { row: 2, col: 3 },
        { row: 2, col: 4 },
        { row: 2, col: 5 },
        { row: 2, col: 6 },
        { row: 2, col: 7 },
        { row: 3, col: 7 },
      ],
    },
    {
      word: 'SUPERNOVA',
      path: [
        { row: 3, col: 6 },
        { row: 3, col: 5 },
        { row: 3, col: 4 },
        { row: 3, col: 3 },
        { row: 3, col: 2 },
        { row: 3, col: 1 },
        { row: 3, col: 0 },
        { row: 4, col: 0 },
        { row: 4, col: 1 },
      ],
    },
    {
      word: 'ATMOSPHERE',
      path: [
        { row: 4, col: 2 },
        { row: 4, col: 3 },
        { row: 4, col: 4 },
        { row: 4, col: 5 },
        { row: 4, col: 6 },
        { row: 4, col: 7 },
        { row: 5, col: 7 },
        { row: 5, col: 6 },
        { row: 5, col: 5 },
        { row: 5, col: 4 },
      ],
    },
    {
      word: 'NAVIGATION',
      path: [
        { row: 5, col: 3 },
        { row: 5, col: 2 },
        { row: 5, col: 1 },
        { row: 5, col: 0 },
        { row: 6, col: 0 },
        { row: 6, col: 1 },
        { row: 6, col: 2 },
        { row: 6, col: 3 },
        { row: 6, col: 4 },
        { row: 6, col: 5 },
      ],
    },
    {
      word: 'EXPERIMENT',
      path: [
        { row: 6, col: 6 },
        { row: 6, col: 7 },
        { row: 7, col: 7 },
        { row: 7, col: 6 },
        { row: 7, col: 5 },
        { row: 7, col: 4 },
        { row: 7, col: 3 },
        { row: 7, col: 2 },
        { row: 7, col: 1 },
        { row: 7, col: 0 },
      ],
    },
  ]
);
export const PRESET_BOARDS: Record<Difficulty, BoardDefinition[]> = {
  easy: [EASY_BOARD_1, EASY_BOARD_2],
  medium: [MEDIUM_BOARD_SCREENSHOT, MEDIUM_BOARD_TECH],
  hard: [HARD_BOARD_1],
};
