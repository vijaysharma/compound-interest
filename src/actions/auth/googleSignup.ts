import { DbUser, ensureTables, getDb, hashPassword, isEmailAdmin } from '@/lib/db';
import { AuthUser } from '@/types/auth';
import { createSession, mapToAuthUser, verifyGoogleToken } from './authHelpers';
export async function handleSignupWithGooglePassword(data: {
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
    const info = await verifyGoogleToken(credential);
    if (info) {
      const verifiedFlag = info.email_verified === 'true' || info.email_verified === true;
      if (info.email && verifiedFlag && info.email.toLowerCase().trim() === email) {
        isGoogleVerified = true;
        verifiedGoogleSub = info.sub || null;
        verifiedGooglePicture = info.picture || null;
      }
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
  const sessionToken = await createSession(sql, user.id);
  return {
    token: sessionToken,
    user: mapToAuthUser(user),
  };
}
