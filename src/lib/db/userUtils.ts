import { FREE_USAGE_LIMIT, type DbUser, type Query } from './types';
import { timingSafeEqual } from './cryptoUtils';
export function isEmailAdmin(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS || '')
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
  let cleanToken = token?.replace(/^Bearer\s+/i, '').trim();
  if (!cleanToken) {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      cleanToken = cookieStore.get('auth_token')?.value;
    } catch {
      // Cookies not available (e.g. non-request context or unit tests)
    }
  }
  if (!cleanToken) return null;
  const rows = (await sql`
    SELECT
      u.id, u.email, u.password_hash, u.password_salt, u.name, u.picture,
      u.provider, u.provider_id, u.role, u.api_usage_count,
      COALESCE(u.free_limit, 15) AS free_limit,
      u.subscription_status, u.subscription_expires_at, u.subscription_plan,
      u.first_used_at, u.trial_expires_at, u.created_at, u.updated_at,
      u.user_alias
    FROM user_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${cleanToken} AND s.expires_at > NOW()
  `) as DbUser[];
  return rows.length > 0 ? rows[0] : null;
}
/**
 * Robust admin authorization with multiple credential types
 * - Supports Bearer tokens with ADMIN_SYNC_TOKEN (manual admin)
 * - Supports Bearer tokens with CRON_SECRET (automated jobs)
 * - Supports session tokens with admin role (existing admin users)
 * - Supports email-based admin checking via DB lookup
 */
export async function isAuthorizedUser(
  token?: string | null | undefined,
  sql?: Query
): Promise<boolean> {
  let cleanToken = token?.replace(/^Bearer\s+/i, '').trim();
  if (!cleanToken) {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      cleanToken = cookieStore.get('auth_token')?.value;
    } catch {
      // Cookies not available (e.g. non-request context or unit tests)
    }
  }
  if (!cleanToken) return false;
  // CRITICAL: Priority 1 - CRON_SECRET for automated jobs
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && timingSafeEqual(cleanToken, cronSecret.trim())) {
    return true; // Cron job authenticated
  }
  // CRITICAL: Priority 2 - ADMIN_SYNC_TOKEN for manual admin override
  const adminSyncToken = process.env.ADMIN_SYNC_TOKEN;
  if (adminSyncToken && timingSafeEqual(cleanToken, adminSyncToken.trim())) {
    return true; // Admin override authenticated
  }
  // CRITICAL: Priority 3 - Valid session token with admin role
  if (sql) {
    const user = await getUserFromToken(cleanToken, sql);
    if (user) {
      if (user.role === 'admin') return true;
      if (isEmailAdmin(user.email)) return true;
    }
  }
  return false;
}
