'use server';
import { ensureTables, getDb, isAuthorizedUser, type DbUser } from '@/lib/db';
export async function getAdminUsersAction(token?: string | null): Promise<{ users: DbUser[] }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  const users = (await sql`
    SELECT id, email, name, picture, provider, role, api_usage_count,
           COALESCE(free_limit, 15) as free_limit, subscription_status,
           subscription_expires_at, first_used_at, trial_expires_at, created_at, updated_at
    FROM users
    ORDER BY created_at DESC
    LIMIT 200
  `) as DbUser[];
  return { users };
}
export async function updateAdminUserAction(
  body: {
    user_id?: string;
    action?:
      | 'grant_access'
      | 'reset_usage'
      | 'set_role'
      | 'reset_trial'
      | 'set_limit'
      | 'extend_trial_time';
    role?: 'admin' | 'user';
    free_limit?: number;
    hours?: number;
  },
  token?: string | null
): Promise<{ success: boolean; message: string }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  const { user_id, action, role, free_limit, hours } = body;
  if (!user_id || !action) {
    throw new Error('user_id and action are required');
  }
  if (action === 'grant_access') {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await sql`
      UPDATE users
      SET subscription_status = 'active',
          subscription_expires_at = ${expiresAt},
          api_usage_count = 0,
          updated_at = NOW()
      WHERE id = ${user_id}
    `;
    return { success: true, message: 'Granted 30-day Pro access to user' };
  }
  if (action === 'reset_trial' || action === 'reset_usage') {
    await sql`
      UPDATE users
      SET api_usage_count = 0,
          first_used_at = NULL,
          trial_expires_at = NULL,
          subscription_status = 'free_trial',
          updated_at = NOW()
      WHERE id = ${user_id}
    `;
    return {
      success: true,
      message: 'Reset user trial: usage set to 0 and 48h countdown will start upon next usage',
    };
  }
  if (action === 'set_limit') {
    const targetLimit = Number(free_limit);
    if (isNaN(targetLimit) || targetLimit < 1) {
      throw new Error('Valid free_limit number is required');
    }
    await sql`
      UPDATE users
      SET free_limit = ${targetLimit},
          updated_at = NOW()
      WHERE id = ${user_id}
    `;
    return {
      success: true,
      message: `Updated user calculation quota limit to ${targetLimit}`,
    };
  }
  if (action === 'extend_trial_time') {
    const addHours = Number(hours) || 48;
    const newExpiry = new Date(Date.now() + addHours * 60 * 60 * 1000).toISOString();
    await sql`
      UPDATE users
      SET trial_expires_at = ${newExpiry},
          updated_at = NOW()
      WHERE id = ${user_id}
    `;
    return {
      success: true,
      message: `Extended user trial by ${addHours} hours (expires ${new Date(newExpiry).toLocaleString()})`,
    };
  }
  if (action === 'set_role' && role) {
    await sql`
      UPDATE users
      SET role = ${role},
          updated_at = NOW()
      WHERE id = ${user_id}
    `;
    return { success: true, message: `Updated user role to ${role}` };
  }
  throw new Error('Unknown action');
}
