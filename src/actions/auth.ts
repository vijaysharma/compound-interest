'use server';
import {
  DbUser,
  ensureTables,
  FREE_USAGE_LIMIT,
  getDb,
  hashPassword,
  isEmailAdmin,
  isUserBlocked,
  verifyPassword,
} from '@/lib/db';
import { AuthUser } from '@/types/auth';
interface GoogleTokenInfo {
  email?: string;
  name?: string;
  picture?: string;
  sub?: string;
  email_verified?: string | boolean;
  error_description?: string;
}
function mapToAuthUser(user: DbUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    role: user.role,
    api_usage_count: user.api_usage_count ?? 0,
    freeLimit: user.free_limit ?? FREE_USAGE_LIMIT,
    subscription_status: user.subscription_status ?? 'free_trial',
    subscription_expires_at: user.subscription_expires_at,
    subscription_plan: user.subscription_plan ?? 'pro_monthly',
    first_used_at: user.first_used_at,
    trial_expires_at: user.trial_expires_at,
    isBlocked: isUserBlocked(user),
  };
}
export async function signupWithGooglePasswordAction(data: {
  email: string;
  password: string;
  name?: string;
  credential?: string;
}): Promise<{ token: string; user: AuthUser }> {
  const rawEmail = typeof data.email === 'string' ? data.email.toLowerCase().trim() : '';
  const email = rawEmail.slice(0, 254);
  const password = typeof data.password === 'string' ? data.password.slice(0, 128) : '';
  const name = typeof data.name === 'string' ? data.name.trim().slice(0, 100) : '';
  const credential = typeof data.credential === 'string' ? data.credential.trim() : '';
  if (!email || !password || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Valid email address and password are required');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  let isGoogleVerified = false;
  let verifiedGoogleSub: string | null = null;
  let verifiedGooglePicture: string | null = null;
  if (credential) {
    try {
      const verifyRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
      );
      if (verifyRes.ok) {
        const info = (await verifyRes.json()) as GoogleTokenInfo;
        const verifiedFlag = info.email_verified === 'true' || info.email_verified === true;
        if (info.email && verifiedFlag && info.email.toLowerCase().trim() === email) {
          isGoogleVerified = true;
          verifiedGoogleSub = info.sub || null;
          verifiedGooglePicture = info.picture || null;
        }
      }
    } catch (err) {
      console.warn('Google credential verification error during registration:', err);
    }
  }
  const matchesAdmin = isEmailAdmin(email);
  if (matchesAdmin && !isGoogleVerified) {
    throw new Error(
      'Registration for administrator accounts must be verified through Google OAuth. Please use the Google sign-in flow.'
    );
  }
  const role = isGoogleVerified && matchesAdmin ? 'admin' : 'user';
  const sql = getDb();
  await ensureTables(sql);
  const { hash, salt } = await hashPassword(password);
  const displayName = name || email.split('@')[0];
  const picture =
    verifiedGooglePicture ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName || email)}`;
  const existingUsers = (await sql`
    SELECT id, email, password_hash, password_salt, name, picture, provider, provider_id, role, api_usage_count, free_limit, subscription_status, subscription_expires_at, subscription_plan, first_used_at, trial_expires_at, created_at, updated_at
    FROM users
    WHERE email = ${email}
  `) as DbUser[];
  let user: DbUser;
  if (existingUsers.length > 0) {
    const existing = existingUsers[0];
    const finalRole = isGoogleVerified && matchesAdmin ? 'admin' : existing.role;
    const finalProviderId = verifiedGoogleSub || existing.provider_id || null;
    const updated = (await sql`
      UPDATE users
      SET password_hash = ${hash},
          password_salt = ${salt},
          name = COALESCE(${displayName || null}, name),
          picture = COALESCE(${picture || null}, picture),
          provider_id = COALESCE(${finalProviderId}, provider_id),
          role = ${finalRole},
          updated_at = NOW()
      WHERE email = ${email}
      RETURNING id, email, password_hash, password_salt, name, picture, provider, provider_id, role, api_usage_count, free_limit, subscription_status, subscription_expires_at, subscription_plan, first_used_at, trial_expires_at, created_at, updated_at
    `) as DbUser[];
    user = updated[0];
  } else {
    const newId = crypto.randomUUID();
    const created = (await sql`
      INSERT INTO users (
        id, email, password_hash, password_salt, name, picture, provider, provider_id, role, api_usage_count, free_limit, subscription_status, first_used_at, trial_expires_at
      )
      VALUES (
        ${newId}, ${email}, ${hash}, ${salt}, ${displayName}, ${picture}, 'password', ${verifiedGoogleSub}, ${role}, 0, 15, 'free_trial', NULL, NULL
      )
      RETURNING id, email, password_hash, password_salt, name, picture, provider, provider_id, role, api_usage_count, free_limit, subscription_status, subscription_expires_at, subscription_plan, first_used_at, trial_expires_at, created_at, updated_at
    `) as DbUser[];
    user = created[0];
  }
  const sessionToken = `${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '')}`;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await sql`
    INSERT INTO user_sessions (token, user_id, expires_at)
    VALUES (${sessionToken}, ${user.id}, ${expiresAt})
  `;
  return {
    token: sessionToken,
    user: mapToAuthUser(user),
  };
}
export async function loginWithPasswordAction(data: {
  email: string;
  password: string;
}): Promise<{ token: string; user: AuthUser }> {
  const rawEmail = typeof data.email === 'string' ? data.email.toLowerCase().trim() : '';
  const email = rawEmail.slice(0, 254);
  const password = typeof data.password === 'string' ? data.password.slice(0, 128) : '';
  if (!email || !password || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Valid email and password are required');
  }
  const sql = getDb();
  await ensureTables(sql);
  const rows = (await sql`
    SELECT id, email, password_hash, password_salt, name, picture, provider, role, api_usage_count, COALESCE(free_limit, 15) as free_limit, subscription_status, subscription_expires_at, subscription_plan, first_used_at, trial_expires_at, created_at, updated_at
    FROM users
    WHERE email = ${email}
  `) as DbUser[];
  if (rows.length === 0) {
    throw new Error('No account found with this email. Please click Sign Up to register.');
  }
  const user = rows[0];
  if (!user.password_hash || !user.password_salt) {
    throw new Error(
      'No password set for this account yet. Please use the Sign Up with Google tab to set your password.'
    );
  }
  const isValid = await verifyPassword(password, user.password_hash, user.password_salt);
  if (!isValid) {
    throw new Error('Incorrect password. Please try again.');
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
  return {
    token: sessionToken,
    user: mapToAuthUser(user),
  };
}
export async function loginWithGoogleAction(authData: {
  credential?: string;
  email?: string;
  name?: string;
}): Promise<{ token: string; user: AuthUser }> {
  const credential = authData.credential?.trim();
  if (!credential) {
    throw new Error('Google credential is required');
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
      throw new Error('Google authentication failed: invalid or expired credential');
    }
    const info = (await verifyRes.json()) as GoogleTokenInfo;
    const isEmailVerified = info.email_verified === 'true' || info.email_verified === true;
    if (!info.email || !isEmailVerified) {
      throw new Error('Unverified Google email address. Verified email is required.');
    }
    email = info.email.toLowerCase().trim();
    name = info.name?.trim() || email.split('@')[0];
    picture = info.picture || '';
    sub = info.sub || '';
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error('Failed to verify token with Google OAuth service');
  }
  if (!name) name = email.split('@')[0];
  if (!picture) {
    picture = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || email)}`;
  }
  const sql = getDb();
  await ensureTables(sql);
  const isAdmin = isEmailAdmin(email);
  const existingUsers = (await sql`
    SELECT id, email, name, picture, provider, provider_id, role, api_usage_count, COALESCE(free_limit, 15) as free_limit, subscription_status, subscription_expires_at, subscription_plan, first_used_at, trial_expires_at, created_at, updated_at
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
      RETURNING id, email, name, picture, provider, provider_id, role, api_usage_count, free_limit, subscription_status, subscription_expires_at, subscription_plan, first_used_at, trial_expires_at, created_at, updated_at
    `) as DbUser[];
    user = updated[0];
  } else {
    const newId = crypto.randomUUID();
    const role = isAdmin ? 'admin' : 'user';
    const created = (await sql`
      INSERT INTO users (id, email, name, picture, provider, provider_id, role, api_usage_count, free_limit, subscription_status, first_used_at, trial_expires_at)
      VALUES (${newId}, ${email}, ${name || null}, ${picture || null}, 'google', ${sub || null}, ${role}, 0, 15, 'free_trial', NULL, NULL)
      RETURNING id, email, name, picture, provider, provider_id, role, api_usage_count, free_limit, subscription_status, subscription_expires_at, subscription_plan, first_used_at, trial_expires_at, created_at, updated_at
    `) as DbUser[];
    user = created[0];
  }
  const sessionToken = `${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '')}`;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await sql`
    INSERT INTO user_sessions (token, user_id, expires_at)
    VALUES (${sessionToken}, ${user.id}, ${expiresAt})
  `;
  return {
    token: sessionToken,
    user: mapToAuthUser(user),
  };
}
export async function getMeAction(token?: string | null): Promise<{ user: AuthUser } | null> {
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
export async function trackUsageAction(
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
export async function logoutAction(token?: string | null): Promise<void> {
  if (!token) return;
  const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
  const sql = getDb();
  await ensureTables(sql);
  await sql`DELETE FROM user_sessions WHERE token = ${cleanToken}`;
}
