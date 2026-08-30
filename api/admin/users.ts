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
        SELECT id, email, name, picture, provider, role, api_usage_count, subscription_status, subscription_expires_at, trial_expires_at, created_at, updated_at
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
        action?: 'grant_access' | 'reset_usage' | 'set_role' | 'reset_trial';
        role?: 'admin' | 'user';
      };
      const { user_id, action, role } = body;
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
      if (action === 'reset_usage' || action === 'reset_trial') {
        const trialExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await sql`
          UPDATE users
          SET api_usage_count = 0,
              trial_expires_at = ${trialExpiresAt},
              updated_at = NOW()
          WHERE id = ${user_id}
        `;
        return jsonResponse({
          success: true,
          message: 'Reset user usage count to 0 and refreshed 24h trial',
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
