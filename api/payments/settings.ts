import {
  ensureTables,
  getDb,
  isAuthorized,
  jsonResponse,
  PaymentSettings,
  unauthorized,
} from '../_db';
export const config = { runtime: 'edge' };
export default async function handler(request: Request): Promise<Response> {
  const sql = getDb();
  await ensureTables(sql);
  if (request.method === 'GET') {
    try {
      const rows = (await sql`
        SELECT id, title, upi_id, upi_qr_code_url, amount, instructions, updated_at
        FROM payment_settings
        WHERE id = 'default'
      `) as PaymentSettings[];
      const settings =
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
      return jsonResponse({ settings });
    } catch (error) {
      return jsonResponse({ error: 'Failed to load payment settings', detail: String(error) }, 500);
    }
  }
  if (request.method === 'POST') {
    if (!(await isAuthorized(request, sql))) {
      return unauthorized();
    }
    try {
      const body = (await request.json()) as Partial<PaymentSettings>;
      const title = body.title ?? 'Rupee Calculator Pro Subscription';
      const upiId = body.upi_id ?? '';
      const qrCodeUrl = body.upi_qr_code_url ?? '';
      const amount = typeof body.amount === 'number' ? body.amount : 54;
      const instructions =
        body.instructions ??
        'Pay ₹54 for 1 Month Unlimited Access. Scan the QR code or pay to the UPI ID, then enter your Transaction UTR number.';
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
      return jsonResponse({ success: true, settings: updated[0] });
    } catch (error) {
      return jsonResponse(
        { error: 'Failed to update payment settings', detail: String(error) },
        500
      );
    }
  }
  return jsonResponse({ error: 'Method not allowed' }, 405);
}
