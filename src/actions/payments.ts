'use server';
import {
  ensureTables,
  getDb,
  getUserFromToken,
  isAuthorizedUser,
  PaymentSettings,
  PaymentSubmission,
  timingSafeEqual,
} from '@/lib/db';
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
  return timingSafeEqual(generatedSignature.toLowerCase(), signature.toLowerCase().trim());
}
export async function getPaymentSettingsAction(): Promise<{ settings: PaymentSettings }> {
  const sql = getDb();
  await ensureTables(sql);
  const rows = (await sql`
    SELECT id, title, upi_id, upi_qr_code_url, amount, instructions, updated_at
    FROM payment_settings
    WHERE id = 'default'
  `) as PaymentSettings[];
  const settings: PaymentSettings =
    rows.length > 0
      ? rows[0]
      : {
          id: 'default',
          title: 'Rupee Calculator Pro Subscription',
          upi_id: '',
          upi_qr_code_url: '',
          amount: 54,
          instructions:
            'Pay ₹54 for 1 Month Unlimited Access. Scan the QR code or pay to the UPI ID, then enter your Transaction UTR number.',
          updated_at: new Date().toISOString(),
        };
  return { settings };
}
export async function updatePaymentSettingsAction(
  body: Partial<PaymentSettings>,
  token?: string | null
): Promise<{ success: boolean; settings: PaymentSettings }> {
  const sql = getDb();
  await ensureTables(sql);
  const authorized = await isAuthorizedUser(token, sql);
  if (!authorized) {
    throw new Error('Unauthorized: Admin access required');
  }
  const title =
    typeof body.title === 'string'
      ? body.title.replace(/<[^>]*>/g, '').trim().slice(0, 100)
      : 'Rupee Calculator Pro Subscription';
  const upiId =
    typeof body.upi_id === 'string'
      ? body.upi_id.replace(/[^a-zA-Z0-9._@-]/g, '').trim().slice(0, 100)
      : '';
  let qrCodeUrl =
    typeof body.upi_qr_code_url === 'string' ? body.upi_qr_code_url.trim() : '';
  if (
    qrCodeUrl &&
    !qrCodeUrl.startsWith('https://') &&
    !qrCodeUrl.startsWith('http://') &&
    !qrCodeUrl.startsWith('data:image/')
  ) {
    qrCodeUrl = '';
  }
  if (qrCodeUrl.length > 500_000) qrCodeUrl = '';
  const rawAmount = typeof body.amount === 'number' ? body.amount : 54;
  const amount = Math.max(1, Math.min(100000, Number.isFinite(rawAmount) ? rawAmount : 54));
  const instructions =
    typeof body.instructions === 'string'
      ? body.instructions.replace(/<[^>]*>/g, '').trim().slice(0, 1000)
      : 'Pay ₹54 for 1 Month Unlimited Access. Scan the QR code or pay to the UPI ID, then enter your Transaction UTR number.';
  const updated = (await sql`
    INSERT INTO payment_settings (id, title, upi_id, upi_qr_code_url, amount, instructions, updated_at)
    VALUES ('default', ${title}, ${upiId}, ${qrCodeUrl}, ${amount}, ${instructions}, NOW())
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      upi_id = EXCLUDED.upi_id,
      upi_qr_code_url = EXCLUDED.upi_qr_code_url,
      amount = EXCLUDED.amount,
      instructions = EXCLUDED.instructions,
      updated_at = NOW()
    RETURNING id, title, upi_id, upi_qr_code_url, amount, instructions, updated_at
  `) as PaymentSettings[];
  return { success: true, settings: updated[0] };
}
export async function createRazorpayOrderAction(token?: string | null): Promise<{
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
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
  const settingsRows = (await sql`
    SELECT amount FROM payment_settings WHERE id = 'default' LIMIT 1
  `) as Array<{ amount?: number | string }>;
  const configuredAmount =
    settingsRows.length > 0 && Number(settingsRows[0].amount) > 0
      ? Number(settingsRows[0].amount)
      : 54;
  const amountInPaise = Math.round(configuredAmount * 100);
  const authHeader = btoa(`${keyId}:${keySecret}`);
  const receipt = `rcpt_${user.id.replace(/-/g, '').slice(0, 10)}_${Date.now().toString().slice(-6)}`;
  const orderPayload = JSON.stringify({
    amount: amountInPaise,
    currency: 'INR',
    receipt,
    notes: {
      user_id: user.id,
      user_email: user.email,
      plan: '30_days_pro',
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
    user: {
      name: user.name || user.email.split('@')[0],
      email: user.email,
    },
  };
}
export async function verifyRazorpayPaymentAction(
  body: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  },
  token?: string | null
): Promise<{
  success: boolean;
  message: string;
  subscription_expires_at: string;
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
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
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
  const settingsRows = (await sql`
    SELECT amount FROM payment_settings WHERE id = 'default' LIMIT 1
  `) as Array<{ amount?: number | string }>;
  const recordedAmount =
    settingsRows.length > 0 && Number(settingsRows[0].amount) > 0
      ? Number(settingsRows[0].amount)
      : 54;
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
    VALUES (${newSubId}, ${user.id}, ${user.email}, ${razorpay_payment_id}, ${recordedAmount}, 'approved', NOW(), NOW())
  `;
  return {
    success: true,
    message: 'Payment verified successfully! Your 30-day Pro access is now active.',
    subscription_expires_at: expiresAt,
  };
}
export async function submitManualPaymentAction(
  body: { utr_ref?: string; amount?: number },
  token?: string | null
): Promise<{
  success: boolean;
  submission: PaymentSubmission;
  message: string;
}> {
  const sql = getDb();
  await ensureTables(sql);
  const user = await getUserFromToken(token, sql);
  if (!user) {
    throw new Error('Authentication required to submit payment');
  }
  const rawUtr = typeof body.utr_ref === 'string' ? body.utr_ref.trim() : '';
  const utrRef = rawUtr.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
  if (!utrRef || utrRef.length < 4) {
    throw new Error('Please enter a valid 12-digit UPI UTR / Transaction Reference number');
  }
  const rawAmount = typeof body.amount === 'number' ? body.amount : 54;
  const amount = Math.max(1, Math.min(100000, Number.isFinite(rawAmount) ? rawAmount : 54));
  const duplicate = (await sql`
    SELECT id, status FROM payment_submissions
    WHERE utr_ref = ${utrRef} AND status IN ('pending', 'approved')
    LIMIT 1
  `) as { id: string; status: string }[];
  if (duplicate.length > 0) {
    throw new Error(
      'A payment submission with this UTR reference has already been submitted or approved.'
    );
  }
  const newId = crypto.randomUUID();
  const created = (await sql`
    INSERT INTO payment_submissions (id, user_id, user_email, utr_ref, amount, status, created_at, updated_at)
    VALUES (${newId}, ${user.id}, ${user.email}, ${utrRef}, ${amount}, 'pending', NOW(), NOW())
    RETURNING id, user_id, user_email, utr_ref, amount, status, created_at, updated_at
  `) as PaymentSubmission[];
  return {
    success: true,
    submission: created[0],
    message:
      'Payment reference submitted successfully. An administrator will verify and approve your access shortly.',
  };
}
export async function getAdminPaymentSubmissionsAction(token?: string | null): Promise<{
  submissions: (PaymentSubmission & {
    subscription_status: string;
    subscription_expires_at: string | null;
  })[];
}> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  const submissions = (await sql`
    SELECT s.id, s.user_id, s.user_email, s.utr_ref, s.amount, s.status, s.created_at, s.updated_at,
           u.subscription_status, u.subscription_expires_at
    FROM payment_submissions s
    LEFT JOIN users u ON u.id = s.user_id
    ORDER BY s.created_at DESC
    LIMIT 100
  `) as (PaymentSubmission & {
    subscription_status: string;
    subscription_expires_at: string | null;
  })[];
  return { submissions };
}
export async function processAdminPaymentSubmissionAction(
  body: {
    submission_id?: string;
    action?: 'approve' | 'reject';
  },
  token?: string | null
): Promise<{ success: boolean; message: string }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  const { submission_id, action } = body;
  if (!submission_id || (action !== 'approve' && action !== 'reject')) {
    throw new Error('Valid submission_id and action (approve|reject) are required');
  }
  const existing = (await sql`
    SELECT id, user_id, user_email, utr_ref, amount, status
    FROM payment_submissions
    WHERE id = ${submission_id}
  `) as PaymentSubmission[];
  if (existing.length === 0) {
    throw new Error('Submission not found');
  }
  const submission = existing[0];
  if (action === 'approve') {
    await sql`
      UPDATE payment_submissions
      SET status = 'approved', updated_at = NOW()
      WHERE id = ${submission_id}
    `;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await sql`
      UPDATE users
      SET subscription_status = 'active',
          subscription_expires_at = ${expiresAt},
          api_usage_count = 0,
          updated_at = NOW()
      WHERE id = ${submission.user_id}
    `;
    return {
      success: true,
      message: `Payment approved. User ${submission.user_email} granted 30-day Pro access.`,
    };
  }
  await sql`
    UPDATE payment_submissions
    SET status = 'rejected', updated_at = NOW()
    WHERE id = ${submission_id}
  `;
  return {
    success: true,
    message: `Payment submission ${submission_id} rejected.`,
  };
}
