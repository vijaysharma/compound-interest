'use server';
import {
  AISettings,
  DbUser,
  ensureTables,
  getDb,
  isAuthorizedUser,
  MF_URL,
} from '@/lib/db';
let cachedShiprocketToken: { token: string; expiresAt: number } | null = null;
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
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD || process.env.SHIPROCKET_API_TOKEN;
  const tokenEnv = process.env.SHIPROCKET_TOKEN;
  if (!email || !password) {
    throw new Error(
      'Shiprocket API credentials not configured in environment (SHIPROCKET_EMAIL, SHIPROCKET_API_TOKEN).'
    );
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
  let authToken = tokenEnv;
  if (!authToken && password && password.startsWith('eyJ')) {
    authToken = password;
  }
  if (!authToken && cachedShiprocketToken && cachedShiprocketToken.expiresAt > Date.now()) {
    authToken = cachedShiprocketToken.token;
  }
  if (!authToken) {
    const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const authData = (await authRes.json()) as { token?: string };
    if (!authRes.ok || !authData.token) {
      throw new Error('Shiprocket authentication failed');
    }
    authToken = authData.token;
    cachedShiprocketToken = {
      token: authData.token,
      expiresAt: Date.now() + 8 * 24 * 60 * 60 * 1000,
    };
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
  const serviceabilityRes = await fetch(
    `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
  const data = await serviceabilityRes.json();
  if (!serviceabilityRes.ok) {
    throw new Error('Shiprocket API error: ' + JSON.stringify(data));
  }
  return { success: true, data };
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
