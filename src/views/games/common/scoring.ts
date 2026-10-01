export interface ScoreCalculationInput {
  gameId: 'minesweeper' | 'sudoku' | 'word-path' | 'slide-puzzle' | 'hitori' | 'tango';
  difficulty: string;
  timeSeconds: number;
  outcome: 'won' | 'lost';
  hintsUsed?: number;
  moves?: number;
}
export interface ScoreBreakdown {
  baseScore: number;
  timeBonus: number;
  difficultyMultiplier: number;
  penalty: number;
  totalPoints: number;
}
export const DIFFICULTY_MULTIPLIERS: Record<string, number> = {
  easy: 1.0,
  medium: 1.5,
  hard: 2.2,
  expert: 2.2,
  '4x4': 1.2,
  standard: 1.0,
};
const BASE_SCORES: Record<string, number> = {
  minesweeper: 500,
  sudoku: 800,
  'word-path': 600,
  'slide-puzzle': 500,
  hitori: 650,
  tango: 700,
};
const TARGET_TIMES: Record<string, Record<string, number>> = {
  minesweeper: {
    easy: 90,
    medium: 240,
    hard: 480,
  },
  sudoku: {
    easy: 360,
    medium: 600,
    hard: 900,
  },
  'word-path': {
    easy: 120,
    medium: 240,
    hard: 420,
  },
  'slide-puzzle': {
    '4x4': 180,
    standard: 180,
  },
  hitori: {
    easy: 120,
    medium: 240,
    hard: 420,
  },
  tango: {
    easy: 120,
    medium: 240,
    hard: 480,
  },
};
export function calculateGameScore(input: ScoreCalculationInput): ScoreBreakdown {
  const diffKey = (input.difficulty || 'easy').toLowerCase();
  const multiplier = DIFFICULTY_MULTIPLIERS[diffKey] ?? 1.0;
  if (input.outcome === 'lost') {
    return {
      baseScore: 50,
      timeBonus: 0,
      difficultyMultiplier: multiplier,
      penalty: 0,
      totalPoints: Math.round(50 * multiplier),
    };
  }
  const baseScore = BASE_SCORES[input.gameId] ?? 500;
  const gameTargets = TARGET_TIMES[input.gameId] || {};
  const targetTime = gameTargets[diffKey] ?? 300;
  const timeDiff = Math.max(0, targetTime - input.timeSeconds);
  const timeBonus = Math.min(1000, Math.round(timeDiff * 2.5));
  let penalty = 0;
  if (input.hintsUsed && input.hintsUsed > 0) {
    penalty += input.hintsUsed * 60;
  }
  if (input.gameId === 'slide-puzzle' && input.moves) {
    // Standard 15 puzzle optimal moves ~80
    const excessMoves = Math.max(0, input.moves - 80);
    penalty += Math.min(200, excessMoves * 2);
  }
  const subtotal = Math.max(100, baseScore + timeBonus - penalty);
  const totalPoints = Math.round(subtotal * multiplier);
  return {
    baseScore,
    timeBonus,
    difficultyMultiplier: multiplier,
    penalty,
    totalPoints,
  };
}
