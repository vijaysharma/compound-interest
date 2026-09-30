'use server';
import { ensureTables, getDb, isAuthorizedUser } from '@/lib/db';
import type { DbShiprocketAccount, DbShiprocketCustomer } from '@/lib/db/types';
import type { ShiprocketCustomer } from '@/types/shiprocket';
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
  let totalOrdersSeen = 0;
  const errors: string[] = [];
  // Helper function to extract any mobile/phone number from an arbitrary record
  const extractPhoneFromObject = (obj: unknown, depth = 0): string => {
    if (!obj || typeof obj !== 'object' || depth > 3) return '';
    const rec = obj as Record<string, unknown>;
    // Priority keys
    const directKeys = [
      'customer_phone',
      'customer_mobile',
      'customer_mobile_number',
      'billing_phone',
      'billing_mobile',
      'billing_mobile_number',
      'shipping_phone',
      'shipping_mobile',
      'shipping_mobile_number',
      'pickup_phone',
      'pickup_mobile',
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
    // Check nested objects
    const nestedKeys = ['customer', 'customer_details', 'billing_address', 'shipping_address', 'others', 'pickup_address_detail', 'billing', 'shipping', 'address'];
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
    const directKeys = [
      'customer_pincode',
      'billing_pincode',
      'shipping_pincode',
      'pickup_pincode',
      'pincode',
      'pin_code',
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
    const nestedKeys = ['customer', 'customer_details', 'billing_address', 'shipping_address', 'others', 'pickup_address_detail', 'billing', 'shipping', 'address'];
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
    try {
      let ordersSeenInAccount = 0;
      let skippedOrdersInAccount = 0;
      const skipReasons: string[] = [];
      const MAX_PAGES_TO_FETCH = 50;
      // Map to deduplicate records seen in this account by unique order identifier or shipment identifier
      const accountRecordsMap = new Map<string, Record<string, unknown>>();
      // 1. Fetch from /orders with all status variations
      // Shiprocket allows filtering by status or leaving empty, but some accounts have orders only under specific status buckets (e.g. ALL, DELIVERED, CANCELED)
      const statusQueries = ['', '&filter_by=ALL', '&status=ALL', '&filter_by=DELIVERED', '&filter_by=IN%20TRANSIT', '&filter_by=CANCELED', '&filter_by=COMPLETED'];
      for (const statusSuffix of statusQueries) {
        let page = 1;
        let totalPages = 1;
        while (page <= totalPages && page <= MAX_PAGES_TO_FETCH) {
          const params = new URLSearchParams();
          params.set('page', String(page));
          params.set('per_page', '100');
          if (period.from) params.set('from', period.from);
          if (period.to) params.set('to', period.to);
          const queryString = `${params.toString()}${statusSuffix}`;
          let ordersRes = await fetch(
            `https://apiv2.shiprocket.in/v1/external/orders?${queryString}`,
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
              },
            }
          );
          let data = ordersRes.ok ? await ordersRes.json().catch(() => ({})) : null;
          let ordersList = Array.isArray(data?.data) ? (data.data as Record<string, unknown>[]) : [];
          // Fallback variant 2: if from/to returned empty or error, try from_date / to_date
          if (ordersList.length === 0 && (period.from || period.to)) {
            const fallbackParams = new URLSearchParams();
            fallbackParams.set('page', String(page));
            fallbackParams.set('per_page', '100');
            if (period.from) fallbackParams.set('from_date', period.from);
            if (period.to) fallbackParams.set('to_date', period.to);
            const fallbackRes = await fetch(
              `https://apiv2.shiprocket.in/v1/external/orders?${fallbackParams.toString()}${statusSuffix}`,
              {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`,
                },
              }
            );
            if (fallbackRes.ok) {
              const fallbackData = await fallbackRes.json().catch(() => ({}));
              const fallbackList = Array.isArray(fallbackData?.data) ? (fallbackData.data as Record<string, unknown>[]) : [];
              if (fallbackList.length > 0) {
                data = fallbackData;
                ordersList = fallbackList;
                ordersRes = fallbackRes;
              }
            }
          }
          // Fallback variant 3: if still 0 records and dates were specified, query without date filter
          if (ordersList.length === 0 && page === 1 && (period.from || period.to)) {
            const noDateRes = await fetch(
              `https://apiv2.shiprocket.in/v1/external/orders?page=1&per_page=100${statusSuffix}`,
              {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`,
                },
              }
            );
            if (noDateRes.ok) {
              const noDateData = await noDateRes.json().catch(() => ({}));
              const noDateList = Array.isArray(noDateData?.data) ? (noDateData.data as Record<string, unknown>[]) : [];
              if (noDateList.length > 0) {
                data = noDateData;
                ordersList = noDateList;
                ordersRes = noDateRes;
              }
            }
          }
          if (ordersList.length > 0) {
            for (const ord of ordersList) {
              const idKey = String(ord.id || ord.order_id || ord.channel_order_id || Math.random());
              if (!accountRecordsMap.has(idKey)) {
                accountRecordsMap.set(idKey, ord);
              }
            }
          }
          // Detect total pages
          const metaPagination = data?.meta?.pagination;
          const metaTotalPages = data?.meta?.total_pages;
          const directTotalPages = data?.pagination?.total_pages || data?.total_pages;
          if (metaPagination?.total_pages) {
            totalPages = Math.max(totalPages, Number(metaPagination.total_pages));
          } else if (metaTotalPages) {
            totalPages = Math.max(totalPages, Number(metaTotalPages));
          } else if (directTotalPages) {
            totalPages = Math.max(totalPages, Number(directTotalPages));
          } else if (ordersList.length >= 100) {
            totalPages = Math.max(totalPages, page + 1);
          } else {
            break;
          }
          page++;
        }
      }
      // 2. Fetch from /shipments endpoint as well (often captures fulfilled historical shipments)
      try {
        let shipPage = 1;
        let shipTotalPages = 1;
        while (shipPage <= shipTotalPages && shipPage <= MAX_PAGES_TO_FETCH) {
          const shipParams = new URLSearchParams();
          shipParams.set('page', String(shipPage));
          shipParams.set('per_page', '100');
          if (period.from) shipParams.set('from', period.from);
          if (period.to) shipParams.set('to', period.to);
          const shipRes = await fetch(
            `https://apiv2.shiprocket.in/v1/external/shipments?${shipParams.toString()}`,
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
              },
            }
          );
          if (shipRes.ok) {
            const shipData = await shipRes.json().catch(() => ({}));
            const shipList = Array.isArray(shipData?.data) ? (shipData.data as Record<string, unknown>[]) : [];
            for (const ship of shipList) {
              const idKey = String(ship.order_id || ship.id || ship.shipment_id || Math.random());
              if (!accountRecordsMap.has(idKey)) {
                accountRecordsMap.set(idKey, ship);
              }
            }
            const sMetaPages = shipData?.meta?.pagination?.total_pages || shipData?.meta?.total_pages || shipData?.total_pages;
            if (sMetaPages) {
              shipTotalPages = Math.max(shipTotalPages, Number(sMetaPages));
            } else if (shipList.length >= 100) {
              shipTotalPages = Math.max(shipTotalPages, shipPage + 1);
            } else {
              break;
            }
          } else {
            break;
          }
          shipPage++;
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
        const orderIdToFetch = order.id || order.order_id;
        // If phone is missing from list view, fetch full order detail via /orders/show/{id}
        if (!finalPhone && orderIdToFetch) {
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
          const finalName = String(
            resolvedOrder.customer_name ||
            resolvedOrder.billing_customer_name ||
            resolvedOrder.shipping_customer_name ||
            resCustomerObj.name ||
            resCustomerObj.first_name ||
            resolvedOrder.billing_name ||
            resolvedOrder.shipping_name ||
            resOthers.billing_customer_name ||
            order.customer_name ||
            order.billing_customer_name ||
            order.shipping_customer_name ||
            customerObj.name ||
            customerObj.first_name ||
            'Customer'
          ).trim();
          // Resolve street address
          const finalRawAddress = String(
            resolvedOrder.customer_address ||
            resolvedOrder.billing_address ||
            resolvedOrder.shipping_address ||
            resolvedOrder.address ||
            resCustomerObj.address ||
            resCustomerObj.billing_address ||
            resOthers.billing_address ||
            resOthers.shipping_address ||
            resOthers.address ||
            order.customer_address ||
            order.billing_address ||
            order.shipping_address ||
            order.address ||
            customerObj.address ||
            customerObj.billing_address ||
            others.billing_address ||
            others.shipping_address ||
            primaryShipment?.address ||
            ''
          ).trim();
          const finalCity = String(
            resolvedOrder.customer_city ||
            resolvedOrder.billing_city ||
            resolvedOrder.shipping_city ||
            resolvedOrder.city ||
            resCustomerObj.city ||
            resOthers.billing_city ||
            resOthers.shipping_city ||
            order.customer_city ||
            order.billing_city ||
            order.shipping_city ||
            order.city ||
            customerObj.city ||
            '—'
          ).trim() || '—';
          const finalState = String(
            resolvedOrder.customer_state ||
            resolvedOrder.billing_state ||
            resolvedOrder.shipping_state ||
            resolvedOrder.state ||
            resCustomerObj.state ||
            resOthers.billing_state ||
            resOthers.shipping_state ||
            order.customer_state ||
            order.billing_state ||
            order.shipping_state ||
            order.state ||
            customerObj.state ||
            '—'
          ).trim() || '—';
          const finalAddress = finalRawAddress || (finalCity !== '—' || finalState !== '—' ? `${finalCity}, ${finalState}` : '');
          const orderIdentifier = String(resolvedOrder.id || resolvedOrder.order_id || resolvedOrder.channel_order_id || order.id || '');
          // Strictly require at least phone or pincode to construct dedup key
          if (!finalPhone && !finalPincode) {
            skippedOrdersInAccount++;
            if (skipReasons.length < 3) {
              skipReasons.push(
                `Order #${orderIdentifier} missing both phone and pincode (available keys: ${Object.keys(resolvedOrder).slice(0, 10).join(', ')})`
              );
            }
            continue;
          }
          // Use extracted phone if available; if only pincode was present, fall back to order id identifier
          const effectivePhone = finalPhone || `sr_${orderIdentifier}`;
          const effectivePincode = finalPincode || '000000';
          const dedupKey = `${effectivePhone}_${effectivePincode}`;
          const rawEmail =
            resolvedOrder.customer_email ||
            resolvedOrder.billing_email ||
            resolvedOrder.shipping_email ||
            resolvedOrder.email ||
            resCustomerObj.email ||
            resOthers.billing_email ||
            order.customer_email ||
            order.billing_email;
          const email = rawEmail ? String(rawEmail).trim() : null;
          const rawAddress2 =
            resolvedOrder.customer_address_2 ||
            resolvedOrder.billing_address_2 ||
            resolvedOrder.shipping_address_2 ||
            order.customer_address_2 ||
            order.billing_address_2;
          const address2 = rawAddress2 ? String(rawAddress2).trim() : null;
          const orderId = String(resolvedOrder.id || resolvedOrder.order_id || order.id || '');
          const orderDate = (resolvedOrder.created_at || order.created_at) ? new Date(String(resolvedOrder.created_at || order.created_at)).toISOString() : null;
          const custId = `cust_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          try {
            await sql`
              INSERT INTO shiprocket_customers (
                id, customer_name, customer_phone, customer_email,
                customer_address, customer_address_2, customer_city, customer_state, customer_pincode,
                dedup_key, source_account_ids, total_orders, last_order_id, last_order_date, created_at, updated_at
              ) VALUES (
                ${custId}, ${finalName}, ${effectivePhone}, ${email},
                ${finalAddress || 'Address on file'}, ${address2}, ${finalCity}, ${finalState}, ${effectivePincode},
                ${dedupKey}, ARRAY[${acc.id}]::TEXT[], 1, ${orderId}, ${orderDate}, NOW(), NOW()
              )
              ON CONFLICT (dedup_key) DO UPDATE SET
                customer_name = CASE WHEN EXCLUDED.customer_name != 'Customer' THEN EXCLUDED.customer_name ELSE shiprocket_customers.customer_name END,
                customer_phone = CASE WHEN EXCLUDED.customer_phone NOT LIKE 'sr_%' THEN EXCLUDED.customer_phone ELSE shiprocket_customers.customer_phone END,
                customer_email = COALESCE(EXCLUDED.customer_email, shiprocket_customers.customer_email),
                customer_address = CASE WHEN EXCLUDED.customer_address != 'Address on file' THEN EXCLUDED.customer_address ELSE shiprocket_customers.customer_address END,
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
  return {
    success: true,
    message: `Processed ${accountsProcessed} account(s) (${totalOrdersSeen} orders inspected). Synced/updated ${totalUpserted} customer records.`,
    totalSynced: totalUpserted,
    accountsProcessed,
    errors: errors.length > 0 ? errors : undefined,
  };
}
