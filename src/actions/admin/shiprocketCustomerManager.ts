'use server';
import { ensureTables, getDb, isAuthorizedUser } from '@/lib/db';
import type { DbShiprocketAccount, DbShiprocketCustomer } from '@/lib/db/types';
import type { ShiprocketCustomer } from '@/types/shiprocket';
import {
  withShiprocketCache,
  invalidateShiprocketCustomersCache,
  SR_CACHE_TTL,
} from '@/lib/shiprocketCache';

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
  customer_phone_2?: string;
  customer_email?: string;
  customer_address: string;
  customer_address_2?: string;
  customer_city: string;
  customer_state: string;
  customer_pincode: string;
}
/**
 * Shiprocket substitutes sentinel strings for buyer PII when the API user lacks "Buyer's Details
 * Access": phone/name come back as "Not Authorized" and phone as "xxxxxxxxxx". Treat these as
 * absent rather than storing them as real values.
 */
function isPiiSentinel(raw?: string | null): boolean {
  if (!raw) return true;
  const v = String(raw).trim().toLowerCase();
  if (!v) return true;
  return (
    v === 'not authorized' ||
    v === 'unauthorized' ||
    v === 'not available' ||
    /^x+$/.test(v) ||
    /^\*+$/.test(v)
  );
}
/**
 * First candidate that is a usable real value, skipping blanks and PII sentinels.
 *
 * The `/orders` list endpoint returns `customer_address: "Not Authorized"` for *every* order when
 * a date range is supplied, so a plain `a || b || c` chain happily selects that string. Only
 * `/orders/show` and the unfiltered list return the real street address.
 */
function firstReal(...candidates: unknown[]): string {
  for (const c of candidates) {
    if (c === null || c === undefined) continue;
    const v = String(c).trim();
    if (!v || isPiiSentinel(v)) continue;
    return v;
  }
  return '';
}
/**
 * Standardize phone numbers to last 10 digits
 */
