import { ensureTables, getDb, jsonResponse } from '../_db';
export const config = { runtime: 'edge' };
export default async function handler(): Promise<Response> {
  try {
    const sql = getDb();
    await ensureTables(sql);
    const rows = (await sql`
      SELECT payload FROM mutual_fund_schemes ORDER BY scheme_name ASC
    `) as Array<{ payload: unknown }>;
    return jsonResponse(rows.map((row) => row.payload));
  } catch (error) {
    return jsonResponse({ error: 'Failed to read mutual funds', detail: String(error) }, 503);
  }
}
