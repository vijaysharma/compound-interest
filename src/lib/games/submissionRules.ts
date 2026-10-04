/**
 * Server-side acceptance rules for leaderboard submissions.
 *
 * The client reports a game result; nothing here can prove the puzzle was solved, so these rules
 * bound what a forged result can be: it must belong to a session the server started (real elapsed
 * time), report a plausible time, and stay within per-player volume limits. Limits were set from
 * real play data: the busiest genuine minute had 8 results (mostly instant Minesweeper losses), the
 * busiest genuine day 139, and the fastest genuine win 8s. The abuse this targets ran at 150/min.
 */
export type GameId = 'minesweeper' | 'sudoku' | 'word-path' | 'slide-puzzle' | 'hitori' | 'tango' | 'queens';
const CLASSIC = ['easy', 'medium', 'hard'] as const;
export const ALLOWED_DIFFICULTIES: Record<GameId, readonly string[]> = {
  minesweeper: CLASSIC,
  sudoku: CLASSIC,
  'word-path': CLASSIC,
  hitori: CLASSIC,
  tango: CLASSIC,
  queens: ['6x6', '7x7', '8x8', '9x9', '10x10'],
  'slide-puzzle': ['4x4'],
};
export const SUBMISSION_LIMITS = {
  /** A win reported faster than this is not credible for any game here (fastest real win: 8s). */
  minWinSeconds: 5,
  /** Client timers tick in whole seconds and start a moment after the session; allow for that. */
  clockGraceSeconds: 3,
  sessionMaxAgeSeconds: 6 * 60 * 60,
  resultsPerMinute: 12,
  winsPerMinute: 6,
  winsPerDay: 200,
  resultsPerIpPerMinute: 20,
  sessionStartsPerMinute: 20,
  sessionStartsPerIpPerMinute: 60,
} as const;
export function isGameId(value: unknown): value is GameId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(ALLOWED_DIFFICULTIES, value);
}
export function isAllowedDifficulty(gameId: GameId, difficulty: unknown): difficulty is string {
  return typeof difficulty === 'string' && ALLOWED_DIFFICULTIES[gameId].includes(difficulty);
}
/** Non-negative integer within `max`, or `undefined` when absent; `null` marks an invalid value. */
export function boundedCount(value: unknown, max: number): number | undefined | null {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > max) return null;
  return value;
}
/**
 * Why a reported time is rejected given the server-measured session age, or `null` if credible.
 * Reporting a *longer* time than the session existed is impossible; a shorter one is normal
 * (the session opens when the game page loads, before play starts).
 */
export function implausibleTimeReason(
  timeSeconds: number,
  sessionAgeSeconds: number,
  outcome: 'won' | 'lost'
): string | null {
  if (outcome === 'won' && timeSeconds < SUBMISSION_LIMITS.minWinSeconds) return 'win_too_fast';
  if (timeSeconds > sessionAgeSeconds + SUBMISSION_LIMITS.clockGraceSeconds) return 'time_exceeds_session';
  return null;
}
