'use server';
import { ensureTables, getDb, isAuthorizedUser } from '@/lib/db';
import type { DbShiprocketAccount } from '@/lib/db/types';
import type { ShiprocketAccountProfile } from '@/types/shiprocket';
import { invalidateShiprocketAuthCache } from './shiprocketClient';
import {
  withShiprocketCache,
  invalidateShiprocketAccountsCache,
  SR_CACHE_TTL,
} from '@/lib/shiprocketCache';
export interface CreateShiprocketAccountInput {
  account_label: string;
  company_name: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  api_email: string;
  api_password: string;
  auth_token?: string;
  is_active?: boolean;
}
export interface UpdateShiprocketAccountInput {
  id: string;
  account_label?: string;
  company_name?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  api_email?: string;
  api_password?: string;
  auth_token?: string;
}
export async function listShiprocketAccountsAction(
  token?: string | null
): Promise<{ success: boolean; accounts: ShiprocketAccountProfile[] }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }

  return withShiprocketCache(
    'sr:acc:list',
    SR_CACHE_TTL.ACCOUNTS_LIST,
    async () => {
      const rows = (await sql`
        SELECT
          id, account_label, company_name, contact_name, contact_phone, contact_email,
          api_email, auth_token, token_expires_at, sr_user_id, sr_company_id,
          sr_first_name, sr_last_name, is_active, balance, created_at, updated_at
        FROM shiprocket_accounts
        ORDER BY is_active DESC, updated_at DESC
      `) as Array<DbShiprocketAccount>;
      const accounts: ShiprocketAccountProfile[] = rows.map((r) => ({
        id: r.id,
        account_label: r.account_label,
        company_name: r.company_name,
        contact_name: r.contact_name,
        contact_phone: r.contact_phone,
        contact_email: r.contact_email,
        api_email: r.api_email,
        auth_token: r.auth_token,
        token_expires_at: r.token_expires_at,
        sr_user_id: r.sr_user_id,
        sr_company_id: r.sr_company_id,
        sr_first_name: r.sr_first_name,
        sr_last_name: r.sr_last_name,
        is_active: Boolean(r.is_active),
        balance: r.balance !== undefined && r.balance !== null ? Number(r.balance) : 0,
        created_at: r.created_at,
        updated_at: r.updated_at,
      }));
      // Fetch live wallet balance for accounts with valid tokens
      const now = Date.now();
      await Promise.all(
        accounts.map(async (acc) => {
          if (!acc.auth_token) return;
          const expiry = acc.token_expires_at ? new Date(acc.token_expires_at).getTime() : 0;
          if (expiry <= now) return;
          try {
            const balRes = await fetch('https://apiv2.shiprocket.in/v1/external/account/details/wallet-balance', {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${acc.auth_token}`,
              },
            });
            if (balRes.ok) {
              const balData = await balRes.json();
              const balAmount = balData?.data?.balance_amount;
              if (balAmount !== undefined && balAmount !== null) {
                acc.balance = Number(balAmount);
                await sql`UPDATE shiprocket_accounts SET balance = ${Number(balAmount)}, updated_at = NOW() WHERE id = ${acc.id}`.catch(() => {});
              }
            }
          } catch (balErr) {
            console.warn(`Failed to fetch wallet balance for account ${acc.id}:`, balErr);
          }
        })
      );
      return {
        success: true,
        accounts,
      };
    }
  );
}
export async function switchActiveShiprocketAccountAction(
  accountId: string,
  token?: string | null
): Promise<{ success: boolean; message: string }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  const existing = (await sql`
    SELECT id, account_label FROM shiprocket_accounts WHERE id = ${accountId} LIMIT 1
  `) as Array<{ id: string; account_label: string }>;
  if (existing.length === 0) {
    throw new Error(`Account not found: ${accountId}`);
  }
  await sql`UPDATE shiprocket_accounts SET is_active = false`;
  await sql`UPDATE shiprocket_accounts SET is_active = true, updated_at = NOW() WHERE id = ${accountId}`;
  await invalidateShiprocketAuthCache();
  await invalidateShiprocketAccountsCache();
  return {
    success: true,
    message: `Active account switched to ${existing[0].account_label || accountId}`,
  };
}

export async function saveShiprocketAccountAction(
  input: CreateShiprocketAccountInput,
  token?: string | null
): Promise<{ success: boolean; accountId: string; message: string }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  if (!input.account_label.trim() || !input.company_name.trim() || !input.api_email.trim()) {
    throw new Error('Account label, company name, and API user email are required');
  }
  let testToken = input.auth_token?.trim() || null;
  let srUserId: number | null = null;
  let srCompanyId: number | null = null;
  let srFirstName: string | null = null;
  let srLastName: string | null = null;
  let expiresAt: string | null = null;
  if (input.api_password.trim() && !input.api_password.startsWith('eyJ')) {
    try {
      const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: input.api_email.trim(),
          password: input.api_password.trim().replace(/\\(\$)/g, '$1'),
        }),
      });
      const data = (await authRes.json()) as {
        token?: string;
        id?: number;
        company_id?: number;
        first_name?: string;
        last_name?: string;
        message?: string;
      };
      if (!authRes.ok || !data.token) {
        throw new Error(data?.message || `HTTP ${authRes.status}`);
      }
      testToken = data.token;
      srUserId = data.id ?? null;
      srCompanyId = data.company_id ?? null;
      srFirstName = data.first_name ?? null;
      srLastName = data.last_name ?? null;
      expiresAt = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login test failed';
      throw new Error(`Failed to verify credentials with Shiprocket: ${msg}`);
    }
  }
  const id = `sr_acc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const countRows = (await sql`SELECT count(*)::int as count FROM shiprocket_accounts`) as Array<{ count: number }>;
  const isFirst = (countRows[0]?.count || 0) === 0;
  const shouldBeActive = input.is_active ?? isFirst;
  if (shouldBeActive) {
    await sql`UPDATE shiprocket_accounts SET is_active = false`;
  }
  await sql`
    INSERT INTO shiprocket_accounts (
      id, account_label, company_name, contact_name, contact_phone, contact_email,
      api_email, api_password, auth_token, token_expires_at, sr_user_id, sr_company_id,
      sr_first_name, sr_last_name, is_active, created_at, updated_at
    ) VALUES (
      ${id},
      ${input.account_label.trim()},
      ${input.company_name.trim()},
      ${input.contact_name.trim()},
      ${input.contact_phone.trim()},
      ${input.contact_email.trim()},
      ${input.api_email.trim()},
      ${input.api_password.trim()},
      ${testToken},
      ${expiresAt},
      ${srUserId},
      ${srCompanyId},
      ${srFirstName},
      ${srLastName},
      ${shouldBeActive},
      NOW(),
      NOW()
    )
  `;
  if (shouldBeActive) {
    await invalidateShiprocketAuthCache();
  }
  await invalidateShiprocketAccountsCache();
  return {
    success: true,
    accountId: id,
    message: 'Shiprocket account successfully created and verified',
  };

}
export async function deleteShiprocketAccountAction(
  accountId: string,
  token?: string | null
): Promise<{ success: boolean; message: string }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  const target = (await sql`
    SELECT id, is_active FROM shiprocket_accounts WHERE id = ${accountId} LIMIT 1
  `) as Array<{ id: string; is_active: boolean }>;
  if (target.length === 0) {
    throw new Error('Account not found');
  }
  const wasActive = Boolean(target[0].is_active);
  await sql`DELETE FROM shiprocket_accounts WHERE id = ${accountId}`;
  if (wasActive) {
    const nextAccount = (await sql`
      SELECT id FROM shiprocket_accounts ORDER BY updated_at DESC LIMIT 1
    `) as Array<{ id: string }>;
    if (nextAccount.length > 0) {
      await sql`UPDATE shiprocket_accounts SET is_active = true WHERE id = ${nextAccount[0].id}`;
    }
    await invalidateShiprocketAuthCache();
  }
  await invalidateShiprocketAccountsCache();
  return {
    success: true,
    message: 'Shiprocket account removed',
  };
}
export async function updateShiprocketAccountAction(
  input: UpdateShiprocketAccountInput,
  token?: string | null
): Promise<{ success: boolean; message: string }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  const existing = (await sql`
    SELECT id, api_email, api_password FROM shiprocket_accounts WHERE id = ${input.id} LIMIT 1
  `) as Array<{ id: string; api_email: string; api_password: string }>;
  if (existing.length === 0) {
    throw new Error('Account not found');
  }
  const target = existing[0];
  let newAuthToken: string | null = null;
  let newExpiresAt: string | null = null;
  let newUserId: number | null = null;
  let newCompanyId: number | null = null;
  let newFirstName: string | null = null;
  let newLastName: string | null = null;
  const emailToTest = input.api_email?.trim() || target.api_email;
  const passwordToTest = input.api_password !== undefined ? input.api_password.trim() : target.api_password;
  if (input.api_password || (input.api_email && input.api_email !== target.api_email)) {
    if (passwordToTest && !passwordToTest.startsWith('eyJ')) {
      try {
        const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailToTest,
            password: passwordToTest.replace(/\\(\$)/g, '$1'),
          }),
        });
        const data = (await authRes.json()) as {
          token?: string;
          id?: number;
          company_id?: number;
          first_name?: string;
          last_name?: string;
          message?: string;
        };
        if (!authRes.ok || !data.token) {
          throw new Error(data?.message || `HTTP ${authRes.status}`);
        }
        newAuthToken = data.token;
        newUserId = data.id ?? null;
        newCompanyId = data.company_id ?? null;
        newFirstName = data.first_name ?? null;
        newLastName = data.last_name ?? null;
        newExpiresAt = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Verification failed';
        throw new Error(`Failed to verify updated credentials with Shiprocket: ${msg}`);
      }
    }
  }
  await sql`
    UPDATE shiprocket_accounts
    SET
      account_label = COALESCE(${input.account_label?.trim() || null}, account_label),
      company_name = COALESCE(${input.company_name?.trim() || null}, company_name),
      contact_name = COALESCE(${input.contact_name?.trim() || null}, contact_name),
      contact_phone = COALESCE(${input.contact_phone?.trim() || null}, contact_phone),
      contact_email = COALESCE(${input.contact_email?.trim() || null}, contact_email),
      api_email = COALESCE(${input.api_email?.trim() || null}, api_email),
      api_password = COALESCE(${input.api_password?.trim() || null}, api_password),
      auth_token = COALESCE(${newAuthToken}, auth_token),
      token_expires_at = COALESCE(${newExpiresAt}, token_expires_at),
      sr_user_id = COALESCE(${newUserId}, sr_user_id),
      sr_company_id = COALESCE(${newCompanyId}, sr_company_id),
      sr_first_name = COALESCE(${newFirstName}, sr_first_name),
      sr_last_name = COALESCE(${newLastName}, sr_last_name),
      updated_at = NOW()
    WHERE id = ${input.id}
  `;
  await invalidateShiprocketAuthCache();
  await invalidateShiprocketAccountsCache();
  return {
    success: true,
    message: 'Shiprocket account details updated successfully',
  };
}

