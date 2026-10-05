'use server';
import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { ensureTables, getDb, getUserFromToken } from '@/lib/db';
import { redisIncr } from '@/lib/redis';
import {
  SUBMISSION_LIMITS,
  boundedCount,
  implausibleTimeReason,
  isAllowedDifficulty,
  isGameId,
  type GameId,
} from '@/lib/games/submissionRules';
import { calculateGameScore, type ScoreBreakdown } from '@/views/games/common/scoring';
export interface GameScoreSubmission {
  gameId: GameId;
  gameName: string;
  /** From startGameSessionAction; a result without a live session is not recorded. */
  sessionId?: string;
  difficulty: string;
  timeSeconds: number;
  outcome?: 'won' | 'lost';
  hintsUsed?: number;
  moves?: number;
  accuracy?: string;
  playerName?: string;
}
export interface LeaderboardRecord {
  id: string;
  userId: string;
  playerName: string;
  gameId: string;
  difficulty: string;
  timeSeconds: number;
  baseScore: number;
  timeBonus: number;
  difficultyMultiplier: number;
  totalPoints: number;
  outcome: string;
  accuracy?: string;
  createdAt: string;
  rank?: number;
}
export interface GlobalLeaderboardRecord {
  userId: string;
  playerName: string;
  totalGames: number;
  totalPoints: number;
  bestGame: string;
  rank?: number;
}
type Sql = ReturnType<typeof getDb>;
/** Who is submitting: a signed-in user, else the browser's guest id. Anonymous play isn't ranked. */
async function resolvePlayer(
  token: string | null | undefined,
  guestId: string | null | undefined,
  sql: Sql
): Promise<{ ownerId: string; playerName: string | null } | null> {
  if (token) {
    const user = await getUserFromToken(token, sql);
    if (user?.id) return { ownerId: `user_${user.id}`, playerName: user.user_alias || user.name?.trim() || null };
  }
  if (guestId) return { ownerId: `guest_${guestId.slice(0, 48)}`, playerName: null };
  return null;
}
/** Hashed client IP, so guests rotating ids still share one limit. Never stored in the clear. */
async function clientIpHash(): Promise<string | null> {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip')?.trim();
  return ip ? createHash('sha256').update(ip).digest('hex') : null;
}
/** Fixed one-minute window counter; atomic in Upstash, so concurrent requests can't all slip under it. */
async function overMinuteLimit(bucket: string, id: string, limit: number): Promise<boolean> {
  const minute = Math.floor(Date.now() / 60_000);
  return (await redisIncr(`game:rl:${bucket}:${id}:${minute}`, 120)) > limit;
}
export async function startGameSessionAction(
  token: string | null | undefined,
  guestId: string | null | undefined,
  gameId: GameId
): Promise<{ success: boolean; sessionId?: string; reason?: string }> {
  if (!isGameId(gameId)) return { success: false, reason: 'invalid_game' };
  const sql = getDb();
  await ensureTables(sql);
  const player = await resolvePlayer(token, guestId, sql);
  if (!player) return { success: false, reason: 'no_identity' };
  const ipHash = await clientIpHash();
  if (
    (await overMinuteLimit('start', player.ownerId, SUBMISSION_LIMITS.sessionStartsPerMinute)) ||
    (ipHash && (await overMinuteLimit('start-ip', ipHash, SUBMISSION_LIMITS.sessionStartsPerIpPerMinute)))
  ) {
    return { success: false, reason: 'rate_limited' };
  }
  const sessionId = `gs_${crypto.randomUUID()}`;
  await sql`
    INSERT INTO game_sessions (id, owner_id, game_id, ip_hash)
    VALUES (${sessionId}, ${player.ownerId}, ${gameId}, ${ipHash})
  `;
  // Occasional sweep of sessions too old to be redeemed; no scheduler needed.
  if (Math.random() < 0.02) {
    await sql`DELETE FROM game_sessions WHERE started_at < NOW() - INTERVAL '2 days'`;
  }
  return { success: true, sessionId };
}
type RecordResult = {
  success: boolean;
  reason?: string;
  scoreBreakdown?: ScoreBreakdown;
  recordId?: string;
  isPersonalBest?: boolean;
  userRank?: number;
};
export async function recordGameScoreAction(
  token: string | null | undefined,
  guestId: string | null | undefined,
  submission: GameScoreSubmission
): Promise<RecordResult> {
  // Everything below is client-supplied: validate shape before touching the database.
  const { gameId, difficulty, sessionId } = submission;
  if (!isGameId(gameId) || !isAllowedDifficulty(gameId, difficulty)) return { success: false, reason: 'invalid_game' };
  const outcome = submission.outcome ?? 'won';
  if (outcome !== 'won' && outcome !== 'lost') return { success: false, reason: 'invalid_outcome' };
  const timeSeconds = boundedCount(submission.timeSeconds, 24 * 60 * 60);
  const hintsUsed = boundedCount(submission.hintsUsed, 1000);
  const moves = boundedCount(submission.moves, 100_000);
  if (timeSeconds === undefined || timeSeconds === null || hintsUsed === null || moves === null) {
    return { success: false, reason: 'invalid_values' };
  }
  if (typeof sessionId !== 'string' || !sessionId) return { success: false, reason: 'no_session' };
  const sql = getDb();
  await ensureTables(sql);
  const player = await resolvePlayer(token, guestId, sql);
  if (!player) return { success: false, reason: 'no_identity' };
  // Single use: only the first submission against a session consumes it.
  const consumed = (await sql`
    UPDATE game_sessions SET consumed_at = NOW()
    WHERE id = ${sessionId} AND owner_id = ${player.ownerId} AND game_id = ${gameId}
      AND consumed_at IS NULL
      AND started_at > NOW() - make_interval(secs => ${SUBMISSION_LIMITS.sessionMaxAgeSeconds})
    RETURNING EXTRACT(EPOCH FROM (NOW() - started_at))::float AS age_seconds, ip_hash
  `) as Array<{ age_seconds: number; ip_hash: string | null }>;
  if (consumed.length === 0) return { success: false, reason: 'invalid_session' };
  const timeReason = implausibleTimeReason(timeSeconds, Number(consumed[0].age_seconds), outcome);
  if (timeReason) return { success: false, reason: timeReason };
  const ipHash = consumed[0].ip_hash;
  if (
    (await overMinuteLimit('result', player.ownerId, SUBMISSION_LIMITS.resultsPerMinute)) ||
    (outcome === 'won' && (await overMinuteLimit('win', player.ownerId, SUBMISSION_LIMITS.winsPerMinute))) ||
    (ipHash && (await overMinuteLimit('result-ip', ipHash, SUBMISSION_LIMITS.resultsPerIpPerMinute)))
  ) {
    return { success: false, reason: 'rate_limited' };
  }
  if (outcome === 'won') {
    // Count verified sessions, not leaderboard rows: rows written before session checks existed
    // must not lock a player out (product decision: no account is blocked for past abuse).
    const [{ results }] = (await sql`
      SELECT COUNT(*)::int AS results FROM game_sessions
      WHERE owner_id = ${player.ownerId} AND consumed_at > NOW() - INTERVAL '1 day'
    `) as Array<{ results: number }>;
    if (results > SUBMISSION_LIMITS.winsPerDay) return { success: false, reason: 'daily_limit' };
  }
  const effectiveUserId = player.ownerId;
  const clientName = typeof submission.playerName === 'string' ? submission.playerName.trim() : '';
  const effectivePlayerName = player.playerName || clientName || 'Player';
  const scoreBreakdown = calculateGameScore({ gameId, difficulty, timeSeconds, outcome, hintsUsed, moves });
  const id = `score_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  // Check personal best for this game and difficulty
  const prevBestRows = (await sql`
    SELECT total_points, time_seconds
    FROM game_leaderboard
    WHERE user_id = ${effectiveUserId} AND game_id = ${gameId} AND difficulty = ${difficulty}
    ORDER BY total_points DESC, time_seconds ASC
    LIMIT 1
  `) as Array<{ total_points: number; time_seconds: number }>;
  const isPersonalBest =
    prevBestRows.length === 0 || scoreBreakdown.totalPoints > Number(prevBestRows[0].total_points);
  await sql`
    INSERT INTO game_leaderboard (
      id, user_id, player_name, game_id, difficulty, time_seconds,
      base_score, time_bonus, difficulty_multiplier, total_points,
      outcome, accuracy, created_at
    ) VALUES (
      ${id},
      ${effectiveUserId},
      ${effectivePlayerName.slice(0, 64)},
      ${gameId},
      ${difficulty},
      ${timeSeconds},
      ${scoreBreakdown.baseScore},
      ${scoreBreakdown.timeBonus},
      ${scoreBreakdown.difficultyMultiplier},
      ${scoreBreakdown.totalPoints},
      ${outcome},
      ${typeof submission.accuracy === 'string' ? submission.accuracy.slice(0, 16) : null},
      NOW()
    )
  `;
  // Calculate user rank for this game & difficulty
  const rankRows = (await sql`
    SELECT COUNT(*)::int AS higher_count
    FROM game_leaderboard
    WHERE game_id = ${gameId}
      AND difficulty = ${difficulty}
      AND total_points > ${scoreBreakdown.totalPoints}
  `) as Array<{ higher_count: number }>;
  const userRank = (rankRows[0]?.higher_count ?? 0) + 1;
  return {
    success: true,
    scoreBreakdown,
    recordId: id,
    isPersonalBest,
    userRank,
  };
}
export async function getGameLeaderboardAction(
  gameId?: string,
  difficulty?: string,
  limit = 20
): Promise<LeaderboardRecord[]> {
  const sql = getDb();
  await ensureTables(sql);
  const safeLimit = Math.min(50, Math.max(1, limit));
  let rows: Array<{
    id: string;
    user_id: string;
    player_name: string;
    game_id: string;
    difficulty: string;
    time_seconds: number;
    base_score: number;
    time_bonus: number;
    difficulty_multiplier: number | string;
    total_points: number;
    outcome: string;
    accuracy: string | null;
    created_at: string;
  }> = [];
  if (gameId && gameId !== 'all') {
    if (difficulty && difficulty !== 'all') {
      rows = (await sql`
        SELECT id, user_id, player_name, game_id, difficulty, time_seconds,
               base_score, time_bonus, difficulty_multiplier, total_points,
               outcome, accuracy, created_at::text AS created_at
        FROM game_leaderboard
        WHERE game_id = ${gameId} AND difficulty = ${difficulty}
        ORDER BY total_points DESC, time_seconds ASC
        LIMIT ${safeLimit}
      `) as typeof rows;
    } else {
      rows = (await sql`
        SELECT id, user_id, player_name, game_id, difficulty, time_seconds,
               base_score, time_bonus, difficulty_multiplier, total_points,
               outcome, accuracy, created_at::text AS created_at
        FROM game_leaderboard
        WHERE game_id = ${gameId}
        ORDER BY total_points DESC, time_seconds ASC
        LIMIT ${safeLimit}
      `) as typeof rows;
    }
  } else {
    rows = (await sql`
      SELECT id, user_id, player_name, game_id, difficulty, time_seconds,
             base_score, time_bonus, difficulty_multiplier, total_points,
             outcome, accuracy, created_at::text AS created_at
      FROM game_leaderboard
      ORDER BY total_points DESC, time_seconds ASC
      LIMIT ${safeLimit}
    `) as typeof rows;
  }
  return rows.map((r, idx) => ({
    id: r.id,
    userId: r.user_id,
    playerName: r.player_name,
    gameId: r.game_id,
    difficulty: r.difficulty,
    timeSeconds: r.time_seconds,
    baseScore: r.base_score,
    timeBonus: r.time_bonus,
    difficultyMultiplier: Number(r.difficulty_multiplier),
    totalPoints: r.total_points,
    outcome: r.outcome,
    accuracy: r.accuracy || undefined,
    createdAt: r.created_at,
    rank: idx + 1,
  }));
}
export async function getGlobalLeaderboardAction(limit = 20): Promise<GlobalLeaderboardRecord[]> {
  const sql = getDb();
  await ensureTables(sql);
  const safeLimit = Math.min(50, Math.max(1, limit));
  // Grouped by account, not display name: a guest's name is self-reported, so grouping by it let
  // anyone merge their points into (or impersonate) another player's row.
  const rows = (await sql`
    SELECT
      user_id,
      (ARRAY_AGG(player_name ORDER BY created_at DESC))[1] AS player_name,
      COUNT(*)::int AS total_games,
      SUM(total_points)::int AS total_points,
      MODE() WITHIN GROUP (ORDER BY game_id) AS best_game
    FROM game_leaderboard
    GROUP BY user_id
    ORDER BY total_points DESC
    LIMIT ${safeLimit}
  `) as Array<{
    user_id: string;
    player_name: string;
    total_games: number;
    total_points: number;
    best_game: string;
  }>;
  return rows.map((r, idx) => ({
    userId: r.user_id,
    playerName: r.player_name || 'Player',
    totalGames: r.total_games,
    totalPoints: r.total_points,
    bestGame: r.best_game || 'minesweeper',
    rank: idx + 1,
  }));
}
