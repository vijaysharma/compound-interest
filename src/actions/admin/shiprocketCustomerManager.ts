/**
 * Compound Interest Calculator - Admin Panel
 * Shiprocket Customer Management
 *
 * Governance & Safety Rules:
 * - Zero Secret Leakage: No .env values, API keys, or credentials are logged
 * - Financial Calculation Integrity: Calculation logic is inviolable - only UI/UX fixes permitted
 * - Untrusted Inputs: All API responses are treated as untrusted data
 */

'use server';

import { ensureTables, getDb, isAuthorizedUser } from '@/lib/db';
import type { DbShiprocketAccount, DbShiprocketCustomer } from '@/lib/db/types';
import type { ShiprocketCustomer } from '@/types/shiprocket';
import {
  withShiprocketCache,
  invalidateShiprocketCustomersCache,
  SR_CACHE_TTL,
} from '@/lib/shiprocketCache';

// Maximum number of orders to process per sync batch
const ORDERS_PER_BATCH = 20;
const MAX_PAGES_PER_BATCH = 5;

/**
 * Sync Progress Status types
 */
export type SyncJobStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

export interface SyncProgress {
  id: string;
  job_type: string;
  status: SyncJobStatus;
  total_items: number;
  processed_items: number;
  errors: string[];
  updated_at: string;
}

/**
 * Unified sync action: starts a job or processes the next batch
 * - Call without jobId to start a new sync (returns jobId)
 * - Call with jobId to process next batch (returns updated progress)
 */
