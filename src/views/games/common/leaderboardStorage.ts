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
  return entries.reduce((best, curr) => (curr.timeSeconds < best.timeSeconds ? curr : best), entries[0]);
};
export const recordGameScore = (
  entry: Omit<LeaderboardEntry, 'id' | 'completedAt' | 'isPersonalBest'>
): { isPersonalBest: boolean; bestTime: number } => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { isPersonalBest: false, bestTime: entry.timeSeconds };
  }
  try {
    const existing = getLeaderboardEntries();
    const prevBest = getGamePersonalBest(entry.gameId, entry.difficulty);
    const isPersonalBest = !prevBest || entry.timeSeconds < prevBest.timeSeconds;
    const newEntry: LeaderboardEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      completedAt: new Date().toISOString(),
      isPersonalBest,
    };
    const updated = [newEntry, ...existing].slice(0, 100);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return {
      isPersonalBest,
      bestTime: isPersonalBest ? entry.timeSeconds : prevBest.timeSeconds,
    };
  } catch {
    return { isPersonalBest: false, bestTime: entry.timeSeconds };
  }
};
