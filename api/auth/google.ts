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
    const body = (await request.json()) as {
      credential?: string;
      email?: string;
      name?: string;
      picture?: string;
    };
    let email = body.email ? body.email.toLowerCase().trim() : '';
    let name = body.name || '';
    let picture = body.picture || '';
    let sub = '';
    if (body.credential) {
      // Verify credential with Google OAuth tokeninfo endpoint
      try {
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(body.credential)}`
        );
        if (verifyRes.ok) {
          const info = (await verifyRes.json()) as GoogleTokenInfo;
          if (info.email && (info.email_verified === 'true' || info.email_verified === true)) {
            email = info.email.toLowerCase();
            name = info.name || name;
            picture = info.picture || picture;
            sub = info.sub || sub;
          }
        }
      } catch (err) {
        console.warn('Google tokeninfo fetch error:', err);
      }
      // Fallback for JWT payload parsing if tokeninfo is unreachable or client token
      if (!email) {
        try {
          const parts = body.credential.split('.');
          if (parts.length === 3) {
            const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
            const payload = JSON.parse(payloadJson) as GoogleTokenInfo;
            if (payload.email) {
              email = payload.email.toLowerCase();
              name = payload.name || name;
              picture = payload.picture || picture;
              sub = payload.sub || sub;
            }
          }
        } catch {
          // invalid jwt format
        }
      }
    }
    if (!email || !email.includes('@')) {
      return jsonResponse({ error: 'Valid Google email account is required' }, 400);
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
    const trialExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const existingUsers = (await sql`
      SELECT id, email, name, picture, provider, provider_id, role, api_usage_count, subscription_status, subscription_expires_at, trial_expires_at, created_at, updated_at
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
            trial_expires_at = COALESCE(trial_expires_at, ${trialExpiresAt}),
            updated_at = NOW()
        WHERE email = ${email}
        RETURNING id, email, name, picture, provider, provider_id, role, api_usage_count, subscription_status, subscription_expires_at, trial_expires_at, created_at, updated_at
      `) as DbUser[];
      user = updated[0];
    } else {
      const newId = crypto.randomUUID();
      const role = isAdmin ? 'admin' : 'user';
      const created = (await sql`
        INSERT INTO users (id, email, name, picture, provider, provider_id, role, api_usage_count, subscription_status, trial_expires_at)
        VALUES (${newId}, ${email}, ${name || null}, ${picture || null}, 'google', ${sub || null}, ${role}, 0, 'free_trial', ${trialExpiresAt})
        RETURNING id, email, name, picture, provider, provider_id, role, api_usage_count, subscription_status, subscription_expires_at, trial_expires_at, created_at, updated_at
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
        subscription_status: user.subscription_status ?? 'free_trial',
        subscription_expires_at: user.subscription_expires_at,
        trial_expires_at: user.trial_expires_at,
        isBlocked: blocked,
        freeLimit: FREE_USAGE_LIMIT,
      },
    });
  } catch (error) {
    return jsonResponse({ error: 'Authentication failed', detail: String(error) }, 500);
  }
}
