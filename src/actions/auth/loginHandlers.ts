import {
  DbUser,
  ensureTables,
  getDb,
  isEmailAdmin,
  verifyPassword,
} from '@/lib/db';
import { AuthUser } from '@/types/auth';
import { createSession, mapToAuthUser, verifyGoogleToken } from './authHelpers';
export async function handleLoginWithPassword(data: {
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
  const sessionToken = await createSession(sql, user.id);
  return {
    token: sessionToken,
    user: mapToAuthUser(user),
  };
}
export async function handleLoginWithGoogle(authData: {
  credential?: string;
  email?: string;
  name?: string;
}): Promise<{ token: string; user: AuthUser }> {
  const credential = authData.credential?.trim();
  if (!credential) {
    throw new Error('Google credential is required');
  }
  const info = await verifyGoogleToken(credential);
  if (!info) {
    throw new Error('Failed to verify token with Google OAuth service');
  }
  const isEmailVerified = info.email_verified === 'true' || info.email_verified === true;
  if (!info.email || !isEmailVerified) {
    throw new Error('Unverified Google email address. Verified email is required.');
  }
  const email = info.email.toLowerCase().trim();
  const name = info.name?.trim() || email.split('@')[0];
  const picture = info.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || email)}`;
  const sub = info.sub || '';
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
  const sessionToken = await createSession(sql, user.id);
  return {
    token: sessionToken,
    user: mapToAuthUser(user),
  };
}
