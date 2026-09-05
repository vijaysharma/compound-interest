import { ensureTables, getDb, getUserFromRequest, jsonResponse } from '../../_db';
export const config = { runtime: 'edge' };
async function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const data = enc.encode(`${orderId}|${paymentId}`);
  const signatureBytes = await crypto.subtle.sign('HMAC', key, data);
  const generatedSignature = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return generatedSignature.toLowerCase() === signature.toLowerCase().trim();
}
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }
  try {
    const sql = getDb();
    await ensureTables(sql);
    const user = await getUserFromRequest(request, sql);
    if (!user) {
      return jsonResponse({ error: 'Authentication required to verify payment' }, 401);
    }
    const rawKeySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!rawKeySecret) {
      return jsonResponse({ error: 'Razorpay secret key is not configured.' }, 500);
    }
    const keySecret = rawKeySecret.trim().replace(/^["']|["']$/g, '');
    const body = (await request.json().catch(() => ({}))) as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return jsonResponse(
        { error: 'Missing required Razorpay payment confirmation parameters' },
        400
      );
    }
    const isValid = await verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      keySecret
    );
    if (!isValid) {
      return jsonResponse(
        { error: 'Invalid payment signature. Payment verification failed.' },
        400
      );
    }
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await sql`
      UPDATE users
      SET subscription_status = 'active',
          subscription_expires_at = ${expiresAt},
          api_usage_count = 0,
          updated_at = NOW()
      WHERE id = ${user.id}
    `;
    const newSubId = crypto.randomUUID();
    await sql`
      INSERT INTO payment_submissions (id, user_id, user_email, utr_ref, amount, status, created_at, updated_at)
      VALUES (${newSubId}, ${user.id}, ${user.email}, ${razorpay_payment_id}, 54, 'approved', NOW(), NOW())
    `;
    return jsonResponse({
      success: true,
      message: 'Payment verified successfully! Your 30-day Pro access is now active.',
      subscription_expires_at: expiresAt,
    });
  } catch (error) {
    return jsonResponse({ error: 'Payment verification error', detail: String(error) }, 500);
  }
}
