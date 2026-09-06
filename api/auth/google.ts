import {
  DbUser,
  ensureTables,
  FREE_USAGE_LIMIT,
  getDb,
  isEmailAdmin,
  isUserBlocked,
  jsonResponse,
} from '../_db';
export const config = { runtime: 'edge' };
interface GoogleTokenInfo {
  email?: string;
  name?: string;
  picture?: string;
  sub?: string;
  email_verified?: string | boolean;
  error_description?: string;
}
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }
  try {
    const body = (await request.json().catch(() => ({}))) as {
      credential?: string;
    };
    const credential = body.credential?.trim();
    if (!credential) {
      return jsonResponse({ error: 'Google credential is required' }, 400);
    }
    let email = '';
    let name = '';
    let picture = '';
    let sub = '';
    try {
      const verifyRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
      );
      if (!verifyRes.ok) {
        return jsonResponse(
          { error: 'Google authentication failed: invalid or expired credential' },
          401
        );
      }
      const info = (await verifyRes.json()) as GoogleTokenInfo;
      const isEmailVerified = info.email_verified === 'true' || info.email_verified === true;
      if (!info.email || !isEmailVerified) {
        return jsonResponse(
          { error: 'Unverified Google email address. Verified email is required.' },
          401
        );
      }
      email = info.email.toLowerCase().trim();
      name = info.name?.trim() || email.split('@')[0];
      picture = info.picture || '';
      sub = info.sub || '';
    } catch (err) {
      return jsonResponse(
        { error: 'Failed to verify token with Google OAuth service', detail: String(err) },
        502
      );
    }
    if (!name) {
      name = email.split('@')[0];
    }
    if (!picture) {
      picture = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || email)}`;
    }
    const sql = getDb();
    await ensureTables(sql);
    const isAdmin = isEmailAdmin(email);
    const existingUsers = (await sql`
      SELECT id, email, name, picture, provider, provider_id, role, api_usage_count, COALESCE(free_limit, 15) as free_limit, subscription_status, subscription_expires_at, first_used_at, trial_expires_at, created_at, updated_at
      FROM users
      WHERE email = ${email}
    `) as DbUser[];
    let user: DbUser;
    if (existingUsers.length > 0) {
      const existing = existingUsers[0];
      const targetRole = isAdmin ? 'admin' : existing.role;
      const updated = (await sql`
        UPDATE users
        SET name = COALESCE(${name || null}, name),
            picture = COALESCE(${picture || null}, picture),
            provider_id = COALESCE(${sub || null}, provider_id),
            role = ${targetRole},
            free_limit = COALESCE(free_limit, 15),
            updated_at = NOW()
        WHERE email = ${email}
        RETURNING id, email, name, picture, provider, provider_id, role, api_usage_count, free_limit, subscription_status, subscription_expires_at, first_used_at, trial_expires_at, created_at, updated_at
      `) as DbUser[];
      user = updated[0];
    } else {
      const newId = crypto.randomUUID();
      const role = isAdmin ? 'admin' : 'user';
      const created = (await sql`
        INSERT INTO users (id, email, name, picture, provider, provider_id, role, api_usage_count, free_limit, subscription_status, first_used_at, trial_expires_at)
        VALUES (${newId}, ${email}, ${name || null}, ${picture || null}, 'google', ${sub || null}, ${role}, 0, 15, 'free_trial', NULL, NULL)
        RETURNING id, email, name, picture, provider, provider_id, role, api_usage_count, free_limit, subscription_status, subscription_expires_at, first_used_at, trial_expires_at, created_at, updated_at
      `) as DbUser[];
      user = created[0];
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
    return jsonResponse({ error: 'Authentication failed', detail: String(error) }, 500);
  }
}
