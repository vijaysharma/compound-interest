import {
  ensureTables,
  getDb,
  isAuthorized,
  jsonResponse,
  PaymentSubmission,
  unauthorized,
} from '../_db';
export const config = { runtime: 'edge' };
export default async function handler(request: Request): Promise<Response> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorized(request, sql))) {
    return unauthorized();
  }
  if (request.method === 'GET') {
    try {
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
      return jsonResponse({ submissions });
    } catch (error) {
      return jsonResponse({ error: 'Failed to fetch submissions', detail: String(error) }, 500);
    }
  }
  if (request.method === 'POST') {
    try {
      const body = (await request.json()) as {
        submission_id?: string;
        action?: 'approve' | 'reject';
      };
      const { submission_id, action } = body;
      if (!submission_id || (action !== 'approve' && action !== 'reject')) {
        return jsonResponse(
          { error: 'Valid submission_id and action (approve|reject) are required' },
          400
        );
      }
      const existing = (await sql`
        SELECT id, user_id, user_email, utr_ref, amount, status
        FROM payment_submissions
        WHERE id = ${submission_id}
      `) as PaymentSubmission[];
      if (existing.length === 0) {
        return jsonResponse({ error: 'Submission not found' }, 404);
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
        return jsonResponse({
          success: true,
          message: `Payment approved. User ${submission.user_email} granted 30-day Pro access.`,
        });
      }
      await sql`
        UPDATE payment_submissions
        SET status = 'rejected', updated_at = NOW()
        WHERE id = ${submission_id}
      `;
      return jsonResponse({
        success: true,
        message: `Payment submission ${submission_id} rejected.`,
      });
    } catch (error) {
      return jsonResponse({ error: 'Failed to process payment', detail: String(error) }, 500);
    }
  }
  return jsonResponse({ error: 'Method not allowed' }, 405);
}
