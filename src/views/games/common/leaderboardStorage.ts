import { useEffect } from 'react';
import {
  recordGameScoreAction,
  startGameSessionAction,
  type GameScoreSubmission,
} from '@/actions/gameLeaderboard';
import { calculateGameScore, type ScoreBreakdown } from './scoring';
import { getAuthToken, getOrCreateGuestId } from '@/utilities/clientSession';
export interface LeaderboardEntry {
  id: string;
  gameId: 'minesweeper' | 'sudoku' | 'word-path' | 'slide-puzzle' | 'hitori' | 'tango' | 'queens';
  gameName: string;

  difficulty: string;
  timeSeconds: number;
  score?: number;
  accuracy?: string;
  completedAt: string;
  playerName?: string;
  isPersonalBest?: boolean;
  totalPoints?: number;
  baseScore?: number;
  timeBonus?: number;
  difficultyMultiplier?: number;
  userRank?: number;
  outcome?: 'won' | 'lost';
}
const STORAGE_KEY = 'rupee_games_leaderboard_v1';
type GameId = LeaderboardEntry['gameId'];
interface PendingSession {
  token: string | null;
  guestId: string;
  sessionId: Promise<string | null>;
}
// The server only ranks a result submitted against a session it opened, so it can measure the real
// elapsed time. One is opened when a game page mounts and again after each result (play again).
const pendingSessions = new Map<GameId, PendingSession>();
const openGameSession = (gameId: GameId): void => {
  const token = getAuthToken();
  const guestId = getOrCreateGuestId();
  const sessionId = startGameSessionAction(token, guestId, gameId)
    .then((res) => (res.success && res.sessionId ? res.sessionId : null))
    .catch(() => null);
  pendingSessions.set(gameId, { token, guestId, sessionId });
};
/** Call once in each game component so its results can be ranked on the server leaderboard. */
export const useGameSession = (gameId: GameId): void => {
  useEffect(() => {
    openGameSession(gameId);
  }, [gameId]);
};
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
  // Async sync to server database, against the session opened for this game. Without one (the
  // game didn't call useGameSession) the result stays local only.
  const session = pendingSessions.get(entry.gameId);
  if (session) openGameSession(entry.gameId);
  let clientPlayerName = entry.playerName?.trim();
  if (!clientPlayerName && typeof window !== 'undefined') {
    try {
      const rawUser = window.localStorage.getItem('auth_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        clientPlayerName = u.user_alias || u.name || undefined;
      }
    } catch {
      // Ignore parse error
    }
  }
  const submission: GameScoreSubmission = {
    gameId: entry.gameId,
    gameName: entry.gameName,
    difficulty: entry.difficulty,
    timeSeconds: entry.timeSeconds,
    outcome,
    hintsUsed: entry.hintsUsed,
    moves: entry.moves,
    accuracy: entry.accuracy,
    playerName: clientPlayerName,
  };
  if (session) {
    void session.sessionId
      .then((sessionId) => {
        if (!sessionId) return undefined;
        return recordGameScoreAction(session.token, session.guestId, { ...submission, sessionId });
      })
      .catch((err) => {
        console.warn('Failed to record game score to database:', err);
      });
  }
  return {
    isPersonalBest,
    bestTime: isPersonalBest ? entry.timeSeconds : prevBest?.timeSeconds ?? entry.timeSeconds,
    scoreBreakdown,
    recordId: id,
  };
};
