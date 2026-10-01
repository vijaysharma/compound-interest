'use server';
import { ensureTables, getDb, getUserFromToken } from '@/lib/db';
import { calculateGameScore, type ScoreBreakdown } from '@/views/games/common/scoring';
export interface GameScoreSubmission {
  gameId: 'minesweeper' | 'sudoku' | 'word-path' | 'slide-puzzle' | 'hitori' | 'tango';
  gameName: string;
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
export async function recordGameScoreAction(
  token: string | null | undefined,
  guestId: string | null | undefined,
  submission: GameScoreSubmission
): Promise<{
  success: boolean;
  scoreBreakdown: ScoreBreakdown;
  recordId?: string;
  isPersonalBest?: boolean;
  userRank?: number;
}> {
  const sql = getDb();
  await ensureTables(sql);
  let effectiveUserId = '';
  let effectivePlayerName = submission.playerName?.trim() || 'Player';
  if (token) {
    const user = await getUserFromToken(token, sql);
    if (user?.id) {
      effectiveUserId = `user_${user.id}`;
      effectivePlayerName = user.user_alias || user.name?.trim() || effectivePlayerName;
    }
  }
  if (!effectiveUserId && guestId) {
    effectiveUserId = `guest_${guestId.slice(0, 48)}`;
  }
  if (!effectiveUserId) {
    effectiveUserId = `anon_${crypto.randomUUID().slice(0, 16)}`;
  }
  const outcome = submission.outcome || 'won';
  const scoreBreakdown = calculateGameScore({
    gameId: submission.gameId,
    difficulty: submission.difficulty,
    timeSeconds: submission.timeSeconds,
    outcome,
    hintsUsed: submission.hintsUsed,
    moves: submission.moves,
  });
  const id = `score_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  // Check personal best for this game and difficulty
  const prevBestRows = (await sql`
    SELECT total_points, time_seconds
    FROM game_leaderboard
    WHERE user_id = ${effectiveUserId} AND game_id = ${submission.gameId} AND difficulty = ${submission.difficulty}
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
      ${submission.gameId},
      ${submission.difficulty.slice(0, 32)},
      ${submission.timeSeconds},
      ${scoreBreakdown.baseScore},
      ${scoreBreakdown.timeBonus},
      ${scoreBreakdown.difficultyMultiplier},
      ${scoreBreakdown.totalPoints},
      ${outcome},
      ${submission.accuracy ? submission.accuracy.slice(0, 16) : null},
      NOW()
    )
  `;
  // Calculate user rank for this game & difficulty
  const rankRows = (await sql`
    SELECT COUNT(*)::int AS higher_count
    FROM game_leaderboard
    WHERE game_id = ${submission.gameId}
      AND difficulty = ${submission.difficulty}
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
  const rows = (await sql`
    SELECT
      COALESCE(
        NULLIF(CASE WHEN LOWER(TRIM(player_name)) NOT IN ('player', 'guest', 'anonymous', '') THEN LOWER(TRIM(player_name)) END, ''),
        user_id
      ) AS agg_key,
      MAX(user_id) AS user_id,
      MAX(player_name) AS player_name,
      COUNT(*)::int AS total_games,
      SUM(total_points)::int AS total_points,
      MODE() WITHIN GROUP (ORDER BY game_id) AS best_game
    FROM game_leaderboard
    GROUP BY agg_key
    ORDER BY total_points DESC
    LIMIT ${safeLimit}
  `) as Array<{
    agg_key: string;
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
