import { ensureTables, getDb, jsonResponse } from '../_db';
export const config = { runtime: 'edge' };
export default async function handler(request: Request): Promise<Response> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
    if (token) {
      const sql = getDb();
      await ensureTables(sql);
      await sql`DELETE FROM user_sessions WHERE token = ${token}`;
    }
    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ error: 'Logout failed', detail: String(error) }, 500);
  }
}
