'use server';
import {
  AISettings,
  DbUser,
  ensureTables,
  getDb,
  isAuthorizedUser,
  MF_URL,
} from '@/lib/db';
import { redisSet } from '@/lib/redis';
import {
  ShiprocketAccountData,
  ShiprocketCourierRate,
  ShiprocketOrder,
  ShiprocketStatementItem,
  ShiprocketTrackingData,
} from '@/types/shiprocket';
let cachedShiprocketToken: { token: string; expiresAt: number } | null = null;
let cachedShiprocketUser: Record<string, unknown> | null = null;
async function getShiprocketAuth(forceRefresh = false): Promise<{ token: string; user: Record<string, unknown> | null }> {
  const email = process.env.SHIPROCKET_EMAIL;
  const rawPassword = process.env.SHIPROCKET_PASSWORD || process.env.SHIPROCKET_API_TOKEN;
  const password = rawPassword ? rawPassword.replace(/\\(\$)/g, '$1') : undefined;
  const tokenEnv = process.env.SHIPROCKET_TOKEN;
  if (!email || !password) {
    throw new Error(
      'Shiprocket API credentials not configured in environment (SHIPROCKET_EMAIL, SHIPROCKET_API_TOKEN).'
    );
  }
  let authToken = tokenEnv;
  if (!authToken && password && password.startsWith('eyJ')) {
    authToken = password;
  }
  if (!forceRefresh && !authToken && cachedShiprocketToken && cachedShiprocketToken.expiresAt > Date.now()) {
    return { token: cachedShiprocketToken.token, user: cachedShiprocketUser };
  }
  if (forceRefresh || !authToken) {
    const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const authData = (await authRes.json()) as { token?: string; message?: string; [key: string]: unknown };
    if (!authRes.ok || !authData.token) {
      const errorMsg = authData?.message || `HTTP ${authRes.status}`;
      console.error('Shiprocket authentication failed:', authRes.status, authData);
      throw new Error(`Shiprocket authentication failed: ${errorMsg}`);
    }
    authToken = authData.token;
    const { token: _unused, ...restUser } = authData;
    cachedShiprocketUser = restUser;
    cachedShiprocketToken = {
      token: authData.token,
      expiresAt: Date.now() + 8 * 24 * 60 * 60 * 1000,
    };
  }
  return { token: authToken, user: cachedShiprocketUser };
}
async function shiprocketFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const { token } = await getShiprocketAuth();
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
export async function getAdminUsersAction(token?: string | null): Promise<{ users: DbUser[] }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  const users = (await sql`
    SELECT id, email, name, picture, provider, role, api_usage_count,
           COALESCE(free_limit, 15) as free_limit, subscription_status,
           subscription_expires_at, first_used_at, trial_expires_at, created_at, updated_at
    FROM users
    ORDER BY created_at DESC
    LIMIT 200
  `) as DbUser[];
  return { users };
}
export async function updateAdminUserAction(
  body: {
    user_id?: string;
    action?:
      | 'grant_access'
      | 'reset_usage'
      | 'set_role'
      | 'reset_trial'
      | 'set_limit'
      | 'extend_trial_time';
    role?: 'admin' | 'user';
    free_limit?: number;
    hours?: number;
  },
  token?: string | null
): Promise<{ success: boolean; message: string }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  const { user_id, action, role, free_limit, hours } = body;
  if (!user_id || !action) {
    throw new Error('user_id and action are required');
  }
  if (action === 'grant_access') {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await sql`
      UPDATE users
      SET subscription_status = 'active',
          subscription_expires_at = ${expiresAt},
          api_usage_count = 0,
          updated_at = NOW()
      WHERE id = ${user_id}
    `;
    return { success: true, message: 'Granted 30-day Pro access to user' };
  }
  if (action === 'reset_trial' || action === 'reset_usage') {
    await sql`
      UPDATE users
      SET api_usage_count = 0,
          first_used_at = NULL,
          trial_expires_at = NULL,
          subscription_status = 'free_trial',
          updated_at = NOW()
      WHERE id = ${user_id}
    `;
    return {
      success: true,
      message: 'Reset user trial: usage set to 0 and 48h countdown will start upon next usage',
    };
  }
  if (action === 'set_limit') {
    const targetLimit = Number(free_limit);
    if (isNaN(targetLimit) || targetLimit < 1) {
      throw new Error('Valid free_limit number is required');
    }
    await sql`
      UPDATE users
      SET free_limit = ${targetLimit},
          updated_at = NOW()
      WHERE id = ${user_id}
    `;
    return {
      success: true,
      message: `Updated user calculation quota limit to ${targetLimit}`,
    };
  }
  if (action === 'extend_trial_time') {
    const addHours = Number(hours) || 48;
    const newExpiry = new Date(Date.now() + addHours * 60 * 60 * 1000).toISOString();
    await sql`
      UPDATE users
      SET trial_expires_at = ${newExpiry},
          updated_at = NOW()
      WHERE id = ${user_id}
    `;
    return {
      success: true,
      message: `Extended user trial by ${addHours} hours (expires ${new Date(newExpiry).toLocaleString()})`,
    };
  }
  if (action === 'set_role' && role) {
    await sql`
      UPDATE users
      SET role = ${role},
          updated_at = NOW()
      WHERE id = ${user_id}
    `;
    return { success: true, message: `Updated user role to ${role}` };
  }
  throw new Error('Unknown action');
}
export async function getAISettingsAction(token?: string | null): Promise<{
  settings: AISettings & { has_api_key: boolean };
}> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  const rows = (await sql`
    SELECT id, enabled, provider, model, api_key, system_prompt, updated_at
    FROM ai_settings
    WHERE id = 'default'
  `) as AISettings[];
  const current = rows[0] || {
    id: 'default',
    enabled: true,
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    api_key: '',
    system_prompt:
      'You are an expert Indian Chartered Accountant and Tax Planner. Analyze the user financial numbers, income sources, deductions, capital gains, and dual regime comparison. Provide actionable, structured, prioritized recommendations to legally minimize Indian income tax, optimize Section 80C/80CCD/80D, capital gains harvesting, and recommend the optimal regime.',
    updated_at: new Date().toISOString(),
  };
  const hasApiKey = Boolean(current.api_key && current.api_key.trim().length > 0);
  const maskedKey = hasApiKey
    ? `${current.api_key.slice(0, 4)}••••••••${current.api_key.slice(-4)}`
    : '';
  return {
    settings: {
      ...current,
      api_key: maskedKey,
      has_api_key: hasApiKey,
    },
  };
}
export async function updateAISettingsAction(
  body: {
    enabled?: boolean;
    provider?: string;
    model?: string;
    api_key?: string;
    system_prompt?: string;
  },
  token?: string | null
): Promise<{ success: boolean; message: string }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  const enabled = typeof body.enabled === 'boolean' ? body.enabled : true;
  const provider =
    typeof body.provider === 'string' && body.provider.trim() ? body.provider.trim() : 'gemini';
  const model =
    typeof body.model === 'string' && body.model.trim() ? body.model.trim() : 'gemini-2.5-flash';
  const systemPrompt =
    typeof body.system_prompt === 'string' && body.system_prompt.trim()
      ? body.system_prompt.trim().slice(0, 2000)
      : 'You are an expert Indian Chartered Accountant and Tax Planner.';
  const newApiKey = typeof body.api_key === 'string' ? body.api_key.trim() : null;
  if (newApiKey !== null && newApiKey !== '' && !newApiKey.includes('••••')) {
    await sql`
      INSERT INTO ai_settings (id, enabled, provider, model, api_key, system_prompt, updated_at)
      VALUES ('default', ${enabled}, ${provider}, ${model}, ${newApiKey}, ${systemPrompt}, NOW())
      ON CONFLICT (id) DO UPDATE SET
        enabled = EXCLUDED.enabled,
        provider = EXCLUDED.provider,
        model = EXCLUDED.model,
        api_key = EXCLUDED.api_key,
        system_prompt = EXCLUDED.system_prompt,
        updated_at = NOW()
    `;
  } else {
    await sql`
      INSERT INTO ai_settings (id, enabled, provider, model, system_prompt, updated_at)
      VALUES ('default', ${enabled}, ${provider}, ${model}, ${systemPrompt}, NOW())
      ON CONFLICT (id) DO UPDATE SET
        enabled = EXCLUDED.enabled,
        provider = EXCLUDED.provider,
        model = EXCLUDED.model,
        system_prompt = EXCLUDED.system_prompt,
        updated_at = NOW()
    `;
  }
  return { success: true, message: 'AI settings updated successfully' };
}
export async function calculateShiprocketRatesAction(
  body: {
    pickup_postcode?: string;
    delivery_postcode?: string;
    weight?: number | string;
    length?: number | string;
    breadth?: number | string;
    height?: number | string;
    cod?: boolean | number;
  },
  token?: string | null
): Promise<{ success: boolean; data: unknown }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  const { pickup_postcode, delivery_postcode, weight, length, breadth, height, cod } = body;
  if (!pickup_postcode || !delivery_postcode || !weight) {
    throw new Error('Missing required fields: pickup, delivery, weight.');
  }
  const cleanPickup = String(pickup_postcode).replace(/\D/g, '').slice(0, 6);
  const cleanDelivery = String(delivery_postcode).replace(/\D/g, '').slice(0, 6);
  const cleanWeight = Math.max(0.01, Math.min(1000, Number(weight) || 0.5));
  const cleanLength = length ? Math.max(0, Number(length) || 0) : '';
  const cleanBreadth = breadth ? Math.max(0, Number(breadth) || 0) : '';
  const cleanHeight = height ? Math.max(0, Number(height) || 0) : '';
  const cleanCod = cod ? 1 : 0;
  if (cleanPickup.length !== 6 || cleanDelivery.length !== 6) {
    throw new Error('Pickup and delivery pincodes must be valid 6-digit numbers.');
  }
  const params = new URLSearchParams({
    pickup_postcode: cleanPickup,
    delivery_postcode: cleanDelivery,
    weight: cleanWeight.toString(),
    cod: cleanCod.toString(),
  });
  if (cleanLength) params.set('length', cleanLength.toString());
  if (cleanBreadth) params.set('breadth', cleanBreadth.toString());
  if (cleanHeight) params.set('height', cleanHeight.toString());
  const serviceabilityRes = await shiprocketFetch(`courier/serviceability/?${params.toString()}`);
  const data = await serviceabilityRes.json();
  if (!serviceabilityRes.ok) {
    throw new Error('Shiprocket API error: ' + JSON.stringify(data));
  }
  return { success: true, data };
}
export async function getShiprocketAccountAction(token?: string | null): Promise<{
  success: boolean;
  account: ShiprocketAccountData;
}> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  const { user } = await getShiprocketAuth();
  let balance: string | number = '0.00';
  try {
    const balRes = await shiprocketFetch('account/details/wallet-balance');
    if (balRes.ok) {
      const balData = await balRes.json();
      balance = balData?.data?.balance_amount ?? '0.00';
    }
  } catch (err) {
    console.warn('Failed to fetch wallet balance:', err);
  }
  let pickupLocations: ShiprocketAccountData['pickupLocations'] = [];
  try {
    const pickupRes = await shiprocketFetch('settings/company/pickup');
    if (pickupRes.ok) {
      const pickupData = await pickupRes.json();
      pickupLocations = pickupData?.data?.shipping_address || [];
    }
  } catch (err) {
    console.warn('Failed to fetch pickup locations:', err);
  }
  let channels: ShiprocketAccountData['channels'] = [];
  try {
    const chanRes = await shiprocketFetch('channels');
    if (chanRes.ok) {
      const chanData = await chanRes.json();
      channels = Array.isArray(chanData?.data) ? chanData.data : Array.isArray(chanData) ? chanData : [];
    }
  } catch (err) {
    console.warn('Failed to fetch channels:', err);
  }
  return {
    success: true,
    account: {
      user: (user as ShiprocketAccountData['user']) || null,
      balance,
      pickupLocations,
      channels,
    },
  };
}
export async function getShiprocketOrdersAction(
  options: { page?: number; per_page?: number; search?: string; sort?: string; filter_by?: string } = {},
  token?: string | null
): Promise<{
  success: boolean;
  orders: ShiprocketOrder[];
  meta?: { pagination?: { total: number; count: number; per_page: number; current_page: number; total_pages: number } };
}> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.per_page) params.set('per_page', String(options.per_page));
  if (options.search) params.set('search', options.search.trim());
  if (options.sort) params.set('sort', options.sort);
  if (options.filter_by) params.set('filter_by', options.filter_by);
  const endpoint = `orders${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await shiprocketFetch(endpoint);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || `Failed to fetch orders: HTTP ${res.status}`);
  }
  return {
    success: true,
    orders: Array.isArray(data?.data) ? (data.data as ShiprocketOrder[]) : [],
    meta: data?.meta,
  };
}
export async function getShiprocketStatementAction(
  options: { page?: number; per_page?: number; from?: string; to?: string } = {},
  token?: string | null
): Promise<{ success: boolean; data: ShiprocketStatementItem[]; balance?: string | number }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.per_page) params.set('per_page', String(options.per_page));
  if (options.from) params.set('from', options.from);
  if (options.to) params.set('to', options.to);
  const endpoint = `account/details/statement${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await shiprocketFetch(endpoint);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || `Failed to fetch statement: HTTP ${res.status}`);
  }
  return {
    success: true,
    data: Array.isArray(data?.data) ? (data.data as ShiprocketStatementItem[]) : [],
    balance: data?.balance_amount,
  };
}
export async function getShiprocketTrackingAction(
  awb: string,
  token?: string | null
): Promise<{ success: boolean; tracking: ShiprocketTrackingData | null }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  const cleanAwb = awb.trim();
  if (!cleanAwb) {
    throw new Error('AWB code is required for tracking');
  }
  const res = await shiprocketFetch(`courier/track/awb/${encodeURIComponent(cleanAwb)}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || `Failed to fetch tracking: HTTP ${res.status}`);
  }
  return {
    success: true,
    tracking: (data?.tracking_data as ShiprocketTrackingData) || null,
  };
}
export async function createShiprocketOrderAction(
  payload: Record<string, unknown>,
  token?: string | null
): Promise<{ success: boolean; data: { order_id?: number; shipment_id?: number; status?: string; [key: string]: unknown } }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  if (!payload.pickup_location || !payload.billing_customer_name || !payload.billing_address || !payload.billing_city || !payload.billing_pincode || !payload.billing_phone) {
    throw new Error('Missing mandatory fields: pickup location, customer name, address, city, pincode, or phone.');
  }
  const orderId = payload.order_id || `ORD-${Date.now()}`;
  const orderDate = payload.order_date || new Date().toISOString().slice(0, 10);
  const fullPayload = {
    order_id: String(orderId),
    order_date: String(orderDate),
    pickup_location: String(payload.pickup_location),
    billing_customer_name: String(payload.billing_customer_name),
    billing_last_name: String(payload.billing_last_name || ''),
    billing_address: String(payload.billing_address),
    billing_address_2: String(payload.billing_address_2 || ''),
    billing_city: String(payload.billing_city),
    billing_pincode: String(payload.billing_pincode),
    billing_state: String(payload.billing_state || ''),
    billing_country: 'India',
    billing_email: String(payload.billing_email || ''),
    billing_phone: String(payload.billing_phone),
    shipping_is_billing: true,
    order_items: Array.isArray(payload.order_items) && payload.order_items.length > 0 ? payload.order_items : [
      {
        name: 'Item 1',
        sku: `SKU-${Date.now()}`,
        units: 1,
        selling_price: Number(payload.sub_total || 100),
      },
    ],
    payment_method: payload.payment_method === 'COD' ? 'COD' : 'Prepaid',
    sub_total: Number(payload.sub_total || 100),
    length: Number(payload.length || 10),
    breadth: Number(payload.breadth || 10),
    height: Number(payload.height || 10),
    weight: Number(payload.weight || 0.5),
  };
  const res = await shiprocketFetch('orders/create/adhoc', {
    method: 'POST',
    body: JSON.stringify(fullPayload),
  });
  const data = await res.json();
  if (!res.ok || data.status_code === 400 || data.status_code === 422) {
    throw new Error(data?.message || JSON.stringify(data));
  }
  return { success: true, data };
}
export async function assignShiprocketCourierAction(
  payload: { shipment_id: number | string; courier_id?: number | string; status?: string },
  token?: string | null
): Promise<{ success: boolean; data: unknown }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  if (!payload.shipment_id) {
    throw new Error('Shipment ID is required');
  }
  const body: { shipment_id: string | number; courier_id?: string | number; status?: string } = {
    shipment_id: payload.shipment_id,
  };
  if (payload.courier_id) {
    body.courier_id = payload.courier_id;
  }
  if (payload.status) {
    body.status = payload.status;
  }
  const res = await shiprocketFetch('courier/assign/awb', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || JSON.stringify(data));
  }
  return { success: true, data };
}
export async function generateShiprocketPickupAction(
  shipmentIds: (number | string)[],
  token?: string | null
): Promise<{ success: boolean; data: unknown }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  if (!shipmentIds || shipmentIds.length === 0) {
    throw new Error('At least one shipment ID is required');
  }
  const res = await shiprocketFetch('courier/generate/pickup', {
    method: 'POST',
    body: JSON.stringify({ shipment_id: shipmentIds.map(Number) }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || JSON.stringify(data));
  }
  return { success: true, data };
}
export async function generateShiprocketLabelAction(
  shipmentIds: (number | string)[],
  token?: string | null
): Promise<{ success: boolean; label_url?: string; data: unknown }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  if (!shipmentIds || shipmentIds.length === 0) {
    throw new Error('At least one shipment ID is required');
  }
  const res = await shiprocketFetch('courier/generate/label', {
    method: 'POST',
    body: JSON.stringify({ shipment_id: shipmentIds.map(Number) }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || JSON.stringify(data));
  }
  return {
    success: true,
    label_url: (data as { label_url?: string }).label_url,
    data,
  };
}
export async function generateShiprocketInvoiceAction(
  orderIds: (number | string)[],
  token?: string | null
): Promise<{ success: boolean; invoice_url?: string; data: unknown }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  if (!orderIds || orderIds.length === 0) {
    throw new Error('At least one order ID is required');
  }
  const res = await shiprocketFetch('orders/print/invoice', {
    method: 'POST',
    body: JSON.stringify({ ids: orderIds.map(Number) }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || JSON.stringify(data));
  }
  return {
    success: true,
    invoice_url: (data as { invoice_url?: string }).invoice_url,
    data,
  };
}
export async function cancelShiprocketOrderAction(
  payload: { order_ids?: (number | string)[]; awbs?: string[] },
  token?: string | null
): Promise<{ success: boolean; message?: string; data: unknown }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  if (payload.awbs && payload.awbs.length > 0) {
    const res = await shiprocketFetch('orders/cancel/shipment/awbs', {
      method: 'POST',
      body: JSON.stringify({ awbs: payload.awbs }),
    });
    const data = await res.json();
    return { success: res.ok, message: (data as { message?: string })?.message || 'Cancellation request sent', data };
  }
  if (payload.order_ids && payload.order_ids.length > 0) {
    const res = await shiprocketFetch('orders/cancel', {
      method: 'POST',
      body: JSON.stringify({ ids: payload.order_ids.map(Number) }),
    });
    const data = await res.json();
    return { success: res.ok, message: (data as { message?: string })?.message || 'Cancellation request sent', data };
  }
  throw new Error('Order IDs or AWBs required for cancellation');
}
export async function getShiprocketCouriersAction(
  params: {
    pickup_postcode: string;
    delivery_postcode: string;
    weight: number | string;
    cod?: boolean | number;
    length?: number | string;
    breadth?: number | string;
    height?: number | string;
  },
  token?: string | null
): Promise<{ success: boolean; couriers: ShiprocketCourierRate[] }> {
  const rates = await calculateShiprocketRatesAction(params, token);
  const couriers = ((rates.data as { data?: { available_courier_companies?: ShiprocketCourierRate[] } })?.data?.available_courier_companies || []) as ShiprocketCourierRate[];
  return { success: true, couriers };
}
export async function getPostcodeDetailsAction(postcode: string): Promise<unknown> {
  const cleanPostcode = postcode.replace(/\D/g, '').slice(0, 6);
  if (cleanPostcode.length !== 6) {
    throw new Error('Valid 6-digit pincode is required');
  }
  try {
    const res = await fetch(
      `https://apiv2.shiprocket.in/v1/external/open/postcode/details?postcode=${encodeURIComponent(cleanPostcode)}`
    );
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Shiprocket postcode lookup failed, falling back to India Post:', err);
  }
  const fallback = await fetch(
    `https://api.postalpincode.in/pincode/${encodeURIComponent(cleanPostcode)}`
  );
  if (fallback.ok) {
    return await fallback.json();
  }
  throw new Error('Unable to resolve postcode details');
}
export async function syncMutualFundsAction(token?: string | null): Promise<{ synced: number }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  const upstream = await fetch(MF_URL, { headers: { Accept: 'application/json' } });
  if (!upstream.ok) {
    throw new Error(`MF API returned ${upstream.status}`);
  }
  const payload = await upstream.json();
  if (!Array.isArray(payload)) {
    throw new Error('MF API returned an invalid list');
  }
  await sql`DELETE FROM mutual_fund_schemes`;
  await sql`
    INSERT INTO mutual_fund_schemes (scheme_code, scheme_name, payload)
    SELECT item->>'schemeCode', item->>'schemeName', item
    FROM jsonb_array_elements(${JSON.stringify(payload)}::jsonb) AS item
    WHERE item->>'schemeCode' IS NOT NULL AND item->>'schemeName' IS NOT NULL
    ON CONFLICT (scheme_code) DO UPDATE SET
      scheme_name = EXCLUDED.scheme_name, payload = EXCLUDED.payload, updated_at = NOW()
  `;
  const compactSchemes = payload
    .filter((item: { schemeCode?: unknown; schemeName?: unknown }) => item?.schemeCode && item?.schemeName)
    .map((item: { schemeCode: number | string; schemeName: string }) => ({
      schemeCode: Number(item.schemeCode),
      schemeName: String(item.schemeName),
    }));
  await redisSet('cache:mf:all_schemes', compactSchemes, 86400 * 30).catch(() => {});
  return { synced: payload.length };
}
export async function syncIMFAction(
  payload: unknown,
  token?: string | null
): Promise<{ synced: boolean }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('IMF payload must be a JSON object');
  }
  await sql`
    INSERT INTO inflation_sources (source, payload)
    VALUES ('imf-pcpipch', ${JSON.stringify(payload)}::jsonb)
    ON CONFLICT (source) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
  `;
  return { synced: true };
}
const WORLD_BANK_PPP_API =
  'https://api.worldbank.org/v2/country/all/indicator/PA.NUS.PPP?format=json&per_page=300&mrv=1';
export async function syncPPPAction(
  inputPayload?: unknown,
  token?: string | null
): Promise<{ synced: number | boolean }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  let payload = inputPayload;
  if (!payload) {
    const upstream = await fetch(WORLD_BANK_PPP_API, {
      headers: { Accept: 'application/json' },
    });
    if (!upstream.ok) {
      throw new Error(`World Bank API returned ${upstream.status}`);
    }
    payload = await upstream.json();
  }
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid PPP payload format');
  }
  await sql`
    INSERT INTO inflation_sources (source, payload)
    VALUES ('world-bank-ppp', ${JSON.stringify(payload)}::jsonb)
    ON CONFLICT (source) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
  `;
  let count = 0;
  if (Array.isArray(payload)) {
    if (Array.isArray(payload[1])) {
      count = payload[1].length;
    } else {
      count = payload.length;
    }
  }
  return { synced: count || true };
}
