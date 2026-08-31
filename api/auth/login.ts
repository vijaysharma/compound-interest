import {
  DbUser,
  ensureTables,
  FREE_USAGE_LIMIT,
  getDb,
  isEmailAdmin,
  isUserBlocked,
  jsonResponse,
  verifyPassword,
} from '../_db';
export const config = { runtime: 'edge' };
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email ? body.email.toLowerCase().trim() : '';
    const password = body.password ? body.password.trim() : '';
    if (!email || !password) {
      return jsonResponse({ error: 'Email and password are required' }, 400);
    }
    const sql = getDb();
    await ensureTables(sql);
    const rows = (await sql`
      SELECT id, email, password_hash, password_salt, name, picture, provider, role, api_usage_count, COALESCE(free_limit, 15) as free_limit, subscription_status, subscription_expires_at, first_used_at, trial_expires_at, created_at, updated_at
      FROM users
      WHERE email = ${email}
    `) as DbUser[];
    if (rows.length === 0) {
      return jsonResponse(
        { error: 'No account found with this email. Please click Sign Up to register.' },
        404
      );
    }
    const user = rows[0];
    if (!user.password_hash || !user.password_salt) {
      return jsonResponse(
        {
          error:
            'No password set for this account yet. Please use the Sign Up with Google tab to set your password.',
        },
        400
      );
    }
    const isValid = await verifyPassword(password, user.password_hash, user.password_salt);
    if (!isValid) {
      return jsonResponse({ error: 'Incorrect password. Please try again.' }, 401);
    }
    if (isEmailAdmin(email) && user.role !== 'admin') {
      await sql`UPDATE users SET role = 'admin' WHERE id = ${user.id}`;
      user.role = 'admin';
    }
    const sessionToken = `${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '')}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await sql`
      INSERT INTO user_sessions (token, user_id, expires_at)
      VALUES (${sessionToken}, ${user.id}, ${expiresAt})
    `;
    const blocked = isUserBlocked(user);
    return jsonResponse({
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role,
        api_usage_count: user.api_usage_count ?? 0,
        freeLimit: user.free_limit ?? FREE_USAGE_LIMIT,
        subscription_status: user.subscription_status ?? 'free_trial',
        subscription_expires_at: user.subscription_expires_at,
        first_used_at: user.first_used_at,
        trial_expires_at: user.trial_expires_at,
        isBlocked: blocked,
      },
    });
  } catch (error) {
    return jsonResponse({ error: 'Sign in failed', detail: String(error) }, 500);
  }
}
