import { ensureTables, getDb, getUserFromRequest, jsonResponse } from '../_db';
export const config = { runtime: 'edge' };
let cachedShiprocketToken: { token: string; expiresAt: number } | null = null;
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }
  const sql = getDb();
  await ensureTables(sql);
  const user = await getUserFromRequest(request, sql);
  if (!user || user.role !== 'admin') {
    return jsonResponse({ error: 'Unauthorized: Admin access required' }, 401);
  }
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD || process.env.SHIPROCKET_API_TOKEN;
  const tokenEnv = process.env.SHIPROCKET_TOKEN;
  if (!email || !password) {
    return jsonResponse(
      {
        error:
          'Shiprocket API credentials not configured in environment (SHIPROCKET_EMAIL, SHIPROCKET_API_TOKEN).',
      },
      500
    );
  }
  try {
    const body = (await request.json().catch(() => ({}))) as {
      pickup_postcode?: string;
      delivery_postcode?: string;
      weight?: number | string;
      length?: number | string;
      breadth?: number | string;
      height?: number | string;
      cod?: boolean | number;
    };
    const { pickup_postcode, delivery_postcode, weight, length, breadth, height, cod } = body;
    if (!pickup_postcode || !delivery_postcode || !weight) {
      return jsonResponse({ error: 'Missing required fields: pickup, delivery, weight.' }, 400);
    }
    const cleanPickup = String(pickup_postcode).replace(/\D/g, '').slice(0, 6);
    const cleanDelivery = String(delivery_postcode).replace(/\D/g, '').slice(0, 6);
    const cleanWeight = Math.max(0.01, Math.min(1000, Number(weight) || 0.5));
    const cleanLength = length ? Math.max(0, Number(length) || 0) : '';
    const cleanBreadth = breadth ? Math.max(0, Number(breadth) || 0) : '';
    const cleanHeight = height ? Math.max(0, Number(height) || 0) : '';
    const cleanCod = cod ? 1 : 0;
    if (cleanPickup.length !== 6 || cleanDelivery.length !== 6) {
      return jsonResponse({ error: 'Pickup and delivery pincodes must be valid 6-digit numbers.' }, 400);
    }
    let token = tokenEnv;
    if (!token && password && password.startsWith('eyJ')) {
      token = password;
    }
    if (!token && cachedShiprocketToken && cachedShiprocketToken.expiresAt > Date.now()) {
      token = cachedShiprocketToken.token;
    }
    if (!token) {
      const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const authData = (await authRes.json()) as { token?: string };
      if (!authRes.ok || !authData.token) {
        return jsonResponse({ error: 'Shiprocket authentication failed', detail: authData }, 500);
      }
      token = authData.token;
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
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const data = await serviceabilityRes.json();
    if (!serviceabilityRes.ok) {
      return jsonResponse({ error: 'Shiprocket API error', detail: data }, 500);
    }
    return jsonResponse({ success: true, data });
  } catch (err) {
    return jsonResponse({ error: 'Failed to fetch rates', detail: String(err) }, 500);
  }
}
