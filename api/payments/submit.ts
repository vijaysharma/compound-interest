import { ensureTables, getDb, getUserFromRequest, jsonResponse } from '../_db';
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
      return jsonResponse({ error: 'Authentication required to submit payment' }, 401);
    }
    const body = (await request.json()) as { utr_ref?: string; amount?: number };
    const utrRef = body.utr_ref ? body.utr_ref.trim() : '';
    const amount = typeof body.amount === 'number' ? body.amount : 29;
    if (!utrRef || utrRef.length < 4) {
      return jsonResponse(
        { error: 'Please enter a valid 12-digit UPI UTR / Transaction Reference number' },
        400
      );
    }
    const newId = crypto.randomUUID();
    const created = (await sql`
      INSERT INTO payment_submissions (id, user_id, user_email, utr_ref, amount, status, created_at, updated_at)
      VALUES (${newId}, ${user.id}, ${user.email}, ${utrRef}, ${amount}, 'pending', NOW(), NOW())
      RETURNING id, user_id, user_email, utr_ref, amount, status, created_at
    `) as {
      id: string;
      user_id: string;
      user_email: string;
      utr_ref: string;
      amount: number;
      status: string;
      created_at: string;
    }[];
    return jsonResponse({
      success: true,
      submission: created[0],
      message:
        'Payment reference submitted successfully. An administrator will verify and approve your access shortly.',
    });
  } catch (error) {
    return jsonResponse({ error: 'Failed to submit payment', detail: String(error) }, 500);
  }
}
