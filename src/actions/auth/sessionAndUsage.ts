import {
  DbUser,
  ensureTables,
  FREE_USAGE_LIMIT,
  getDb,
  isUserBlocked,
} from '@/lib/db';
import { AuthUser } from '@/types/auth';
import { mapToAuthUser } from './authHelpers';
export async function handleGetMe(token?: string | null): Promise<{ user: AuthUser } | null> {
  if (!token) return null;
  const sql = getDb();
  await ensureTables(sql);
  const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
  const rows = (await sql`
    SELECT
      u.id, u.email, u.password_hash, u.password_salt, u.name, u.picture,
      u.provider, u.provider_id, u.role, u.api_usage_count,
      COALESCE(u.free_limit, 15) AS free_limit,
      u.subscription_status, u.subscription_expires_at, u.subscription_plan,
      u.first_used_at, u.trial_expires_at, u.created_at, u.updated_at
    FROM user_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${cleanToken} AND s.expires_at > NOW()
  `) as DbUser[];
  if (rows.length === 0) return null;
  return { user: mapToAuthUser(rows[0]) };
}
export async function handleTrackUsage(
  token: string | null | undefined,
  type: 'init' | 'api' = 'api'
): Promise<{
  success: boolean;
  isBlocked: boolean;
  api_usage_count?: number;
  freeLimit?: number;
  first_used_at?: string | null;
  trial_expires_at?: string | null;
}> {
  if (!token) return { success: false, isBlocked: false };
  const sql = getDb();
  await ensureTables(sql);
  const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
  const rows = (await sql`
    SELECT
      u.id, u.email, u.role, u.api_usage_count,
      COALESCE(u.free_limit, 15) AS free_limit,
      u.subscription_status, u.subscription_expires_at,
      u.first_used_at, u.trial_expires_at
    FROM user_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${cleanToken} AND s.expires_at > NOW()
  `) as DbUser[];
  if (rows.length === 0) return { success: false, isBlocked: false };
  const user = rows[0];
  if (user.role === 'admin') {
    return {
      success: true,
      isBlocked: false,
      api_usage_count: user.api_usage_count,
      freeLimit: user.free_limit,
      first_used_at: user.first_used_at,
      trial_expires_at: user.trial_expires_at,
    };
  }
  let firstUsedAt = user.first_used_at;
  let trialExpiresAt = user.trial_expires_at;
  if (!firstUsedAt) {
    firstUsedAt = new Date().toISOString();
    trialExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    await sql`
      UPDATE users
      SET first_used_at = ${firstUsedAt},
          trial_expires_at = ${trialExpiresAt},
          updated_at = NOW()
      WHERE id = ${user.id}
    `;
    user.first_used_at = firstUsedAt;
    user.trial_expires_at = trialExpiresAt;
  }
  if (type === 'init') {
    return {
      success: true,
      isBlocked: isUserBlocked(user, true),
      api_usage_count: user.api_usage_count,
      freeLimit: user.free_limit ?? FREE_USAGE_LIMIT,
      first_used_at: firstUsedAt,
      trial_expires_at: trialExpiresAt,
    };
  }
  const updatedRows = (await sql`
    UPDATE users
    SET api_usage_count = api_usage_count + 1,
        updated_at = NOW()
    WHERE id = ${user.id}
    RETURNING api_usage_count, COALESCE(free_limit, 15) AS free_limit, subscription_status, subscription_expires_at, first_used_at, trial_expires_at, role
  `) as DbUser[];
  const updated = updatedRows[0];
  const blocked = isUserBlocked(updated, true);
  return {
    success: true,
    isBlocked: blocked,
    api_usage_count: updated.api_usage_count,
    freeLimit: updated.free_limit ?? FREE_USAGE_LIMIT,
    first_used_at: updated.first_used_at,
    trial_expires_at: updated.trial_expires_at,
  };
}
export async function handleLogout(token?: string | null): Promise<void> {
  if (!token) return;
  const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
  const sql = getDb();
  await ensureTables(sql);
  await sql`DELETE FROM user_sessions WHERE token = ${cleanToken}`;
}
