import {
  ensureTables,
  getDb,
  getUserFromToken,
} from '@/lib/db';
import { SUBSCRIPTION_PLANS } from '@/types/auth';
import { verifyRazorpaySignature } from './razorpaySignature';
export async function handleVerifyRazorpayPayment(
  body: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    plan_id?: string;
  },
  token?: string | null
): Promise<{
  success: boolean;
  message: string;
  subscription_expires_at: string;
  subscription_plan: string;
}> {
  const sql = getDb();
  await ensureTables(sql);
  const user = await getUserFromToken(token, sql);
  if (!user) {
    throw new Error('Authentication required to verify payment');
  }
  const rawKeySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!rawKeySecret) {
    throw new Error('Razorpay secret key is not configured.');
  }
  const keySecret = rawKeySecret.trim().replace(/^["']|["']$/g, '');
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_id } = body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new Error('Missing required Razorpay payment confirmation parameters');
  }
  const isValid = await verifyRazorpaySignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    keySecret
  );
  if (!isValid) {
    throw new Error('Invalid payment signature. Payment verification failed.');
  }
  const existingPayment = (await sql`
    SELECT id FROM payment_submissions
    WHERE utr_ref = ${razorpay_payment_id} AND status = 'approved'
    LIMIT 1
  `) as Array<{ id: string }>;
  if (existingPayment.length > 0) {
    throw new Error('This payment has already been verified and processed.');
  }

  const rawKeyId =
    process.env.RAZORPAY_KEY_ID ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    process.env.VITE_RAZORPAY_KEY_ID;
  const keyId = rawKeyId?.trim().replace(/^["']|["']$/g, '');
  let verifiedPlanId = plan_id;

  if (keyId && keySecret) {
    try {
      const authHeader = btoa(`${keyId}:${keySecret}`);
      const rzpRes = await fetch(
        `https://api.razorpay.com/v1/orders/${encodeURIComponent(razorpay_order_id)}`,
        {
          headers: {
            Authorization: `Basic ${authHeader}`,
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(8000),
        }
      );
      if (rzpRes.ok) {
        const orderData = (await rzpRes.json()) as {
          amount?: number;
          notes?: { user_id?: string; plan?: string };
        };
        if (orderData.notes?.user_id && orderData.notes.user_id !== user.id) {
          throw new Error('Payment was initiated for a different user account.');
        }
        if (orderData.notes?.plan && SUBSCRIPTION_PLANS[orderData.notes.plan]) {
          verifiedPlanId = orderData.notes.plan;
        } else if (orderData.amount) {
          const matchedPlan = Object.values(SUBSCRIPTION_PLANS).find(
            (p) => Math.round(p.amount * 100) === orderData.amount
          );
          if (matchedPlan) {
            verifiedPlanId = matchedPlan.id;
          }
        }
      }
    } catch (orderErr) {
      if (orderErr instanceof Error && orderErr.message.includes('different user account')) {
        throw orderErr;
      }
      console.warn('Razorpay order verification API check failed, falling back:', orderErr);
    }
  }

  const plan =
    verifiedPlanId && SUBSCRIPTION_PLANS[verifiedPlanId]
      ? SUBSCRIPTION_PLANS[verifiedPlanId]
      : SUBSCRIPTION_PLANS.pro_monthly;
  const recordedAmount = plan.amount;
  const expiresAt = new Date(Date.now() + plan.days * 24 * 60 * 60 * 1000).toISOString();
  await sql`
    UPDATE users
    SET subscription_status = 'active',
        subscription_plan = ${plan.id},
        subscription_expires_at = ${expiresAt},
        api_usage_count = 0,
        updated_at = NOW()
    WHERE id = ${user.id}
  `;
  const newSubId = crypto.randomUUID();
  await sql`
    INSERT INTO payment_submissions (id, user_id, user_email, utr_ref, amount, status, created_at, updated_at)
    VALUES (${newSubId}, ${user.id}, ${user.email}, ${razorpay_payment_id}, ${recordedAmount}, 'approved', NOW(), NOW())
  `;
  return {
    success: true,
    message: `Payment verified successfully! Your ${plan.name} access is now active.`,
    subscription_expires_at: expiresAt,
    subscription_plan: plan.id,
  };
}
