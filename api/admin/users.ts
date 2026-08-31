import { DbUser, ensureTables, getDb, isAuthorized, jsonResponse, unauthorized } from '../_db';
export const config = { runtime: 'edge' };
export default async function handler(request: Request): Promise<Response> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorized(request, sql))) {
    return unauthorized();
  }
  if (request.method === 'GET') {
    try {
      const users = (await sql`
        SELECT id, email, name, picture, provider, role, api_usage_count, COALESCE(free_limit, 15) as free_limit, subscription_status, subscription_expires_at, first_used_at, trial_expires_at, created_at, updated_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 200
      `) as DbUser[];
      return jsonResponse({ users });
    } catch (error) {
      return jsonResponse({ error: 'Failed to fetch users', detail: String(error) }, 500);
    }
  }
  if (request.method === 'POST') {
    try {
      const body = (await request.json()) as {
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
      };
      const { user_id, action, role, free_limit, hours } = body;
      if (!user_id || !action) {
        return jsonResponse({ error: 'user_id and action are required' }, 400);
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
        return jsonResponse({ success: true, message: 'Granted 30-day Pro access to user' });
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
        return jsonResponse({
          success: true,
          message: 'Reset user trial: usage set to 0 and 48h countdown will start upon next usage',
        });
      }
      if (action === 'set_limit') {
        const targetLimit = Number(free_limit);
        if (isNaN(targetLimit) || targetLimit < 1) {
          return jsonResponse({ error: 'Valid free_limit number is required' }, 400);
        }
        await sql`
          UPDATE users
          SET free_limit = ${targetLimit},
              updated_at = NOW()
          WHERE id = ${user_id}
        `;
        return jsonResponse({
          success: true,
          message: `Updated user calculation quota limit to ${targetLimit}`,
        });
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
        return jsonResponse({
          success: true,
          message: `Extended user trial by ${addHours} hours (expires ${new Date(newExpiry).toLocaleString()})`,
        });
      }
      if (action === 'set_role' && role) {
        await sql`
          UPDATE users
          SET role = ${role},
              updated_at = NOW()
          WHERE id = ${user_id}
        `;
        return jsonResponse({ success: true, message: `Updated user role to ${role}` });
      }
      return jsonResponse({ error: 'Unknown action' }, 400);
    } catch (error) {
      return jsonResponse({ error: 'Failed to update user', detail: String(error) }, 500);
    }
  }
  return jsonResponse({ error: 'Method not allowed' }, 405);
}
