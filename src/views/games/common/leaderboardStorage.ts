import { recordGameScoreAction, type GameScoreSubmission } from '@/actions/gameLeaderboard';
import { calculateGameScore, type ScoreBreakdown } from './scoring';
import { getAuthToken, getOrCreateGuestId } from '@/utilities/clientSession';
export interface LeaderboardEntry {
  id: string;
  gameId: 'minesweeper' | 'sudoku' | 'word-path' | 'slide-puzzle';
  gameName: string;
  difficulty: string;
  timeSeconds: number;
  score?: number;
  accuracy?: string;
  completedAt: string;
  isPersonalBest?: boolean;
  totalPoints?: number;
  baseScore?: number;
  timeBonus?: number;
  difficultyMultiplier?: number;
  userRank?: number;
  outcome?: 'won' | 'lost';
}
const STORAGE_KEY = 'rupee_games_leaderboard_v1';
export const formatGameTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
export const getLeaderboardEntries = (): LeaderboardEntry[] => {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
export const getGamePersonalBest = (
  gameId: LeaderboardEntry['gameId'],
  difficulty = 'standard'
): LeaderboardEntry | null => {
  const entries = getLeaderboardEntries().filter(
    (e) => e.gameId === gameId && (e.difficulty === difficulty || !difficulty)
  );
  if (entries.length === 0) return null;
  return entries.reduce((best, curr) => {
    const currPoints = curr.totalPoints ?? (10000 - curr.timeSeconds);
    const bestPoints = best.totalPoints ?? (10000 - best.timeSeconds);
    return currPoints > bestPoints ? curr : best;
  }, entries[0]);
};
export const recordGameScore = (
  entry: Omit<LeaderboardEntry, 'id' | 'completedAt' | 'isPersonalBest'> & {
    hintsUsed?: number;
    moves?: number;
  }
): {
  isPersonalBest: boolean;
  bestTime: number;
  scoreBreakdown: ScoreBreakdown;
  recordId: string;
} => {
  const outcome = entry.outcome || 'won';
  const scoreBreakdown = calculateGameScore({
    gameId: entry.gameId,
    difficulty: entry.difficulty,
    timeSeconds: entry.timeSeconds,
    outcome,
    hintsUsed: entry.hintsUsed,
    moves: entry.moves,
  });
  const id = `score_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const prevBest = getGamePersonalBest(entry.gameId, entry.difficulty);
  const isPersonalBest =
    !prevBest || scoreBreakdown.totalPoints > (prevBest.totalPoints ?? 0);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const existing = getLeaderboardEntries();
      const newEntry: LeaderboardEntry = {
        ...entry,
        id,
        completedAt: new Date().toISOString(),
        isPersonalBest,
        totalPoints: scoreBreakdown.totalPoints,
        baseScore: scoreBreakdown.baseScore,
        timeBonus: scoreBreakdown.timeBonus,
        difficultyMultiplier: scoreBreakdown.difficultyMultiplier,
        outcome,
      };
      const updated = [newEntry, ...existing].slice(0, 100);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore write errors
    }
  }
  // Async sync to server database
  const token = getAuthToken();
  const guestId = getOrCreateGuestId();
  const submission: GameScoreSubmission = {
    gameId: entry.gameId,
    gameName: entry.gameName,
    difficulty: entry.difficulty,
    timeSeconds: entry.timeSeconds,
    outcome,
    hintsUsed: entry.hintsUsed,
    moves: entry.moves,
    accuracy: entry.accuracy,
  };
  void recordGameScoreAction(token, guestId, submission).catch((err) => {
    console.warn('Failed to record game score to database:', err);
  });
  return {
    isPersonalBest,
    bestTime: isPersonalBest ? entry.timeSeconds : prevBest?.timeSeconds ?? entry.timeSeconds,
    scoreBreakdown,
    recordId: id,
  };
};
