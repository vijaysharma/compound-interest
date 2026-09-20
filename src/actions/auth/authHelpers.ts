import { DbUser, FREE_USAGE_LIMIT, isUserBlocked, getDb } from '@/lib/db';
import { AuthUser } from '@/types/auth';
export interface GoogleTokenInfo {
  email?: string;
  name?: string;
  picture?: string;
  sub?: string;
  email_verified?: string | boolean;
  error_description?: string;
}
export function mapToAuthUser(user: DbUser): AuthUser {
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
export async function verifyGoogleToken(credential: string): Promise<GoogleTokenInfo | null> {
  try {
    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (verifyRes.ok) {
      return (await verifyRes.json()) as GoogleTokenInfo;
    }
  } catch (err) {
    console.warn('Google credential verification error:', err);
  }
  return null;
}
export async function createSession(sql: ReturnType<typeof getDb>, userId: string): Promise<string> {
  const sessionToken = `${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '')}`;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await sql`
    INSERT INTO user_sessions (token, user_id, expires_at)
    VALUES (${sessionToken}, ${userId}, ${expiresAt})
  `;
  return sessionToken;
}
