'use server';
import { ensureTables, getDb } from '@/lib/db';
import type { DbShiprocketAccount } from '@/lib/db/types';
import { redisDel } from '@/lib/redis';
let cachedShiprocketToken: { token: string; expiresAt: number; accountId?: string } | null = null;
let cachedShiprocketUser: Record<string, unknown> | null = null;
export async function invalidateShiprocketAuthCache(): Promise<void> {
  cachedShiprocketToken = null;
  cachedShiprocketUser = null;
}
export async function getShiprocketAuth(
  forceRefresh = false
): Promise<{
  token: string;
  user: Record<string, unknown> | null;
  profile?: DbShiprocketAccount | null;
}> {
  let activeDbAccount: DbShiprocketAccount | null = null;
  try {
    const sql = getDb();
    await ensureTables(sql);
    const dbAccounts = (await sql`
      SELECT
        id, account_label, company_name, contact_name, contact_phone, contact_email,
        api_email, api_password, auth_token, token_expires_at, sr_user_id, sr_company_id,
        sr_first_name, sr_last_name, is_active, created_at, updated_at
      FROM shiprocket_accounts
      WHERE is_active = true
      LIMIT 1
    `) as DbShiprocketAccount[];
    if (dbAccounts.length > 0) {
      activeDbAccount = dbAccounts[0];
    } else {
      // Fallback: pick any account if none marked is_active
      const anyAccounts = (await sql`
        SELECT
          id, account_label, company_name, contact_name, contact_phone, contact_email,
          api_email, api_password, auth_token, token_expires_at, sr_user_id, sr_company_id,
          sr_first_name, sr_last_name, is_active, created_at, updated_at
        FROM shiprocket_accounts
        ORDER BY updated_at DESC
        LIMIT 1
      `) as DbShiprocketAccount[];
      if (anyAccounts.length > 0) {
        activeDbAccount = anyAccounts[0];
      }
    }
  } catch (err) {
    console.warn('Could not read shiprocket_accounts from DB:', err);
  }
  // Require active DB account
  if (!activeDbAccount) {
    throw new Error(
      'No active Shiprocket account found in database. Please configure an account in Accounts Manager.'
    );
  }
    const now = Date.now();
    const dbExpiry = activeDbAccount.token_expires_at
      ? new Date(activeDbAccount.token_expires_at).getTime()
      : 0;
    // Use cached in-memory if valid and matches active account
    if (
      !forceRefresh &&
      cachedShiprocketToken &&
      cachedShiprocketToken.accountId === activeDbAccount.id &&
      cachedShiprocketToken.expiresAt > now
    ) {
      return {
        token: cachedShiprocketToken.token,
        user: cachedShiprocketUser,
        profile: activeDbAccount,
      };
    }
    // Use DB stored token if unexpired
    if (!forceRefresh && activeDbAccount.auth_token && dbExpiry > now + 3600 * 1000) {
      const userObj = {
        id: activeDbAccount.sr_user_id,
        company_id: activeDbAccount.sr_company_id,
        first_name: activeDbAccount.sr_first_name,
        last_name: activeDbAccount.sr_last_name,
        email: activeDbAccount.api_email,
      };
      cachedShiprocketToken = {
        token: activeDbAccount.auth_token,
        expiresAt: dbExpiry,
        accountId: activeDbAccount.id,
      };
      cachedShiprocketUser = userObj;
      return {
        token: activeDbAccount.auth_token,
        user: userObj,
        profile: activeDbAccount,
      };
    }
    // Otherwise refresh token with Shiprocket login endpoint
    const password = (activeDbAccount.api_password || '').replace(/\\(\$)/g, '$1');
    if (!activeDbAccount.api_email || !password) {
      if (activeDbAccount.auth_token) {
        return {
          token: activeDbAccount.auth_token,
          user: cachedShiprocketUser,
          profile: activeDbAccount,
        };
      }
      throw new Error(`Shiprocket account '${activeDbAccount.account_label}' has no credentials configured.`);
    }
    const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: activeDbAccount.api_email, password }),
    });
    const authData = (await authRes.json()) as {
      token?: string;
      id?: number;
      company_id?: number;
      first_name?: string;
      last_name?: string;
      message?: string;
      [key: string]: unknown;
    };
    if (!authRes.ok || !authData.token) {
      const errorMsg = authData?.message || `HTTP ${authRes.status}`;
      console.error('Shiprocket authentication failed for DB account:', authRes.status, authData);
      throw new Error(`Shiprocket authentication failed: ${errorMsg}`);
    }
    const newExpiresAt = new Date(now + 8 * 24 * 60 * 60 * 1000);
    const { token: _t, ...restUser } = authData;
    try {
      const sql = getDb();
      await sql`
        UPDATE shiprocket_accounts
        SET
          auth_token = ${authData.token},
          token_expires_at = ${newExpiresAt.toISOString()},
          sr_user_id = ${authData.id ?? null},
          sr_company_id = ${authData.company_id ?? null},
          sr_first_name = ${authData.first_name ?? null},
          sr_last_name = ${authData.last_name ?? null},
          updated_at = NOW()
        WHERE id = ${activeDbAccount.id}
      `;
      // The cached accounts list still holds the old expiry; drop it so the UI shows the new one.
      await redisDel('sr:acc:list').catch(() => false);
    } catch (saveErr) {
      console.warn('Failed to update refreshed token in DB:', saveErr);
    }
    cachedShiprocketUser = restUser;
    cachedShiprocketToken = {
      token: authData.token,
      expiresAt: newExpiresAt.getTime(),
      accountId: activeDbAccount.id,
    };
    return {
      token: authData.token,
      user: restUser,
      profile: activeDbAccount,
    };
}
/**
 * `auth` pins the request to an account already resolved by the caller (so a cache key and the
 * request it caches can't straddle an account switch); otherwise the active account is used.
 */
export async function shiprocketFetch(
  endpoint: string,
  options: RequestInit = {},
  auth?: { token: string }
): Promise<Response> {
  const { token } = auth ?? (await getShiprocketAuth());
  let res = await fetch(`https://apiv2.shiprocket.in/v1/external/${endpoint.replace(/^\//, '')}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    cachedShiprocketToken = null;
    const refreshed = await getShiprocketAuth(true);
    res = await fetch(`https://apiv2.shiprocket.in/v1/external/${endpoint.replace(/^\//, '')}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${refreshed.token}`,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
  }
  return res;
}
