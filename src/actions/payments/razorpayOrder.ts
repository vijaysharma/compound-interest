import {
  ensureTables,
  getDb,
  getUserFromToken,
} from '@/lib/db';
import { SUBSCRIPTION_PLANS } from '@/types/auth';
export async function handleCreateRazorpayOrder(
  token?: string | null,
  planId: string = 'pro_monthly'
): Promise<{
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  planId: string;
  planName: string;
  user: { name: string; email: string };
}> {
  const sql = getDb();
  await ensureTables(sql);
  const user = await getUserFromToken(token, sql);
  if (!user) {
    throw new Error('Authentication required to initiate payment');
  }
  const rawKeyId =
    process.env.RAZORPAY_KEY_ID ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    process.env.VITE_RAZORPAY_KEY_ID;
  const rawKeySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!rawKeyId || !rawKeySecret) {
    throw new Error('Payment gateway is not configured. Please contact support.');
  }
  const keyId = rawKeyId.trim().replace(/^["']|["']$/g, '');
  const keySecret = rawKeySecret.trim().replace(/^["']|["']$/g, '');
  const selectedPlan = SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.pro_monthly;
  let finalAmount = selectedPlan.amount;
  if (selectedPlan.id === 'pro_monthly') {
    const settingsRows = (await sql`
      SELECT amount FROM payment_settings WHERE id = 'default' LIMIT 1
    `) as Array<{ amount?: number | string }>;
    if (settingsRows.length > 0 && Number(settingsRows[0].amount) > 0) {
      finalAmount = Number(settingsRows[0].amount);
    }
  }
  const amountInPaise = Math.round(finalAmount * 100);
  const authHeader = btoa(`${keyId}:${keySecret}`);
  const receipt = `rcpt_${user.id.replace(/-/g, '').slice(0, 8)}_${Date.now().toString().slice(-6)}`;
  const orderPayload = JSON.stringify({
    amount: amountInPaise,
    currency: 'INR',
    receipt,
    notes: {
      user_id: user.id,
      user_email: user.email,
      plan: selectedPlan.id,
    },
  });
  const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authHeader}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: orderPayload,
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
    orderData = { message: resText.slice(0, 500) };
  }
  if (!rzpRes.ok || !orderData.id) {
    const errorMsg =
      (typeof orderData.error === 'object' && orderData.error?.description) ||
      (typeof orderData.error === 'string' && orderData.error) ||
      orderData.message ||
      `Razorpay returned HTTP ${rzpRes.status}`;
    throw new Error(errorMsg);
  }
  return {
    orderId: orderData.id,
    amount: orderData.amount ?? amountInPaise,
    currency: orderData.currency || 'INR',
    keyId,
    planId: selectedPlan.id,
    planName: selectedPlan.name,
    user: {
      name: user.name || user.email.split('@')[0],
      email: user.email,
    },
  };
}
