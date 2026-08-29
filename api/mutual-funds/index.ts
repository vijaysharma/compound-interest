import { ensureTables, getDb, jsonResponse } from '../_db';
export const config = { runtime: 'edge' };
export default async function handler(request: Request): Promise<Response> {
  try {
    const sql = getDb();
    await ensureTables(sql);
    const search = new URL(request.url).searchParams.get('q')?.trim() ?? '';
    const rows = (await sql`
      SELECT payload FROM mutual_fund_schemes
      WHERE ${search} = '' OR scheme_name ILIKE ${`%${search}%`}
      ORDER BY scheme_name ASC
      LIMIT 500
    `) as Array<{ payload: unknown }>;
    return jsonResponse(rows.map((row) => row.payload));
  } catch (error) {
    return jsonResponse({ error: 'Failed to read mutual funds', detail: String(error) }, 503);
  }
}
