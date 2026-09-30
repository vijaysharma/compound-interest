'use server';

import { ensureTables, getDb, isAuthorizedUser } from '@/lib/db';
import type { DbShiprocketAccount, DbShiprocketCustomer } from '@/lib/db/types';
import type { ShiprocketCustomer, ShiprocketOrder } from '@/types/shiprocket';

export interface CustomerFilterOptions {
  search?: string;
  sortBy?: 'name' | 'phone' | 'city' | 'state' | 'pincode' | 'orders' | 'updated_at' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  perPage?: number;
}

export interface SyncCustomersResult {
  success: boolean;
  message: string;
  totalSynced: number;
  accountsProcessed: number;
  errors?: string[];
}

export interface CustomerInput {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address: string;
  customer_address_2?: string;
  customer_city: string;
  customer_state: string;
  customer_pincode: string;
}

/**
 * Standardize phone numbers to last 10 digits
 */
function cleanPhone(rawPhone?: string | null): string {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

/**
 * Standardize pincode to 6 clean digits
 */
function cleanPincode(rawPincode?: string | null): string {
  if (!rawPincode) return '';
  const digits = rawPincode.replace(/\D/g, '');
  return digits.slice(0, 6);
}

/**
 * Compute unique deduplication key: phone + pincode
 * Avoids duplicates while allowing different entries if phone or pincode is different for same customer.
 */
export async function getCustomerDedupKey(phone: string, pincode: string): Promise<string> {
  const p = cleanPhone(phone);
  const pin = cleanPincode(pincode);
  return `${p}_${pin}`;
}

/**
 * Helper to ensure a valid auth token for an account, auto-refreshing if expired
 */
async function getAccountToken(
  acc: DbShiprocketAccount,
  sql: ReturnType<typeof getDb>
): Promise<string | null> {
  const now = Date.now();
  const dbExpiry = acc.token_expires_at ? new Date(acc.token_expires_at).getTime() : 0;
  if (acc.auth_token && dbExpiry > now + 3600 * 1000) {
    return acc.auth_token;
  }

  const password = (acc.api_password || '').replace(/\\(\$)/g, '$1');
  if (!acc.api_email || !password) {
    return acc.auth_token || null;
  }

  try {
    const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: acc.api_email, password }),
    });
    const authData = await authRes.json();
    if (authRes.ok && authData?.token) {
      const newExpiresAt = new Date(now + 8 * 24 * 60 * 60 * 1000).toISOString();
      await sql`
        UPDATE shiprocket_accounts
        SET
          auth_token = ${authData.token},
          token_expires_at = ${newExpiresAt},
          sr_user_id = ${authData.id ?? null},
          sr_company_id = ${authData.company_id ?? null},
          sr_first_name = ${authData.first_name ?? null},
          sr_last_name = ${authData.last_name ?? null},
          updated_at = NOW()
        WHERE id = ${acc.id}
      `;
      return authData.token;
    }
  } catch (err) {
    console.warn(`Token refresh failed for account ${acc.id}:`, err);
  }
  return acc.auth_token || null;
}

/**
 * List stored customers with search, sort, and pagination
 */
