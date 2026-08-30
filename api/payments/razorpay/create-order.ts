import { ensureTables, getDb, getUserFromRequest, jsonResponse } from '../../_db';
export const config = { runtime: 'edge' };
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }
  try {
    const sql = getDb();
    await ensureTables(sql);
    const user = await getUserFromRequest(request, sql);
    if (!user) {
      return jsonResponse({ error: 'Authentication required to initiate payment' }, 401);
    }
    const keyId =
      process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TW0RQa1VIcpwaN';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'UxZ0a8mnYGVRkkO6r52IAUcq';
    const body = (await request.json().catch(() => ({}))) as { amount?: number };
    const amountInRupees = typeof body.amount === 'number' && body.amount > 0 ? body.amount : 29;
    const amountInPaise = Math.round(amountInRupees * 100);
    const authHeader = btoa(`${keyId}:${keySecret}`);
    const receipt = `rcpt_${user.id.replace(/-/g, '').slice(0, 10)}_${Date.now().toString().slice(-6)}`;
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt,
        notes: {
          user_id: user.id,
          user_email: user.email,
          plan: '30_days_pro',
        },
      }),
    });
    const orderData = (await rzpRes.json()) as {
      id?: string;
      amount?: number;
      currency?: string;
      error?: { description?: string };
    };
    if (!rzpRes.ok || !orderData.id) {
      return jsonResponse(
        {
          error:
            orderData.error?.description ||
            'Failed to create payment order with Razorpay. Please try again.',
        },
        500
      );
    }
    return jsonResponse({
      orderId: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency || 'INR',
      keyId,
      user: {
        name: user.name || user.email.split('@')[0],
        email: user.email,
      },
    });
  } catch (error) {
    return jsonResponse({ error: 'Failed to create payment order', detail: String(error) }, 500);
  }
}
