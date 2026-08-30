import {
  DbUser,
  ensureTables,
  FREE_USAGE_LIMIT,
  getDb,
  hashPassword,
  isEmailAdmin,
  isUserBlocked,
  jsonResponse,
} from '../_db';
export const config = { runtime: 'edge' };
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      name?: string;
      picture?: string;
      credential?: string;
    };
    let email = body.email ? body.email.toLowerCase().trim() : '';
    let name = body.name ? body.name.trim() : '';
    let picture = body.picture || '';
    const password = body.password ? body.password.trim() : '';
    if (body.credential) {
      try {
        const parts = body.credential.split('.');
        if (parts.length === 3) {
          const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
          const payload = JSON.parse(payloadJson) as {
            email?: string;
            name?: string;
            picture?: string;
          };
          if (payload.email) {
            email = payload.email.toLowerCase().trim();
            name = payload.name || name;
            picture = payload.picture || picture;
          }
        }
      } catch {
        // invalid jwt format fallback
      }
    }
    if (!email || !email.includes('@')) {
      return jsonResponse({ error: 'A valid email address is required' }, 400);
    }
    if (!password || password.length < 6) {
      return jsonResponse(
        { error: 'Password is required and must be at least 6 characters' },
        400
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
    const existingUsers = (await sql`
      SELECT id, email, password_hash, password_salt, name, picture, provider, role, api_usage_count, subscription_status, subscription_expires_at, created_at, updated_at
      FROM users
      WHERE email = ${email}
    `) as DbUser[];
    const { hash, salt } = await hashPassword(password);
    const isAdmin = isEmailAdmin(email);
    let user: DbUser;
    if (existingUsers.length > 0) {
      const existing = existingUsers[0];
      if (existing.password_hash) {
        return jsonResponse(
          { error: 'Account already exists for this email. Please sign in with your password.' },
          409
        );
      }
      const targetRole = isAdmin ? 'admin' : existing.role;
      const updated = (await sql`
        UPDATE users
        SET password_hash = ${hash},
            password_salt = ${salt},
            name = COALESCE(${name || null}, name),
            picture = COALESCE(${picture || null}, picture),
            role = ${targetRole},
            updated_at = NOW()
        WHERE email = ${email}
        RETURNING id, email, name, picture, provider, role, api_usage_count, subscription_status, subscription_expires_at, created_at, updated_at
      `) as DbUser[];
      user = updated[0];
    } else {
      const newId = crypto.randomUUID();
      const role = isAdmin ? 'admin' : 'user';
      const created = (await sql`
        INSERT INTO users (
          id, email, password_hash, password_salt, name, picture, provider, role, api_usage_count, subscription_status
        )
        VALUES (
          ${newId}, ${email}, ${hash}, ${salt}, ${name}, ${picture}, 'google', ${role}, 0, 'free_trial'
        )
        RETURNING id, email, name, picture, provider, role, api_usage_count, subscription_status, subscription_expires_at, created_at, updated_at
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
        isBlocked: blocked,
        freeLimit: FREE_USAGE_LIMIT,
      },
    });
  } catch (error) {
    return jsonResponse({ error: 'Registration failed', detail: String(error) }, 500);
  }
}
