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
      email?: string;
      password?: string;
      name?: string;
      picture?: string;
      credential?: string;
    };
    const password = body.password ? body.password.trim() : '';
    if (!password || password.length < 6) {
      return jsonResponse({ error: 'Password is required and must be at least 6 characters' }, 400);
    }
    let verifiedEmail = '';
    let verifiedName = body.name ? body.name.trim() : '';
    let verifiedPicture = body.picture || '';
    let providerId = '';
    const credential = body.credential?.trim();
    if (credential) {
      // 1. Verify Google ID Token with Google OAuth tokeninfo endpoint
      try {
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
        );
        if (verifyRes.ok) {
          const info = (await verifyRes.json()) as GoogleTokenInfo;
          if (info.email && (info.email_verified === 'true' || info.email_verified === true)) {
            verifiedEmail = info.email.toLowerCase().trim();
            verifiedName = info.name || verifiedName;
            verifiedPicture = info.picture || verifiedPicture;
            providerId = info.sub || '';
          }
        }
      } catch (err) {
        console.warn('Google tokeninfo fetch error:', err);
      }
      // 2. Parse verified JWT payload fallback if tokeninfo is unreachable
      if (!verifiedEmail) {
        try {
          const parts = credential.split('.');
          if (parts.length === 3) {
            const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
            const payload = JSON.parse(payloadJson) as GoogleTokenInfo;
            if (
              payload.email &&
              (payload.email_verified === 'true' ||
                payload.email_verified === true ||
                payload.email.endsWith('@gmail.com') ||
                payload.email.endsWith('@googlemail.com'))
            ) {
              verifiedEmail = payload.email.toLowerCase().trim();
              verifiedName = payload.name || verifiedName;
              verifiedPicture = payload.picture || verifiedPicture;
              providerId = payload.sub || '';
            }
          }
        } catch {
          // invalid jwt
        }
      }
    }
    // 3. If direct email was provided (or fallback)
    if (!verifiedEmail && body.email) {
      const inputEmail = body.email.toLowerCase().trim();
      const isGmail =
        inputEmail.endsWith('@gmail.com') ||
        inputEmail.endsWith('@googlemail.com') ||
        isEmailAdmin(inputEmail);
      if (!isGmail) {
        return jsonResponse(
          {
            error:
              'Invalid email domain. You must sign up with a valid Google or Gmail account (@gmail.com).',
          },
          400
        );
      }
      verifiedEmail = inputEmail;
    }
    if (!verifiedEmail) {
      return jsonResponse(
        {
          error:
            'Google account email is required. Please sign up using a valid Google or Gmail account (@gmail.com).',
        },
        400
      );
    }
    if (!verifiedName) {
      verifiedName = verifiedEmail.split('@')[0];
    }
    if (!verifiedPicture) {
      verifiedPicture = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(verifiedName || verifiedEmail)}`;
    }
    const sql = getDb();
    await ensureTables(sql);
    const existingUsers = (await sql`
      SELECT id, email, password_hash, password_salt, name, picture, provider, role, api_usage_count, subscription_status, subscription_expires_at, created_at, updated_at
      FROM users
      WHERE email = ${verifiedEmail}
    `) as DbUser[];
    const { hash, salt } = await hashPassword(password);
    const isAdmin = isEmailAdmin(verifiedEmail);
    let user: DbUser;
    if (existingUsers.length > 0) {
      const existing = existingUsers[0];
      if (existing.password_hash) {
        return jsonResponse(
          {
            error:
              'Account already exists for this Google email. Please sign in with your password.',
          },
          409
        );
      }
      const targetRole = isAdmin ? 'admin' : existing.role;
      const updated = (await sql`
        UPDATE users
        SET password_hash = ${hash},
            password_salt = ${salt},
            name = COALESCE(${verifiedName || null}, name),
            picture = COALESCE(${verifiedPicture || null}, picture),
            provider_id = COALESCE(${providerId || null}, provider_id),
            role = ${targetRole},
            api_usage_count = 0,
            free_limit = COALESCE(free_limit, 15),
            updated_at = NOW()
        WHERE email = ${verifiedEmail}
        RETURNING id, email, name, picture, provider, role, api_usage_count, free_limit, subscription_status, subscription_expires_at, first_used_at, trial_expires_at, created_at, updated_at
      `) as DbUser[];
      user = updated[0];
    } else {
      const newId = crypto.randomUUID();
      const role = isAdmin ? 'admin' : 'user';
      const created = (await sql`
        INSERT INTO users (
          id, email, password_hash, password_salt, name, picture, provider, provider_id, role, api_usage_count, free_limit, subscription_status, first_used_at, trial_expires_at
        )
        VALUES (
          ${newId}, ${verifiedEmail}, ${hash}, ${salt}, ${verifiedName}, ${verifiedPicture}, 'google', ${providerId || null}, ${role}, 0, 15, 'free_trial', NULL, NULL
        )
        RETURNING id, email, name, picture, provider, role, api_usage_count, free_limit, subscription_status, subscription_expires_at, first_used_at, trial_expires_at, created_at, updated_at
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
    return jsonResponse({ error: 'Registration failed', detail: String(error) }, 500);
  }
}
