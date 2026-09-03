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
  // User might have stored the API User password in SHIPROCKET_API_TOKEN as per their env file
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
    const body = (await request.json()) as {
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
    let token = tokenEnv;
    if (!token && password && password.startsWith('eyJ')) {
      // User might have placed the actual JWT token in SHIPROCKET_API_TOKEN
      token = password;
    }
    if (!token) {
      // Authenticate to Shiprocket to get token using email and password
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