export async function listShiprocketCustomersAction(
  options: CustomerFilterOptions = {},
  token?: string | null
): Promise<{
  success: boolean;
  customers: ShiprocketCustomer[];
  total: number;
  page: number;
  perPage: number;
}> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }

  const search = options.search?.trim().toLowerCase() || '';
  const page = Math.max(1, options.page || 1);
  const perPage = Math.min(100, Math.max(5, options.perPage || 25));
  const offset = (page - 1) * perPage;
  const sortCol = options.sortBy || 'updated_at';
  const sortDir = options.sortOrder === 'asc' ? 'ASC' : 'DESC';

  let rows: DbShiprocketCustomer[];
  let countResult: Array<{ count: number }>;

  if (search) {
    const term = `%${search}%`;
    countResult = (await sql`
      SELECT count(*)::int as count
      FROM shiprocket_customers
      WHERE
        LOWER(customer_name) LIKE ${term}
        OR customer_phone LIKE ${term}
        OR LOWER(COALESCE(customer_email, '')) LIKE ${term}
        OR LOWER(customer_address) LIKE ${term}
        OR LOWER(customer_city) LIKE ${term}
        OR LOWER(customer_state) LIKE ${term}
        OR customer_pincode LIKE ${term}
    `) as Array<{ count: number }>;

    if (sortCol === 'name') {
      rows = (await sql`
        SELECT * FROM shiprocket_customers
        WHERE
          LOWER(customer_name) LIKE ${term}
          OR customer_phone LIKE ${term}
          OR LOWER(COALESCE(customer_email, '')) LIKE ${term}
          OR LOWER(customer_address) LIKE ${term}
          OR LOWER(customer_city) LIKE ${term}
          OR LOWER(customer_state) LIKE ${term}
          OR customer_pincode LIKE ${term}
        ORDER BY customer_name ${sortDir === 'ASC' ? sql`ASC` : sql`DESC`}
        LIMIT ${perPage} OFFSET ${offset}
      `) as DbShiprocketCustomer[];
    } else if (sortCol === 'phone') {
      rows = (await sql`
        SELECT * FROM shiprocket_customers
        WHERE
          LOWER(customer_name) LIKE ${term}
          OR customer_phone LIKE ${term}
          OR LOWER(COALESCE(customer_email, '')) LIKE ${term}
          OR LOWER(customer_address) LIKE ${term}
          OR LOWER(customer_city) LIKE ${term}
          OR LOWER(customer_state) LIKE ${term}
          OR customer_pincode LIKE ${term}
        ORDER BY customer_phone ${sortDir === 'ASC' ? sql`ASC` : sql`DESC`}
        LIMIT ${perPage} OFFSET ${offset}
      `) as DbShiprocketCustomer[];
    } else if (sortCol === 'city') {
      rows = (await sql`
        SELECT * FROM shiprocket_customers
        WHERE
          LOWER(customer_name) LIKE ${term}
          OR customer_phone LIKE ${term}
          OR LOWER(COALESCE(customer_email, '')) LIKE ${term}
          OR LOWER(customer_address) LIKE ${term}
          OR LOWER(customer_city) LIKE ${term}
          OR LOWER(customer_state) LIKE ${term}
          OR customer_pincode LIKE ${term}
        ORDER BY customer_city ${sortDir === 'ASC' ? sql`ASC` : sql`DESC`}
        LIMIT ${perPage} OFFSET ${offset}
      `) as DbShiprocketCustomer[];
    } else if (sortCol === 'state') {
      rows = (await sql`
        SELECT * FROM shiprocket_customers
        WHERE
          LOWER(customer_name) LIKE ${term}
          OR customer_phone LIKE ${term}
          OR LOWER(COALESCE(customer_email, '')) LIKE ${term}
          OR LOWER(customer_address) LIKE ${term}
          OR LOWER(customer_city) LIKE ${term}
          OR LOWER(customer_state) LIKE ${term}
          OR customer_pincode LIKE ${term}
        ORDER BY customer_state ${sortDir === 'ASC' ? sql`ASC` : sql`DESC`}
        LIMIT ${perPage} OFFSET ${offset}
      `) as DbShiprocketCustomer[];
    } else if (sortCol === 'pincode') {
      rows = (await sql`
        SELECT * FROM shiprocket_customers
        WHERE
          LOWER(customer_name) LIKE ${term}
          OR customer_phone LIKE ${term}
          OR LOWER(COALESCE(customer_email, '')) LIKE ${term}
          OR LOWER(customer_address) LIKE ${term}
          OR LOWER(customer_city) LIKE ${term}
          OR LOWER(customer_state) LIKE ${term}
          OR customer_pincode LIKE ${term}
        ORDER BY customer_pincode ${sortDir === 'ASC' ? sql`ASC` : sql`DESC`}
        LIMIT ${perPage} OFFSET ${offset}
      `) as DbShiprocketCustomer[];
    } else if (sortCol === 'orders') {
      rows = (await sql`
        SELECT * FROM shiprocket_customers
        WHERE
          LOWER(customer_name) LIKE ${term}
          OR customer_phone LIKE ${term}
          OR LOWER(COALESCE(customer_email, '')) LIKE ${term}
          OR LOWER(customer_address) LIKE ${term}
          OR LOWER(customer_city) LIKE ${term}
          OR LOWER(customer_state) LIKE ${term}
          OR customer_pincode LIKE ${term}
        ORDER BY total_orders ${sortDir === 'ASC' ? sql`ASC` : sql`DESC`}
        LIMIT ${perPage} OFFSET ${offset}
      `) as DbShiprocketCustomer[];
    } else if (sortCol === 'created_at') {
      rows = (await sql`
        SELECT * FROM shiprocket_customers
        WHERE
          LOWER(customer_name) LIKE ${term}
          OR customer_phone LIKE ${term}
          OR LOWER(COALESCE(customer_email, '')) LIKE ${term}
          OR LOWER(customer_address) LIKE ${term}
          OR LOWER(customer_city) LIKE ${term}
          OR LOWER(customer_state) LIKE ${term}
          OR customer_pincode LIKE ${term}
        ORDER BY created_at ${sortDir === 'ASC' ? sql`ASC` : sql`DESC`}
        LIMIT ${perPage} OFFSET ${offset}
      `) as DbShiprocketCustomer[];
    } else {
      rows = (await sql`
        SELECT * FROM shiprocket_customers
        WHERE
          LOWER(customer_name) LIKE ${term}
          OR customer_phone LIKE ${term}
          OR LOWER(COALESCE(customer_email, '')) LIKE ${term}
          OR LOWER(customer_address) LIKE ${term}
          OR LOWER(customer_city) LIKE ${term}
          OR LOWER(customer_state) LIKE ${term}
          OR customer_pincode LIKE ${term}
        ORDER BY updated_at ${sortDir === 'ASC' ? sql`ASC` : sql`DESC`}
        LIMIT ${perPage} OFFSET ${offset}
      `) as DbShiprocketCustomer[];
    }
  } else {
    countResult = (await sql`SELECT count(*)::int as count FROM shiprocket_customers`) as Array<{ count: number }>;

    if (sortCol === 'name') {
      rows = (await sql`
        SELECT * FROM shiprocket_customers
        ORDER BY customer_name ${sortDir === 'ASC' ? sql`ASC` : sql`DESC`}
        LIMIT ${perPage} OFFSET ${offset}
      `) as DbShiprocketCustomer[];
    } else if (sortCol === 'phone') {
      rows = (await sql`
        SELECT * FROM shiprocket_customers
        ORDER BY customer_phone ${sortDir === 'ASC' ? sql`ASC` : sql`DESC`}
        LIMIT ${perPage} OFFSET ${offset}
      `) as DbShiprocketCustomer[];
    } else if (sortCol === 'city') {
      rows = (await sql`
        SELECT * FROM shiprocket_customers
        ORDER BY customer_city ${sortDir === 'ASC' ? sql`ASC` : sql`DESC`}
        LIMIT ${perPage} OFFSET ${offset}
      `) as DbShiprocketCustomer[];
    } else if (sortCol === 'state') {
      rows = (await sql`
        SELECT * FROM shiprocket_customers
        ORDER BY customer_state ${sortDir === 'ASC' ? sql`ASC` : sql`DESC`}
        LIMIT ${perPage} OFFSET ${offset}
      `) as DbShiprocketCustomer[];
    } else if (sortCol === 'pincode') {
      rows = (await sql`
        SELECT * FROM shiprocket_customers
        ORDER BY customer_pincode ${sortDir === 'ASC' ? sql`ASC` : sql`DESC`}
        LIMIT ${perPage} OFFSET ${offset}
      `) as DbShiprocketCustomer[];
    } else if (sortCol === 'orders') {
      rows = (await sql`
        SELECT * FROM shiprocket_customers
        ORDER BY total_orders ${sortDir === 'ASC' ? sql`ASC` : sql`DESC`}
        LIMIT ${perPage} OFFSET ${offset}
      `) as DbShiprocketCustomer[];
    } else if (sortCol === 'created_at') {
      rows = (await sql`
        SELECT * FROM shiprocket_customers
        ORDER BY created_at ${sortDir === 'ASC' ? sql`ASC` : sql`DESC`}
        LIMIT ${perPage} OFFSET ${offset}
      `) as DbShiprocketCustomer[];
    } else {
      rows = (await sql`
        SELECT * FROM shiprocket_customers
        ORDER BY updated_at ${sortDir === 'ASC' ? sql`ASC` : sql`DESC`}
        LIMIT ${perPage} OFFSET ${offset}
      `) as DbShiprocketCustomer[];
    }
  }

  const total = Number(countResult[0]?.count || 0);

  return {
    success: true,
    customers: rows.map((r) => ({
      id: r.id,
      customer_name: r.customer_name,
      customer_phone: r.customer_phone,
      customer_email: r.customer_email ?? null,
      customer_address: r.customer_address,
      customer_address_2: r.customer_address_2 ?? null,
      customer_city: r.customer_city,
      customer_state: r.customer_state,
      customer_pincode: r.customer_pincode,
      dedup_key: r.dedup_key,
      source_account_ids: r.source_account_ids || [],
      total_orders: Number(r.total_orders || 1),
      last_order_id: r.last_order_id ?? null,
      last_order_date: r.last_order_date ?? null,
      created_at: r.created_at,
      updated_at: r.updated_at,
    })),
    total,
    page,
    perPage,
  };
}

