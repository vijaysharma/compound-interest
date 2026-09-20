import { DbUser, FREE_USAGE_LIMIT, Query } from './types';
import { timingSafeEqual } from './cryptoUtils';
export function isEmailAdmin(email: string): boolean {
  const adminEmails = (
    process.env.ADMIN_EMAILS ||
    process.env.NEXT_PUBLIC_ALLOWED_EMAIL ||
    process.env.VITE_ALLOWED_EMAIL ||
    ''
  )
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}
export function isUserBlocked(user: DbUser, checkApiQuota = false): boolean {
  if (user.role === 'admin') return false;
  if (user.subscription_status === 'active') {
    if (!user.subscription_expires_at) return false;
    const expiry = new Date(user.subscription_expires_at).getTime();
    if (expiry > Date.now()) return false;
    return true;
  }
  if (!checkApiQuota) {
    return false;
  }
  if (user.trial_expires_at) {
    const trialExpiry = new Date(user.trial_expires_at).getTime();
    if (Date.now() > trialExpiry) {
      return true;
    }
  }
  const limit = user.free_limit ?? FREE_USAGE_LIMIT;
  if ((user.api_usage_count ?? 0) >= limit) {
    return true;
  }
  return false;
}
export function isPaidUser(user: DbUser): boolean {
  if (user.role === 'admin') return true;
  if (user.subscription_status === 'active') {
    if (!user.subscription_expires_at) return true;
    const expiry = new Date(user.subscription_expires_at).getTime();
    return expiry > Date.now();
  }
  return false;
}
export async function getUserFromToken(token: string | null | undefined, sql: Query): Promise<DbUser | null> {
  const cleanToken = token?.replace(/^Bearer\s+/i, '').trim();
  if (!cleanToken) return null;
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
  return rows.length > 0 ? rows[0] : null;
}
export async function isAuthorizedUser(token: string | null | undefined, sql?: Query): Promise<boolean> {
  const cleanToken = token?.replace(/^Bearer\s+/i, '').trim();
  const expectedAdminToken = process.env.ADMIN_SYNC_TOKEN;
  if (cleanToken && expectedAdminToken && timingSafeEqual(cleanToken, expectedAdminToken)) {
    return true;
  }
  if (sql && cleanToken) {
    const user = await getUserFromToken(cleanToken, sql);
    if (user && user.role === 'admin') return true;
  }
  return false;
}