function cleanPhone(rawPhone?: string | null): string {
  if (!rawPhone || isPiiSentinel(rawPhone)) return '';
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
 * Standardize a customer name for identity comparison: lowercase, punctuation stripped,
 * whitespace collapsed. "Manisha Choudhury " and "manisha  choudhury" become the same key.
 */
function cleanName(rawName?: string | null): string {
  if (!rawName || isPiiSentinel(rawName)) return '';
  return rawName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
const SR_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/**
 * `/v1/external/orders` rejects ISO dates: it wants `DD-MMM-YYYY` (e.g. 01-Jan-2024) and replies
 * "Failed to parse from date" otherwise -- which previously surfaced as an empty result set rather
 * than an error, silently dropping most of the history.
 */
function toOrdersDate(iso?: string | null): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (!m) return '';
  const month = SR_MONTHS[Number(m[2]) - 1];
  if (!month) return '';
  return `${m[3]}-${month}-${m[1]}`;
}
/** `/v1/external/shipments` wants plain `YYYY-MM-DD` -- the opposite of `/orders`. */
function toShipmentsDate(iso?: string | null): string {
  if (!iso) return '';
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(iso.trim());
  return m ? m[1] : '';
}
/**
 * Parse Shiprocket's list-format date ("10 Aug 2026, 10:38 PM") into `YYYY-MM-DD`.
 */
function parseSrListDate(raw?: unknown): string {
  if (!raw) return '';
  const m = /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/.exec(String(raw).trim());
  if (!m) {
    const d = new Date(String(raw));
    return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  }
  const idx = SR_MONTHS.findIndex((mo) => mo.toLowerCase() === m[2].toLowerCase());
  if (idx < 0) return '';
  return `${m[3]}-${String(idx + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}
/**
 * `/shipments` refuses a window wider than 30 days, so split the requested span into slices.
 */
function splitIntoWindows(fromIso: string, toIso: string, days = 29): Array<{ from: string; to: string }> {
  const out: Array<{ from: string; to: string }> = [];
  const start = new Date(`${fromIso}T00:00:00Z`);
  const end = new Date(`${toIso}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return out;
  let cursor = start;
  while (cursor <= end) {
    const sliceEnd = new Date(cursor.getTime() + days * 86400000);
    const capped = sliceEnd > end ? end : sliceEnd;
    out.push({ from: cursor.toISOString().slice(0, 10), to: capped.toISOString().slice(0, 10) });
    cursor = new Date(capped.getTime() + 86400000);
  }
  return out;
}
/**
 * Compute the unique deduplication key: normalized name + pincode.
 *
 * Shiprocket masks buyer phone numbers in its API (`customer_phone: "xxxxxxxxxx"`), so phone
 * cannot serve as the identity half of the key. Normalized name stands in for it: repeat orders
 * from the same person at the same pincode collapse into one record, while a different pincode
 * -- or a different name -- yields a separate entry.
 */
export async function getCustomerDedupKey(name: string, pincode: string): Promise<string> {
  return buildDedupKey(name, pincode);
}
function buildDedupKey(name: string, pincode: string): string {
  return `${cleanName(name)}_${cleanPincode(pincode)}`;
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

  const cacheKey = `sr:cust:list:${page}:${perPage}:${search}:${sortCol}:${sortDir}`;

  return withShiprocketCache(cacheKey, SR_CACHE_TTL.CUSTOMERS_LIST, async () => {
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
        OR COALESCE(customer_phone_2, '') LIKE ${term}
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
          OR COALESCE(customer_phone_2, '') LIKE ${term}
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
          OR COALESCE(customer_phone_2, '') LIKE ${term}
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
          OR COALESCE(customer_phone_2, '') LIKE ${term}
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
          OR COALESCE(customer_phone_2, '') LIKE ${term}
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
          OR COALESCE(customer_phone_2, '') LIKE ${term}
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
          OR COALESCE(customer_phone_2, '') LIKE ${term}
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
          OR COALESCE(customer_phone_2, '') LIKE ${term}
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
          OR COALESCE(customer_phone_2, '') LIKE ${term}
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
      customer_phone_2: r.customer_phone_2 ?? null,
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
  });
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
  // Drop a secondary number that merely repeats the primary.
  const phone2Raw = cleanPhone(customer.customer_phone_2);
  const phone2 = phone2Raw && phone2Raw !== phone ? phone2Raw : null;
  const pincode = cleanPincode(customer.customer_pincode);
  const address = customer.customer_address.trim();
  const city = customer.customer_city.trim();
  const state = customer.customer_state.trim();
  // Phone is not mandatory: Shiprocket masks buyer phone numbers, so synced records legitimately
  // have none and must still be editable.
  if (!name || !pincode || !address) {
    throw new Error('Name, Address, and Pincode are mandatory');
  }
  const dedupKey = buildDedupKey(name, pincode);
  const email = customer.customer_email?.trim() || null;
  const address2 = customer.customer_address_2?.trim() || null;
  if (customer.id) {
    // Check if new dedupKey conflicts with another customer
    const existing = (await sql`
      SELECT id FROM shiprocket_customers WHERE dedup_key = ${dedupKey} AND id != ${customer.id} LIMIT 1
    `) as Array<{ id: string }>;
    if (existing.length > 0) {
      throw new Error(`Another customer already exists with name '${name}' at pincode ${pincode}`);
    }
    // Editing name or pincode rewrites dedup_key, so move the order links across to keep
    // total_orders derivable for the edited record.
    await sql`
      UPDATE shiprocket_customer_orders o
      SET dedup_key = ${dedupKey}
      WHERE o.dedup_key IN (SELECT dedup_key FROM shiprocket_customers WHERE id = ${customer.id})
        AND o.dedup_key <> ${dedupKey}
        AND NOT EXISTS (
          SELECT 1 FROM shiprocket_customer_orders x
          WHERE x.dedup_key = ${dedupKey}
            AND x.account_id = o.account_id
            AND x.order_id = o.order_id
        )
    `;
    await sql`
      UPDATE shiprocket_customers
      SET
        customer_name = ${name},
        customer_phone = ${phone},
        customer_phone_2 = ${phone2},
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
    // Without this the cached list keeps serving the pre-edit row (e.g. the old phone number).
    await invalidateShiprocketCustomersCache();
    return { success: true, id: customer.id, message: 'Customer details updated successfully' };
  }
  // Insert or update on dedup_key conflict
  const id = `cust_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  await sql`
    INSERT INTO shiprocket_customers (
      id, customer_name, customer_phone, customer_phone_2, customer_email,
      customer_address, customer_address_2, customer_city, customer_state, customer_pincode,
      dedup_key, source_account_ids, total_orders, created_at, updated_at
    ) VALUES (
      ${id}, ${name}, ${phone}, ${phone2}, ${email},
      ${address}, ${address2}, ${city}, ${state}, ${pincode},
      ${dedupKey}, '{}', 1, NOW(), NOW()
    )
    ON CONFLICT (dedup_key) DO UPDATE SET
      customer_name = EXCLUDED.customer_name,
      customer_phone_2 = COALESCE(EXCLUDED.customer_phone_2, shiprocket_customers.customer_phone_2),
      customer_email = COALESCE(EXCLUDED.customer_email, shiprocket_customers.customer_email),
      customer_address = EXCLUDED.customer_address,
      customer_address_2 = COALESCE(EXCLUDED.customer_address_2, shiprocket_customers.customer_address_2),
      customer_city = EXCLUDED.customer_city,
      customer_state = EXCLUDED.customer_state,
      updated_at = NOW()
  `;
  await invalidateShiprocketCustomersCache();
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
  // Clear the order links too, otherwise a later sync would rebuild the count from stale rows.
  await sql`
    DELETE FROM shiprocket_customer_orders
    WHERE dedup_key IN (SELECT dedup_key FROM shiprocket_customers WHERE id = ${customerId})
  `;
  await sql`DELETE FROM shiprocket_customers WHERE id = ${customerId}`;
  await invalidateShiprocketCustomersCache();
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
  let totalOrdersSeen = 0;
  const errors: string[] = [];
  // Helper function to extract the *buyer's* mobile number from an arbitrary record.
  // Pickup/seller fields are deliberately excluded: they hold the warehouse's own number, which
  // is identical for every order on an account and would collapse every customer in a pincode
  // into a single dedup_key.
  const extractPhoneFromObject = (obj: unknown, depth = 0): string => {
    if (!obj || typeof obj !== 'object' || depth > 3) return '';
    const rec = obj as Record<string, unknown>;
    // Priority keys
    const directKeys = [
      'customer_phone',
      'customer_mobile',
      'customer_mobile_number',
      'customer_phone_number',
      'billing_phone',
      'billing_mobile',
      'billing_mobile_number',
      'shipping_phone',
      'shipping_mobile',
      'shipping_mobile_number',
      'phone_number',
      'phone',
      'mobile',
      'mobile_number',
      'telephone',
      'contact',
    ];
    for (const key of directKeys) {
      if (rec[key]) {
        const cleaned = cleanPhone(String(rec[key]));
        if (cleaned.length >= 10) return cleaned;
      }
    }
    // Check nested objects. `pickup_address*` is omitted for the reason noted above.
    const nestedKeys = ['customer', 'customer_details', 'billing_address', 'shipping_address', 'others', 'billing', 'shipping', 'address'];
    for (const nKey of nestedKeys) {
      if (rec[nKey] && typeof rec[nKey] === 'object') {
        const nestedPhone = extractPhoneFromObject(rec[nKey], depth + 1);
        if (nestedPhone) return nestedPhone;
      }
    }
    // Check shipments array
    if (Array.isArray(rec.shipments) && rec.shipments.length > 0) {
      for (const ship of rec.shipments) {
        const shipPhone = extractPhoneFromObject(ship, depth + 1);
        if (shipPhone) return shipPhone;
      }
    }
    return '';
  };
  // Helper function to extract pincode from an arbitrary record
  const extractPincodeFromObject = (obj: unknown, depth = 0): string => {
    if (!obj || typeof obj !== 'object' || depth > 3) return '';
    const rec = obj as Record<string, unknown>;
    // Pickup/seller pincode is excluded for the same reason as the pickup phone: it is the
    // warehouse's own pincode and is identical across every order on an account.
    const directKeys = [
      'customer_pincode',
      'billing_pincode',
      'shipping_pincode',
      'pincode',
      'zipcode',
      'zip_code',
      'postal_code',
      'postcode',
    ];
    for (const key of directKeys) {
      if (rec[key]) {
        const cleaned = cleanPincode(String(rec[key]));
        if (cleaned.length >= 6) return cleaned;
      }
    }
    const nestedKeys = ['customer', 'customer_details', 'billing_address', 'shipping_address', 'others', 'billing', 'shipping', 'address'];
    for (const nKey of nestedKeys) {
      if (rec[nKey] && typeof rec[nKey] === 'object') {
        const nestedPin = extractPincodeFromObject(rec[nKey], depth + 1);
        if (nestedPin) return nestedPin;
      }
    }
    if (Array.isArray(rec.shipments) && rec.shipments.length > 0) {
      for (const ship of rec.shipments) {
        const shipPin = extractPincodeFromObject(ship, depth + 1);
        if (shipPin) return shipPin;
      }
    }
    return '';
  };
  for (const acc of accounts) {
    const authToken = await getAccountToken(acc, sql);
    if (!authToken) {
      errors.push(`Account '${acc.account_label}' has invalid or missing credentials.`);
      continue;
    }
    // A business is identified by its Shiprocket company id, not by the local credential row or
    // its label: the same company can be registered here twice under different labels/API users,
    // and attributing by row id would double-count it as two businesses for a customer.
    const accSourceId = acc.sr_company_id ? String(acc.sr_company_id) : acc.id;
    // Buyer name/phone on /shipments/{id} require the "Buyer's Details Access" permission on the
    // API user. Probe once per account and skip the extra request per order when it is denied.
    let buyerDetailsAllowed: boolean | null = null;
    try {
      let ordersSeenInAccount = 0;
      let skippedOrdersInAccount = 0;
      const skipReasons: string[] = [];
      const MAX_PAGES_TO_FETCH = 50;
      // Map to deduplicate records seen in this account by unique order identifier or shipment identifier
      const accountRecordsMap = new Map<string, Record<string, unknown>>();
      // The effective window. A full sync must still send an explicit range: with no dates the
      // endpoint returns only a handful of recent orders (0-4 per account here), not the history.
      const effFromIso = (period.from || '2015-01-01').slice(0, 10);
      const effToIso = (period.to || new Date().toISOString().slice(0, 10)).slice(0, 10);
      // 1. Fetch from /orders with all status variations
      // Shiprocket allows filtering by status or leaving empty, but some accounts have orders only under specific status buckets (e.g. ALL, DELIVERED, CANCELED)
      const statusQueries = ['', '&filter_by=ALL', '&status=ALL', '&filter_by=DELIVERED', '&filter_by=IN%20TRANSIT', '&filter_by=CANCELED', '&filter_by=COMPLETED'];
      const ordersFrom = toOrdersDate(effFromIso);
      const ordersTo = toOrdersDate(effToIso);
      for (const statusSuffix of statusQueries) {
        let page = 1;
        let barrenPages = 0;
        // `meta.pagination.total_pages` comes back as 0 on date-filtered queries even when `data`
        // is populated, so it cannot drive the loop. Page until a request yields no record we
        // have not already seen, which also terminates when the API repeats a page.
        while (page <= MAX_PAGES_TO_FETCH) {
          const params = new URLSearchParams();
          params.set('page', String(page));
          params.set('per_page', '100');
          if (ordersFrom) params.set('from', ordersFrom);
          if (ordersTo) params.set('to', ordersTo);
          const queryString = `${params.toString()}${statusSuffix}`;
          const ordersRes = await fetch(
            `https://apiv2.shiprocket.in/v1/external/orders?${queryString}`,
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
              },
            }
          );
          const data = ordersRes.ok ? await ordersRes.json().catch(() => ({})) : null;
          const ordersList = Array.isArray(data?.data) ? (data.data as Record<string, unknown>[]) : [];
          if (ordersList.length === 0) break;
          let added = 0;
          for (const ord of ordersList) {
            const idKey = String(ord.id || ord.order_id || ord.channel_order_id || '');
            if (!idKey) continue;
            if (!accountRecordsMap.has(idKey)) {
              accountRecordsMap.set(idKey, ord);
              added++;
            }
          }
          // The date-filtered list repeats rows heavily (one id was observed 5x within 10 rows),
          // so a single page of pure duplicates does not mean the end of the data. Tolerate a
          // couple of barren pages before giving up on this status bucket.
          if (added === 0) {
            barrenPages++;
            if (barrenPages >= 3) break;
          } else {
            barrenPages = 0;
          }
          page++;
        }
      }
      // 2. Fetch from /shipments endpoint as well (often captures fulfilled historical shipments)
      // This endpoint wants `YYYY-MM-DD` -- not the `DD-MMM-YYYY` that /orders requires -- and
      // rejects any window wider than 30 days, so walk the span in slices.
      try {
        // Sweeping the whole requested span in 30-day slices would mean ~135 requests per account
        // for a 2015-onwards full sync, nearly all against empty windows. The orders just fetched
        // carry `created_at`, so start the sweep at the earliest order seen (with a month of
        // margin) instead. With no orders at all, fall back to the last 12 months.
        let shipFromIso = effFromIso;
        const seenDates = Array.from(accountRecordsMap.values())
          .map((r) => parseSrListDate(r.created_at))
          .filter((d) => d.length === 10)
          .sort();
        if (seenDates.length > 0) {
          const earliest = new Date(`${seenDates[0]}T00:00:00Z`);
          earliest.setUTCDate(earliest.getUTCDate() - 30);
          const margined = earliest.toISOString().slice(0, 10);
          shipFromIso = margined > effFromIso ? margined : effFromIso;
        } else if (!period.from) {
          const yearAgo = new Date();
          yearAgo.setUTCFullYear(yearAgo.getUTCFullYear() - 1);
          shipFromIso = yearAgo.toISOString().slice(0, 10);
        }
        const windows = splitIntoWindows(shipFromIso, effToIso);
        for (const win of windows) {
          let shipPage = 1;
          let barrenShipPages = 0;
          while (shipPage <= MAX_PAGES_TO_FETCH) {
            const shipParams = new URLSearchParams();
            shipParams.set('page', String(shipPage));
            shipParams.set('per_page', '100');
            shipParams.set('from', toShipmentsDate(win.from));
            shipParams.set('to', toShipmentsDate(win.to));
            const shipRes = await fetch(
              `https://apiv2.shiprocket.in/v1/external/shipments?${shipParams.toString()}`,
              {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`,
                },
              }
            );
            if (!shipRes.ok) break;
            const shipData = await shipRes.json().catch(() => ({}));
            const shipList = Array.isArray(shipData?.data) ? (shipData.data as Record<string, unknown>[]) : [];
            if (shipList.length === 0) break;
            let added = 0;
            for (const ship of shipList) {
              const idKey = String(ship.order_id || ship.id || ship.shipment_id || '');
              if (!idKey) continue;
              if (!accountRecordsMap.has(idKey)) {
                accountRecordsMap.set(idKey, ship);
                added++;
              }
            }
            if (added === 0) {
              barrenShipPages++;
              if (barrenShipPages >= 3) break;
            } else {
              barrenShipPages = 0;
            }
            shipPage++;
          }
        }
      } catch (shipFetchErr) {
        console.warn('Shipments fetch fallback error:', shipFetchErr);
      }
      const allAccountRecords = Array.from(accountRecordsMap.values());
      totalOrdersSeen += allAccountRecords.length;
      ordersSeenInAccount = allAccountRecords.length;
      for (const order of allAccountRecords) {
        const others = (order.others || {}) as Record<string, unknown>;
        const customerObj = (order.customer || {}) as Record<string, unknown>;
        const primaryShipment = Array.isArray(order.shipments) && order.shipments.length > 0 ? (order.shipments[0] as Record<string, unknown>) : null;
        // Attempt initial phone extraction from order list record
        let finalPhone = extractPhoneFromObject(order);
        let finalPincode = extractPincodeFromObject(order);
        let resolvedOrder = order;
        // Records from /shipments carry the *shipment* id in `id` and the real order id in
        // `order_id`; /orders/show only accepts the latter, so prefer it. Records from /orders
        // have no `order_id` and fall back to `id`.
        const orderIdToFetch = order.order_id || order.id;
        // /shipments rows carry no address at all, and the date-filtered /orders list returns
        // `customer_address: "Not Authorized"` for every order -- only /orders/show has the real
        // street address. So fetch detail unless we already hold a full set of real values.
        const listAddress = firstReal(order.customer_address, order.billing_address, order.shipping_address);
        if ((!finalPhone || !finalPincode || !listAddress) && orderIdToFetch) {
          try {
            const detailRes = await fetch(
              `https://apiv2.shiprocket.in/v1/external/orders/show/${orderIdToFetch}`,
              {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`,
                },
              }
            );
            if (detailRes.ok) {
              const detailData = await detailRes.json();
              const unwrapped =
                (detailData?.data && typeof detailData.data === 'object' ? (detailData.data as Record<string, unknown>) : null) ||
                (detailData?.order && typeof detailData.order === 'object' ? (detailData.order as Record<string, unknown>) : null) ||
                (detailData && typeof detailData === 'object' ? (detailData as Record<string, unknown>) : null);
              if (unwrapped) {
                resolvedOrder = unwrapped;
                const detailPhone = extractPhoneFromObject(unwrapped);
                if (detailPhone) finalPhone = detailPhone;
                const detailPin = extractPincodeFromObject(unwrapped);
                if (detailPin) finalPincode = detailPin;
              }
            }
          } catch (fetchErr) {
            console.warn('Failed to fetch full order details for', order.id, fetchErr);
          }
        }
          const resOthers = (resolvedOrder.others || {}) as Record<string, unknown>;
          const resCustomerObj = (resolvedOrder.customer || {}) as Record<string, unknown>;
          // Resolve customer name
          const finalName = firstReal(
            resolvedOrder.customer_name,
            resolvedOrder.billing_customer_name,
            resolvedOrder.shipping_customer_name,
            resCustomerObj.name,
            resCustomerObj.first_name,
            resolvedOrder.billing_name,
            resolvedOrder.shipping_name,
            resOthers.billing_customer_name,
            order.customer_name,
            order.billing_customer_name,
            order.shipping_customer_name,
            customerObj.name,
            customerObj.first_name
          ) || 'Customer';
          // Resolve street address
          const finalRawAddress = firstReal(
            resolvedOrder.customer_address,
            resolvedOrder.billing_address,
            resolvedOrder.shipping_address,
            resolvedOrder.address,
            resCustomerObj.address,
            resCustomerObj.billing_address,
            resOthers.billing_address,
            resOthers.shipping_address,
            resOthers.address,
            order.customer_address,
            order.billing_address,
            order.shipping_address,
            order.address,
            customerObj.address,
            customerObj.billing_address,
            others.billing_address,
            others.shipping_address,
            primaryShipment?.address
          );
          const finalCity = firstReal(
            resolvedOrder.customer_city,
            resolvedOrder.billing_city,
            resolvedOrder.shipping_city,
            resolvedOrder.city,
            resCustomerObj.city,
            resOthers.billing_city,
            resOthers.shipping_city,
            order.customer_city,
            order.billing_city,
            order.shipping_city,
            order.city,
            customerObj.city
          ) || '—';
          const finalState = firstReal(
            resolvedOrder.customer_state,
            resolvedOrder.billing_state,
            resolvedOrder.shipping_state,
            resolvedOrder.state,
            resCustomerObj.state,
            resOthers.billing_state,
            resOthers.shipping_state,
            order.customer_state,
            order.billing_state,
            order.shipping_state,
            order.state,
            customerObj.state
          ) || '—';
          const finalAddress = finalRawAddress || (finalCity !== '—' || finalState !== '—' ? `${finalCity}, ${finalState}` : '');
          const orderIdentifier = String(resolvedOrder.id || resolvedOrder.order_id || resolvedOrder.channel_order_id || order.id || '');
          // /orders/show masks the buyer phone; GET /shipments/{shipment_id} exposes it under
          // customer_details, but only for API users granted "Buyer's Details Access". Consult it
          // only while a phone is still missing, and stop after the first denial on this account.
          const shipmentIdForDetails = order.id || primaryShipment?.id;
          if (!finalPhone && buyerDetailsAllowed !== false && shipmentIdForDetails) {
            try {
              const cdRes = await fetch(
                `https://apiv2.shiprocket.in/v1/external/shipments/${shipmentIdForDetails}`,
                {
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`,
                  },
                }
              );
              if (cdRes.ok) {
                const cdData = await cdRes.json().catch(() => ({}));
                const cdPayload = (cdData?.data ?? cdData) as Record<string, unknown>;
                const details = (Array.isArray(cdPayload) ? cdPayload[0] : cdPayload)?.customer_details as
                  | Record<string, unknown>
                  | undefined;
                if (details) {
                  const rawCdPhone = details.phone;
                  // A sentinel here means the permission is off; record that and stop asking.
                  if (isPiiSentinel(typeof rawCdPhone === 'string' ? rawCdPhone : null)) {
                    if (buyerDetailsAllowed === null) buyerDetailsAllowed = false;
                  } else {
                    const cdPhone = cleanPhone(String(rawCdPhone ?? ''));
                    if (cdPhone.length >= 10) {
                      finalPhone = cdPhone;
                      buyerDetailsAllowed = true;
                    }
                  }
                }
              }
            } catch (cdErr) {
              console.warn('Shipment customer_details fetch error:', cdErr);
            }
          }
          // Identity is normalized name + pincode, so both must be present to build a key.
          // 'Customer' is the placeholder the extractor falls back to, not a real name -- treating
          // it as one would collapse every unnamed order in a pincode into a single record.
          const normalizedName = cleanName(finalName);
          if (!normalizedName || normalizedName === 'customer' || !finalPincode) {
            skippedOrdersInAccount++;
            if (skipReasons.length < 3) {
              skipReasons.push(
                `Order #${orderIdentifier} missing customer name or pincode (available keys: ${Object.keys(resolvedOrder).slice(0, 10).join(', ')})`
              );
            }
            continue;
          }
          // Phone is stored when genuinely available but is no longer part of the identity key.
          const effectivePhone = finalPhone;
          const effectivePincode = finalPincode;
          const dedupKey = buildDedupKey(finalName, effectivePincode);
          const rawEmail =
            resolvedOrder.customer_email ||
            resolvedOrder.billing_email ||
            resolvedOrder.shipping_email ||
            resolvedOrder.email ||
            resCustomerObj.email ||
            resOthers.billing_email ||
            order.customer_email ||
            order.billing_email;
          // Shiprocket returns the seller's own address-book email in `customer_email` for these
          // orders, so discard anything that matches the account or its pickup address rather than
          // storing the merchant's address as every customer's email.
          const sellerEmails = new Set(
            [
              acc.api_email,
              acc.contact_email,
              (resolvedOrder.pickup_address as Record<string, unknown> | undefined)?.email,
              (resOthers.pickup_address as Record<string, unknown> | undefined)?.email,
            ]
              .filter((e): e is string => typeof e === 'string' && e.length > 0)
              .map((e) => e.toLowerCase().trim())
          );
          const candidateEmail = rawEmail ? String(rawEmail).trim() : '';
          const isSellerOrPlaceholder =
            !candidateEmail ||
            sellerEmails.has(candidateEmail.toLowerCase()) ||
            /@shiprocket\.com$/i.test(candidateEmail) ||
            candidateEmail.toLowerCase().startsWith('noreply@');
          const email = isSellerOrPlaceholder ? null : candidateEmail;
          const address2 = firstReal(
            resolvedOrder.customer_address_2,
            resolvedOrder.billing_address_2,
            resolvedOrder.shipping_address_2,
            order.customer_address_2,
            order.billing_address_2
          ) || null;
          // Secondary contact number, when the API exposes one that differs from the primary.
          // Shiprocket carries it as *_alternate_phone; a shipping phone that differs from the
          // billing/customer phone is also effectively a second contact for the same buyer.
          const altCandidates: unknown[] = [
            resolvedOrder.customer_alternate_phone,
            resolvedOrder.billing_alternate_phone,
            resolvedOrder.shipping_alternate_phone,
            resolvedOrder.alternate_phone,
            resOthers.billing_alternate_phone,
            resOthers.alternate_phone,
            resCustomerObj.alternate_phone,
            order.customer_alternate_phone,
            order.billing_alternate_phone,
            others.billing_alternate_phone,
            resolvedOrder.shipping_phone,
            order.shipping_phone,
          ];
          let altPhone = '';
          for (const candidate of altCandidates) {
            if (candidate === null || candidate === undefined) continue;
            const cleaned = cleanPhone(String(candidate));
            if (cleaned.length >= 10 && cleaned !== effectivePhone) {
              altPhone = cleaned;
              break;
            }
          }
          const effectivePhone2 = altPhone || null;
          const orderId = String(resolvedOrder.id || resolvedOrder.order_id || order.id || '');
          const orderDate = (resolvedOrder.created_at || order.created_at) ? new Date(String(resolvedOrder.created_at || order.created_at)).toISOString() : null;
          const custId = `cust_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          try {
            await sql`
              INSERT INTO shiprocket_customers (
                id, customer_name, customer_phone, customer_phone_2, customer_email,
                customer_address, customer_address_2, customer_city, customer_state, customer_pincode,
                dedup_key, source_account_ids, total_orders, last_order_id, last_order_date, created_at, updated_at
              ) VALUES (
                ${custId}, ${finalName}, ${effectivePhone}, ${effectivePhone2}, ${email},
                ${finalAddress || 'Address on file'}, ${address2}, ${finalCity}, ${finalState}, ${effectivePincode},
                ${dedupKey}, ARRAY[${accSourceId}]::TEXT[], 1, ${orderId}, ${orderDate}, NOW(), NOW()
              )
              ON CONFLICT (dedup_key) DO UPDATE SET
                customer_name = CASE WHEN EXCLUDED.customer_name != 'Customer' THEN EXCLUDED.customer_name ELSE shiprocket_customers.customer_name END,
                customer_phone = CASE WHEN COALESCE(EXCLUDED.customer_phone, '') <> '' THEN EXCLUDED.customer_phone ELSE shiprocket_customers.customer_phone END,
                customer_phone_2 = COALESCE(EXCLUDED.customer_phone_2, shiprocket_customers.customer_phone_2),
                customer_email = COALESCE(EXCLUDED.customer_email, shiprocket_customers.customer_email),
                customer_address = CASE WHEN EXCLUDED.customer_address != 'Address on file' THEN EXCLUDED.customer_address ELSE shiprocket_customers.customer_address END,
                customer_address_2 = COALESCE(EXCLUDED.customer_address_2, shiprocket_customers.customer_address_2),
                customer_city = EXCLUDED.customer_city,
                customer_state = EXCLUDED.customer_state,
                source_account_ids = CASE
                  WHEN NOT (${accSourceId} = ANY(shiprocket_customers.source_account_ids))
                  THEN array_append(shiprocket_customers.source_account_ids, ${accSourceId})
                  ELSE shiprocket_customers.source_account_ids
                END,
                last_order_id = COALESCE(EXCLUDED.last_order_id, shiprocket_customers.last_order_id),
                last_order_date = GREATEST(COALESCE(EXCLUDED.last_order_date, '1970-01-01'::timestamptz), COALESCE(shiprocket_customers.last_order_date, '1970-01-01'::timestamptz)),
                updated_at = NOW()
            `;
            // Record this order against the customer. The primary key makes re-syncing an
            // overlapping period a no-op rather than another increment of total_orders.
            if (orderId) {
              await sql`
                INSERT INTO shiprocket_customer_orders (dedup_key, account_id, order_id, order_date)
                VALUES (${dedupKey}, ${accSourceId}, ${orderId}, ${orderDate})
                ON CONFLICT (dedup_key, account_id, order_id) DO NOTHING
              `;
            }
            totalUpserted++;
          } catch (upsertErr) {
            console.error('Customer upsert error:', upsertErr);
            errors.push(`Customer upsert failed for order #${orderId}: ${upsertErr instanceof Error ? upsertErr.message : String(upsertErr)}`);
        }
      }
      if (ordersSeenInAccount === 0) {
        errors.push(`Account '${acc.account_label}' returned 0 orders.`);
      } else if (skippedOrdersInAccount > 0) {
        errors.push(`Account '${acc.account_label}': skipped ${skippedOrdersInAccount} order(s) due to missing phone/pincode. Details: ${skipReasons.join(' | ')}`);
      }
      accountsProcessed++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error during order sync';
      errors.push(`Account '${acc.account_label}': ${msg}`);
    }
  }
  // Derive total_orders from the distinct linked orders instead of incrementing per pass, so
  // re-syncing an overlapping period is idempotent.
  //
  // A full sync (no date filter) has seen every order, so its derived count is authoritative and
  // can correct counts in either direction -- including ones inflated by pre-fix syncs. A ranged
  // sync has only seen a slice, so it may only raise a count, never lower it; otherwise syncing a
  // single month would clobber a customer's full history with that month's total.
  const isFullSync = !period.from && !period.to;
  let countsCorrected = 0;
  try {
    const corrected = (await (isFullSync
      ? sql`
        UPDATE shiprocket_customers c
        SET total_orders = GREATEST(1, sub.cnt), updated_at = NOW()
        FROM (
          SELECT dedup_key, COUNT(*)::int AS cnt
          FROM shiprocket_customer_orders
          GROUP BY dedup_key
        ) sub
        WHERE c.dedup_key = sub.dedup_key
          AND c.total_orders <> GREATEST(1, sub.cnt)
        RETURNING c.id
      `
      : sql`
        UPDATE shiprocket_customers c
        SET total_orders = GREATEST(1, sub.cnt), updated_at = NOW()
        FROM (
          SELECT dedup_key, COUNT(*)::int AS cnt
          FROM shiprocket_customer_orders
          GROUP BY dedup_key
        ) sub
        WHERE c.dedup_key = sub.dedup_key
          AND GREATEST(1, sub.cnt) > c.total_orders
        RETURNING c.id
      `)) as Array<{ id: string }>;
    countsCorrected = corrected.length;
  } catch (recalcErr) {
    errors.push(
      `Order-count recalculation failed: ${recalcErr instanceof Error ? recalcErr.message : String(recalcErr)}`
    );
  }
  await invalidateShiprocketCustomersCache();
  return {
    success: true,
    message: `Processed ${accountsProcessed} account(s) (${totalOrdersSeen} orders inspected). Synced/updated ${totalUpserted} customer records.${countsCorrected > 0 ? ` Corrected order counts on ${countsCorrected} record(s).` : ''}`,
    totalSynced: totalUpserted,
    accountsProcessed,
    errors: errors.length > 0 ? errors : undefined,
  };
}