/**
 * Save or update a single customer record manually (CRUD)
 */
export async function saveShiprocketCustomerAction(
  customer: CustomerInput & { id?: string },
  token?: string | null
): Promise<{ success: boolean; id: string; message: string }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }

  const name = customer.customer_name.trim();
  const phone = cleanPhone(customer.customer_phone);
  const pincode = cleanPincode(customer.customer_pincode);
  const address = customer.customer_address.trim();
  const city = customer.customer_city.trim();
  const state = customer.customer_state.trim();

  if (!name || !phone || !pincode || !address) {
    throw new Error('Name, Phone, Address, and Pincode are mandatory');
  }

  const dedupKey = `${phone}_${pincode}`;
  const email = customer.customer_email?.trim() || null;
  const address2 = customer.customer_address_2?.trim() || null;

  if (customer.id) {
    // Check if new dedupKey conflicts with another customer
    const existing = (await sql`
      SELECT id FROM shiprocket_customers WHERE dedup_key = ${dedupKey} AND id != ${customer.id} LIMIT 1
    `) as Array<{ id: string }>;
    if (existing.length > 0) {
      throw new Error(`Another customer already exists with phone ${phone} and pincode ${pincode}`);
    }

    await sql`
      UPDATE shiprocket_customers
      SET
        customer_name = ${name},
        customer_phone = ${phone},
        customer_email = ${email},
        customer_address = ${address},
        customer_address_2 = ${address2},
        customer_city = ${city},
        customer_state = ${state},
        customer_pincode = ${pincode},
        dedup_key = ${dedupKey},
        updated_at = NOW()
      WHERE id = ${customer.id}
    `;

    return { success: true, id: customer.id, message: 'Customer details updated successfully' };
  }

  // Insert or update on dedup_key conflict
  const id = `cust_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  await sql`
    INSERT INTO shiprocket_customers (
      id, customer_name, customer_phone, customer_email,
      customer_address, customer_address_2, customer_city, customer_state, customer_pincode,
      dedup_key, source_account_ids, total_orders, created_at, updated_at
    ) VALUES (
      ${id}, ${name}, ${phone}, ${email},
      ${address}, ${address2}, ${city}, ${state}, ${pincode},
      ${dedupKey}, '{}', 1, NOW(), NOW()
    )
    ON CONFLICT (dedup_key) DO UPDATE SET
      customer_name = EXCLUDED.customer_name,
      customer_email = COALESCE(EXCLUDED.customer_email, shiprocket_customers.customer_email),
      customer_address = EXCLUDED.customer_address,
      customer_address_2 = COALESCE(EXCLUDED.customer_address_2, shiprocket_customers.customer_address_2),
      customer_city = EXCLUDED.customer_city,
      customer_state = EXCLUDED.customer_state,
      updated_at = NOW()
  `;

  return { success: true, id, message: 'Customer saved successfully' };
}

/**
 * Delete a customer record by ID (CRUD)
 */
export async function deleteShiprocketCustomerAction(
  customerId: string,
  token?: string | null
): Promise<{ success: boolean; message: string }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }

  await sql`DELETE FROM shiprocket_customers WHERE id = ${customerId}`;
  return { success: true, message: 'Customer removed successfully' };
}

/**
 * Sync Historical Customers Across All Accounts
 * Iterates through all configured Shiprocket accounts, pulls historical orders for the selected period,
 * and standardizes & dedupes customer records into `shiprocket_customers` table.
 */
export async function syncHistoricalCustomersAction(
  period: { from?: string; to?: string },
  token?: string | null
): Promise<SyncCustomersResult> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }

  // 1. Fetch all accounts
  const accounts = (await sql`
    SELECT
      id, account_label, company_name, contact_name, contact_phone, contact_email,
      api_email, api_password, auth_token, token_expires_at, sr_user_id, sr_company_id,
      sr_first_name, sr_last_name, is_active, balance, created_at, updated_at
    FROM shiprocket_accounts
  `) as Array<DbShiprocketAccount>;

  if (accounts.length === 0) {
    throw new Error('No Shiprocket accounts configured in database. Please register accounts first.');
  }

  let totalUpserted = 0;
  let accountsProcessed = 0;
  const errors: string[] = [];

  for (const acc of accounts) {
    const authToken = await getAccountToken(acc, sql);
    if (!authToken) {
      errors.push(`Account '${acc.account_label}' has invalid or missing credentials.`);
      continue;
    }

    try {
      // Fetch up to 100 historical orders per page for this account
      let page = 1;
      let totalPages = 1;
      let accountOrdersCount = 0;

      while (page <= totalPages && page <= 10) {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('per_page', '100');
        if (period.from) params.set('from', period.from);
        if (period.to) params.set('to', period.to);

        const ordersRes = await fetch(
          `https://apiv2.shiprocket.in/v1/external/orders?${params.toString()}`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (!ordersRes.ok) {
          const errData = await ordersRes.json().catch(() => ({}));
          errors.push(`Account '${acc.account_label}': ${errData?.message || `HTTP ${ordersRes.status}`}`);
          break;
        }

        const data = await ordersRes.json();
        const ordersList = Array.isArray(data?.data) ? (data.data as ShiprocketOrder[]) : [];
        if (data?.meta?.pagination?.total_pages) {
          totalPages = data.meta.pagination.total_pages;
        }

        for (const order of ordersList) {
          const name = (order.customer_name || '').trim();
          const phone = cleanPhone(order.customer_phone);
          const pincode = cleanPincode(order.customer_pincode);
          const address = (order.customer_address || '').trim();

          // Require minimal valid customer details
          if (!phone || !pincode || !address) continue;

          const dedupKey = `${phone}_${pincode}`;
          const email = (order.customer_email || '').trim() || null;
          const address2 = (order.customer_address_2 || '').trim() || null;
          const city = (order.customer_city || '').trim() || '—';
          const state = (order.customer_state || '').trim() || '—';
          const orderId = String(order.id);
          const orderDate = order.created_at ? new Date(order.created_at).toISOString() : null;
          const custId = `cust_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

          await sql`
            INSERT INTO shiprocket_customers (
              id, customer_name, customer_phone, customer_email,
              customer_address, customer_address_2, customer_city, customer_state, customer_pincode,
              dedup_key, source_account_ids, total_orders, last_order_id, last_order_date, created_at, updated_at
            ) VALUES (
              ${custId}, ${name || 'Customer'}, ${phone}, ${email},
              ${address}, ${address2}, ${city}, ${state}, ${pincode},
              ${dedupKey}, ARRAY[${acc.id}]::TEXT[], 1, ${orderId}, ${orderDate}, NOW(), NOW()
            )
            ON CONFLICT (dedup_key) DO UPDATE SET
              customer_name = CASE WHEN EXCLUDED.customer_name != 'Customer' THEN EXCLUDED.customer_name ELSE shiprocket_customers.customer_name END,
              customer_email = COALESCE(EXCLUDED.customer_email, shiprocket_customers.customer_email),
              customer_address = EXCLUDED.customer_address,
              customer_address_2 = COALESCE(EXCLUDED.customer_address_2, shiprocket_customers.customer_address_2),
              customer_city = EXCLUDED.customer_city,
              customer_state = EXCLUDED.customer_state,
              source_account_ids = CASE
                WHEN NOT (${acc.id} = ANY(shiprocket_customers.source_account_ids))
                THEN array_append(shiprocket_customers.source_account_ids, ${acc.id})
                ELSE shiprocket_customers.source_account_ids
              END,
              total_orders = shiprocket_customers.total_orders + 1,
              last_order_id = COALESCE(EXCLUDED.last_order_id, shiprocket_customers.last_order_id),
              last_order_date = GREATEST(COALESCE(EXCLUDED.last_order_date, '1970-01-01'::timestamptz), COALESCE(shiprocket_customers.last_order_date, '1970-01-01'::timestamptz)),
              updated_at = NOW()
          `;

          totalUpserted++;
          accountOrdersCount++;
        }

        page++;
      }

      accountsProcessed++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error during order sync';
      errors.push(`Account '${acc.account_label}': ${msg}`);
    }
  }

  return {
    success: true,
    message: `Processed ${accountsProcessed} account(s). Synced/updated ${totalUpserted} customer records.`,
    totalSynced: totalUpserted,
    accountsProcessed,
    errors: errors.length > 0 ? errors : undefined,
  };
}