export async function syncHistoricalCustomersAction(
  period: { from?: string; to?: string; jobId?: string },
  token?: string | null
): Promise<{ jobId: string; status?: SyncJobStatus; processed_items?: number; errors?: string[] }> {
  const sql = getDb();
  await ensureTables(sql);

  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }

  // If jobId provided, process next batch
  if (period.jobId) {
    const progress = await processSyncBatch(period.jobId, period, token);
    return {
      jobId: progress.id,
      status: progress.status,
      processed_items: progress.processed_items,
      errors: progress.errors,
    };
  }

  // Otherwise, start new sync job
  const jobId = `sync_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  await sql`
    INSERT INTO sync_progress (id, job_type, status, total_items, processed_items, errors, updated_at)
    VALUES (${jobId}, 'historical_sync', 'pending', 1, 0, ARRAY[]::text[], NOW())
  `;

  return { jobId };
}

/**
 * Process one batch of orders for a sync job.
 * Called repeatedly by the client until status is 'completed' or 'failed'.
 */
export async function processSyncBatch(
  jobId: string,
  period: { from?: string; to?: string },
  token?: string | null
): Promise<SyncProgress> {
  const sql = getDb();
  await ensureTables(sql);

  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }

  // Check job exists
  const existing = (await sql`
    SELECT * FROM sync_progress WHERE id = ${jobId}
  `) as unknown as SyncProgress[];

  if (existing.length === 0) {
    throw new Error('Sync job not found');
  }

  const job = existing[0];

  // If already completed/cancelled, return as-is
  if (job.status === 'completed' || job.status === 'cancelled' || job.status === 'failed') {
    return job;
  }

  let upsertedThisBatch = 0;
  let skippedCount = 0;
  const errors: string[] = [...job.errors];

  try {
    // Fetch all accounts
    const accounts = (await sql`
      SELECT
        id, account_label, company_name, contact_name, contact_phone, contact_email,
        api_email, api_password, auth_token, token_expires_at, sr_user_id, sr_company_id,
        sr_first_name, sr_last_name, is_active, balance, created_at, updated_at
      FROM shiprocket_accounts
    `) as Array<DbShiprocketAccount>;

    if (accounts.length === 0) {
      errors.push('No Shiprocket accounts configured.');
      throw new Error('No Shiprocket accounts configured.');
    }

    // Process each account, fetching and upserting up to ORDERS_PER_BATCH records
    accountLoop: for (const acc of accounts) {
      const authToken = acc.auth_token;
      if (!authToken) {
        errors.push(`Account '${acc.account_label}' has no valid auth token.`);
        continue;
      }

      const effFromIso = (period.from || '2015-01-01').slice(0, 10);
      const effToIso = (period.to || new Date().toISOString().slice(0, 10)).slice(0, 10);
      const ordersFrom = toOrdersDate(effFromIso);
      const ordersTo = toOrdersDate(effToIso);

      // Fetch orders with ONE pass (minimal API calls)
      let page = 1;
      let barrenPages = 0;

      while (page <= MAX_PAGES_PER_BATCH && upsertedThisBatch < ORDERS_PER_BATCH) {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('per_page', '100');
        if (ordersFrom) params.set('from', ordersFrom);
        if (ordersTo) params.set('to', ordersTo);
        params.append('filter_by', 'ALL');

        try {
          const ordersRes = await fetch(
            `https://apiv2.shiprocket.in/v1/external/orders?${params.toString()}`,
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
              },
            }
          );

          const data = ordersRes.ok ? await ordersRes.json().catch(() => ({})) : {};
          const ordersList = Array.isArray(data?.data) ? (data.data as Record<string, unknown>[]) : [];

          console.log(`[Sync] Account ${acc.account_label}, page ${page}: fetched ${ordersList.length} orders (HTTP ${ordersRes.status})`);

          if (ordersList.length === 0) {
            barrenPages++;
            if (barrenPages >= 2) break; // Stop after 2 empty pages
          } else {
            barrenPages = 0;

            // Process and upsert each order immediately
            for (const order of ordersList) {
              if (upsertedThisBatch >= ORDERS_PER_BATCH) break;

              const customerObj = (order.customer || {}) as Record<string, unknown>;
              const finalName = firstReal(customerObj.customer_name, order.customer_name, 'Unknown');
              const finalPhone = extractPhone(order);
              const finalPincode = extractPincode(order);
              const finalAddress = firstReal(order.customer_address, order.billing_address, order.shipping_address, '');
              const finalCity = firstReal(customerObj.city, order.city, '');
              const finalState = firstReal(customerObj.state, order.state, '');

              // Debug: log first order's data structure
              if (upsertedThisBatch === 0 && skippedCount === 0) {
                console.log('[Sync] First order sample:', {
                  id: order.id,
                  order_id: order.order_id,
                  finalName,
                  finalPhone,
                  finalPincode,
                  finalAddress: finalAddress.slice(0, 50),
                  finalCity,
                  finalState,
                });
              }

              if (!finalName || !finalAddress || !finalPincode) {
                skippedCount++;
                continue;
              }

              const cleanedName = cleanName(finalName);
              const cleanedPhone = cleanPhone(finalPhone) || 'N/A'; // Schema requires NOT NULL
              const cleanedPin = cleanPincode(finalPincode);

              if (!cleanedName || !cleanedPin) {
                skippedCount++;
                continue;
              }

              try {
                const id = `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
                await sql`
                  INSERT INTO shiprocket_customers (
                    id, dedup_key, customer_name, customer_phone, customer_address,
                    customer_city, customer_state, customer_pincode, created_at, updated_at
                  )
                  VALUES (
                    ${id},
                    ${`${cleanedName}|${cleanedPin}`},
                    ${finalName},
                    ${cleanedPhone},
                    ${finalAddress},
                    ${finalCity},
                    ${finalState},
                    ${cleanedPin},
                    NOW(),
                    NOW()
                  )
                  ON CONFLICT (dedup_key) DO UPDATE SET
                    customer_name = ${finalName},
                    customer_phone = COALESCE(NULLIF(${cleanedPhone}, ''), shiprocket_customers.customer_phone),
                    customer_address = COALESCE(NULLIF(${finalAddress}, ''), shiprocket_customers.customer_address),
                    customer_city = COALESCE(NULLIF(${finalCity}, ''), shiprocket_customers.customer_city),
                    customer_state = COALESCE(NULLIF(${finalState}, ''), shiprocket_customers.customer_state),
                    updated_at = NOW()
                `;
                upsertedThisBatch++;
              } catch (upsertErr) {
                const errMsg = upsertErr instanceof Error ? upsertErr.message : String(upsertErr);
                console.error('Upsert error for customer', finalName, errMsg);
                errors.push(`Upsert failed for ${finalName}: ${errMsg}`);
              }
            }
          }
        } catch (err) {
          console.warn('Fetch error on orders page', page, err);
          break;
        }

        page++;
      }

      if (upsertedThisBatch >= ORDERS_PER_BATCH) break accountLoop;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Batch processing failed';
    errors.push(msg);
  }

  // Update progress: only mark complete if no records were processed this batch (all done)
  const newProcessed = job.processed_items + upsertedThisBatch;
  const newStatus: SyncJobStatus = upsertedThisBatch === 0 ? 'completed' : 'in_progress';

  // Add summary to errors array if we skipped records
  if (skippedCount > 0) {
    errors.push(`Skipped ${skippedCount} orders (missing name/address/pincode)`);
  }
  if (upsertedThisBatch > 0) {
    errors.push(`✓ Processed ${upsertedThisBatch} customer records in this batch`);
  }

  await sql`
    UPDATE sync_progress
    SET status = ${newStatus}, processed_items = ${newProcessed}, errors = ${errors}, updated_at = NOW()
    WHERE id = ${jobId}
  `;

  // Invalidate cache
  if (newStatus === 'completed' || upsertedThisBatch > 0) {
    await invalidateShiprocketCustomersCache();
  }

  return {
    id: jobId,
    job_type: 'historical_sync',
    status: newStatus,
    total_items: job.total_items,
    processed_items: newProcessed,
    errors,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Get current sync progress for a job
 */
export async function getSyncProgress(jobId: string): Promise<SyncProgress> {
  const sql = getDb();
  const progress = (await sql`
    SELECT * FROM sync_progress WHERE id = ${jobId}
  `) as unknown as SyncProgress[];

  if (progress.length === 0) {
    throw new Error('Sync job not found');
  }

  return progress[0];
}

/**
 * Cancel a sync job
 */
export async function cancelSyncJob(jobId: string): Promise<void> {
  const sql = getDb();
  await sql`
    UPDATE sync_progress
    SET status = 'cancelled', updated_at = NOW()
    WHERE id = ${jobId}
  `;
}

/**
 * List customers with pagination, search, and sort
 */
export async function listShiprocketCustomersAction(
  options: {
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    perPage?: number;
  },
  token?: string | null
): Promise<{ success: boolean; customers: ShiprocketCustomer[]; total: number }> {
  const sql = getDb();
  await ensureTables(sql);

  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized');
  }

  const {
    search = '',
    sortBy = 'customer_name',
    sortOrder = 'asc',
    page = 1,
    perPage = 25,
  } = options;

  const offset = (page - 1) * perPage;
  const searchTerm = search ? `%${search}%` : null;

  // Fetch all customers (small list, suitable for in-memory sort)
  const allRows = (await sql`SELECT * FROM shiprocket_customers`) as unknown as DbShiprocketCustomer[];

  // Filter by search term
  let filtered = allRows;
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = allRows.filter(
      (c) =>
        c.customer_name.toLowerCase().includes(term) ||
        c.customer_phone?.toLowerCase().includes(term) ||
        c.customer_email?.toLowerCase().includes(term) ||
        c.customer_address.toLowerCase().includes(term) ||
        c.customer_city.toLowerCase().includes(term) ||
        c.customer_pincode.includes(term)
    );
  }

  const total = filtered.length;

  // Sort in memory
  const sortFn = (a: DbShiprocketCustomer, b: DbShiprocketCustomer) => {
    let aVal: unknown = 0;
    let bVal: unknown = 0;
    const validSort = ['name', 'phone', 'city', 'state', 'pincode', 'orders', 'updated_at', 'created_at'].includes(
      sortBy
    )
      ? sortBy
      : 'name';

    if (validSort === 'name') {
      aVal = a.customer_name;
      bVal = b.customer_name;
    } else if (validSort === 'phone') {
      aVal = a.customer_phone;
      bVal = b.customer_phone;
    } else if (validSort === 'city') {
      aVal = a.customer_city;
      bVal = b.customer_city;
    } else if (validSort === 'state') {
      aVal = a.customer_state;
      bVal = b.customer_state;
    } else if (validSort === 'pincode') {
      aVal = a.customer_pincode;
      bVal = b.customer_pincode;
    } else if (validSort === 'orders') {
      aVal = a.total_orders || 0;
      bVal = b.total_orders || 0;
    } else if (validSort === 'updated_at') {
      aVal = new Date(a.updated_at).getTime();
      bVal = new Date(b.updated_at).getTime();
    } else if (validSort === 'created_at') {
      aVal = new Date(a.created_at).getTime();
      bVal = new Date(b.created_at).getTime();
    }

    const cmp =
      typeof aVal === 'string' && typeof bVal === 'string'
        ? aVal.localeCompare(bVal)
        : Number(aVal) - Number(bVal);

    return sortOrder === 'desc' ? -cmp : cmp;
  };

  filtered.sort(sortFn);
  const customers = filtered.slice(offset, offset + perPage);

  return {
    success: true,
    customers: customers.map(toShiprocketCustomer),
    total,
  };
}

/**
 * Save or update a customer
 */
export async function saveShiprocketCustomerAction(
  customer: Partial<ShiprocketCustomer> & { id?: string },
  token?: string | null
): Promise<{ success: boolean; message: string }> {
  const sql = getDb();
  await ensureTables(sql);

  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized');
  }

  const {
    id,
    customer_name,
    customer_phone,
    customer_email,
    customer_address,
    customer_city,
    customer_state,
    customer_pincode,
  } = customer;

  if (!customer_name || !customer_address || !customer_pincode) {
    throw new Error('Name, address, and pincode are required');
  }

  const cleanedName = cleanName(customer_name);
  const cleanedPin = cleanPincode(customer_pincode);
  const dedupKey = `${cleanedName}|${cleanedPin}`;

  if (id) {
    await sql`
      UPDATE shiprocket_customers
      SET
        customer_name = ${customer_name},
        customer_phone = ${customer_phone || ''},
        customer_email = ${customer_email || ''},
        customer_address = ${customer_address},
        customer_city = ${customer_city || ''},
        customer_state = ${customer_state || ''},
        customer_pincode = ${cleanedPin},
        updated_at = NOW()
      WHERE id = ${id}
    `;
  } else {
    await sql`
      INSERT INTO shiprocket_customers (
        dedup_key, customer_name, customer_phone, customer_email,
        customer_address, customer_city, customer_state, customer_pincode,
        created_at, updated_at
      )
      VALUES (
        ${dedupKey}, ${customer_name}, ${customer_phone || ''}, ${customer_email || ''},
        ${customer_address}, ${customer_city || ''}, ${customer_state || ''}, ${cleanedPin},
        NOW(), NOW()
      )
      ON CONFLICT (dedup_key) DO UPDATE SET
        customer_name = ${customer_name},
        updated_at = NOW()
    `;
  }

  await invalidateShiprocketCustomersCache();
  return { success: true, message: id ? 'Customer updated' : 'Customer created' };
}

/**
 * Delete a customer
 */
export async function deleteShiprocketCustomerAction(
  id: string,
  token?: string | null
): Promise<{ success: boolean; message: string }> {
  const sql = getDb();
  await ensureTables(sql);

  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized');
  }

  await sql`DELETE FROM shiprocket_customers WHERE id = ${id}`;
  await invalidateShiprocketCustomersCache();

  return { success: true, message: 'Customer deleted' };
}

/**
 * Merge two customers
 */
export async function mergeShiprocketCustomersAction(
  params: {
    sourceCustomerId: string;
    targetCustomerId: string;
    finalCustomer: Partial<ShiprocketCustomer>;
  },
  token?: string | null
): Promise<{ success: boolean; message: string }> {
  const sql = getDb();
  await ensureTables(sql);

  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized');
  }

  const { sourceCustomerId, targetCustomerId, finalCustomer } = params;

  // Update target with merged data
  await sql`
    UPDATE shiprocket_customers
    SET
      customer_name = ${finalCustomer.customer_name || ''},
      customer_phone = ${finalCustomer.customer_phone || ''},
      customer_email = ${finalCustomer.customer_email || ''},
      customer_address = ${finalCustomer.customer_address || ''},
      customer_city = ${finalCustomer.customer_city || ''},
      customer_state = ${finalCustomer.customer_state || ''},
      customer_pincode = ${finalCustomer.customer_pincode || ''},
      updated_at = NOW()
    WHERE id = ${targetCustomerId}
  `;

  // Delete source
  await sql`DELETE FROM shiprocket_customers WHERE id = ${sourceCustomerId}`;

  await invalidateShiprocketCustomersCache();
  return { success: true, message: 'Customers merged successfully' };
}

// ============================================================================
// HELPERS
// ============================================================================

function toShiprocketCustomer(row: DbShiprocketCustomer): ShiprocketCustomer {
  const cleanedName = cleanName(row.customer_name);
  const cleanedPin = cleanPincode(row.customer_pincode);
  return {
    id: row.id,
    dedup_key: `${cleanedName}|${cleanedPin}`,
    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
    customer_phone_2: row.customer_phone_2,
    customer_email: row.customer_email,
    customer_address: row.customer_address,
    customer_address_2: row.customer_address_2,
    customer_city: row.customer_city,
    customer_state: row.customer_state,
    customer_pincode: row.customer_pincode,
    total_orders: row.total_orders || 0,
    last_order_id: row.last_order_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function extractPhone(obj: Record<string, unknown>): string {
  const candidates = [
    obj.customer_phone,
    obj.phone,
    (obj.customer as Record<string, unknown>)?.phone,
  ];
  for (const c of candidates) {
    const ph = cleanPhone(String(c));
    if (ph) return ph;
  }
  return '';
}

function extractPincode(obj: Record<string, unknown>): string {
  const candidates = [
    obj.customer_pincode,
    obj.pincode,
    (obj.customer as Record<string, unknown>)?.pincode,
    obj.shipping_postcode,
  ];
  for (const c of candidates) {
    const pc = cleanPincode(String(c));
    if (pc) return pc;
  }
  return '';
}

function toOrdersDate(iso?: string | null): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (!m) return '';
  const SR_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = SR_MONTHS[Number(m[2]) - 1];
  return month ? `${m[3]}-${month}-${m[1]}` : '';
}

function cleanPhone(rawPhone?: string | null): string {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function cleanPincode(rawPincode?: string | null): string {
  if (!rawPincode) return '';
  const digits = rawPincode.replace(/\D/g, '');
  return digits.slice(0, 6);
}

function cleanName(rawName?: string | null): string {
  if (!rawName) return '';
  return rawName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isPiiSentinel(raw?: string | null): boolean {
  if (!raw) return true;
  const v = String(raw).trim().toLowerCase();
  return !v || v === 'not authorized' || v === 'unauthorized' || v === 'not available' || /^x+$/.test(v) || /^\*+$/.test(v);
}

function firstReal(...candidates: unknown[]): string {
  for (const c of candidates) {
    if (c === null || c === undefined) continue;
    const v = String(c).trim();
    if (!v || isPiiSentinel(v)) continue;
    return v;
  }
  return '';
}
