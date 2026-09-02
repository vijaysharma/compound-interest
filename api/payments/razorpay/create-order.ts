import { ensureTables, getDb, getUserFromRequest, jsonResponse } from '../../_db';
export const config = { runtime: 'nodejs', maxDuration: 10 };
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
    const rawKeyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
    const rawKeySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!rawKeyId || !rawKeySecret) {
      console.error('Razorpay keys missing from environment');
      return jsonResponse(
        { error: 'Payment gateway is not configured. Please contact support.' },
        500
      );
    }
    const keyId = rawKeyId.trim().replace(/^["']|["']$/g, '');
    const keySecret = rawKeySecret.trim().replace(/^["']|["']$/g, '');
    const body = (await request.json().catch(() => ({}))) as { amount?: number | string };
    const parsed = Number(body.amount);
    const amountInRupees = !isNaN(parsed) && parsed > 0 ? parsed : 29;
    const amountInPaise = Math.round(amountInRupees * 100);
    const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const receipt = `rcpt_${user.id.replace(/-/g, '').slice(0, 10)}_${Date.now().toString().slice(-6)}`;
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'RupeeCalculator/1.0',
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
    const resText = await rzpRes.text();
    let orderData: {
      id?: string;
      amount?: number;
      currency?: string;
      error?: { description?: string; code?: string; field?: string; reason?: string } | string;
      message?: string;
    } = {};
    try {
      orderData = JSON.parse(resText);
    } catch {
      orderData = { message: resText };
    }
    if (!rzpRes.ok || !orderData.id) {
      const errorMsg =
        (typeof orderData.error === 'object' && orderData.error?.description) ||
        (typeof orderData.error === 'string' && orderData.error) ||
        orderData.message ||
        resText ||
        `Razorpay error (HTTP ${rzpRes.status})`;
      console.error('Razorpay order creation failed:', {
        status: rzpRes.status,
        statusText: rzpRes.statusText,
        error: errorMsg,
        keyIdPrefix: keyId.slice(0, 12) + '...',
      });
      return jsonResponse(
        {
          error: `Razorpay Order Error: ${errorMsg}`,
          detail: orderData,
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
    console.error('Create order exception:', error);
    return jsonResponse({ error: 'Failed to create payment order', detail: String(error) }, 500);
  }
}
