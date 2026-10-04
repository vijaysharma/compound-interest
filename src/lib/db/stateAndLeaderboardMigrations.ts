import type { Query } from './types';
export async function applyStateAndLeaderboardMigrations(sql: Query): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS user_app_state (
      user_id VARCHAR(64) NOT NULL,
      namespace VARCHAR(32) NOT NULL,
      state_key VARCHAR(64) NOT NULL,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, namespace, state_key)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS user_app_state_lookup_idx ON user_app_state (user_id, namespace)`;
  await sql`
    CREATE TABLE IF NOT EXISTS game_leaderboard (
      id TEXT PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      player_name VARCHAR(64) NOT NULL,
      game_id VARCHAR(32) NOT NULL,
      difficulty VARCHAR(32) NOT NULL,
      time_seconds INT NOT NULL,
      base_score INT NOT NULL DEFAULT 0,
      time_bonus INT NOT NULL DEFAULT 0,
      difficulty_multiplier NUMERIC NOT NULL DEFAULT 1.0,
      total_points INT NOT NULL DEFAULT 0,
      outcome VARCHAR(16) NOT NULL DEFAULT 'won',
      accuracy VARCHAR(16),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS game_leaderboard_game_points_idx ON game_leaderboard (game_id, total_points DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS game_leaderboard_user_points_idx ON game_leaderboard (user_id, total_points DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS game_leaderboard_global_points_idx ON game_leaderboard (total_points DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS game_leaderboard_pb_idx ON game_leaderboard (user_id, game_id, difficulty, total_points DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS game_leaderboard_user_recent_idx ON game_leaderboard (user_id, created_at DESC)`;
  // One row per game the server has seen start. A score is only accepted against an unconsumed
  // session owned by the submitter, so the server knows the real elapsed time and a result can't
  // be replayed or fabricated without a session.
  await sql`
    CREATE TABLE IF NOT EXISTS game_sessions (
      id TEXT PRIMARY KEY,
      owner_id VARCHAR(64) NOT NULL,
      game_id VARCHAR(32) NOT NULL,
      ip_hash VARCHAR(64),
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      consumed_at TIMESTAMPTZ
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS game_sessions_started_idx ON game_sessions (started_at)`;
}
