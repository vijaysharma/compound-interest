import {
  ensureTables,
  getDb,
  getUserFromToken,
  isAuthorizedUser,
  PaymentSubmission,
} from '@/lib/db';
export async function handleSubmitManualPayment(
  body: { utr_ref?: string; amount?: number },
  token?: string | null
): Promise<{ success: boolean; submission: PaymentSubmission; message: string }> {
  const sql = getDb();
  await ensureTables(sql);
  const user = await getUserFromToken(token, sql);
  if (!user) throw new Error('Authentication required to submit payment');
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
    throw new Error('A payment submission with this UTR reference has already been submitted or approved.');
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
export async function handleGetAdminPaymentSubmissions(token?: string | null): Promise<{
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
export async function handleProcessAdminPaymentSubmission(
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
    let planId = 'pro_monthly';
    let days = 30;
    if (submission.amount >= 900) {
      planId = 'tax_yearly';
      days = 365;
    } else if (submission.amount >= 400) {
      planId = 'pro_yearly';
      days = 365;
    } else if (submission.amount >= 120) {
      planId = 'tax_monthly';
      days = 30;
    }
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    await sql`
      UPDATE users
      SET subscription_status = 'active',
          subscription_plan = ${planId},
          subscription_expires_at = ${expiresAt},
          api_usage_count = 0,
          updated_at = NOW()
      WHERE id = ${submission.user_id}
    `;
    return {
      success: true,
      message: `Payment approved. User ${submission.user_email} granted ${days}-day access (${planId}).`,
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
