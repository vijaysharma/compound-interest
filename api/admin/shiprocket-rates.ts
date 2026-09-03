import { ensureTables, getDb, getUserFromRequest, jsonResponse } from '../_db';
export const config = { runtime: 'edge' };
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }
  const sql = getDb();
  await ensureTables(sql);
  // Authenticate Admin
  const user = await getUserFromRequest(request, sql);
  if (!user || user.role !== 'admin') {
    return jsonResponse({ error: 'Unauthorized: Admin access required' }, 401);
  }
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  const tokenEnv = process.env.SHIPROCKET_TOKEN;
  if ((!email || !password) && !tokenEnv) {
    return jsonResponse(
      {
        error:
          'Shiprocket API credentials not configured in environment (SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD).',
      },
      500
    );
  }
  try {
    const body = (await request.json()) as any;
    const { pickup_postcode, delivery_postcode, weight, length, breadth, height, cod } = body;
    if (!pickup_postcode || !delivery_postcode || !weight) {
      return jsonResponse({ error: 'Missing required fields: pickup, delivery, weight.' }, 400);
    }
    let token = tokenEnv;
    if (!token) {
      // Authenticate to Shiprocket to get token
      const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const authData = (await authRes.json()) as any;
      if (!authRes.ok || !authData.token) {
        return jsonResponse({ error: 'Shiprocket authentication failed', detail: authData }, 500);
      }
      token = authData.token;
    }
    // Check Serviceability
    const serviceabilityRes = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=${pickup_postcode}&delivery_postcode=${delivery_postcode}&weight=${weight}&cod=${cod ? 1 : 0}&length=${length || ''}&breadth=${breadth || ''}&height=${height || ''}`,
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
