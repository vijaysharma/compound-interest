import { ensureTables, getDb, jsonResponse } from '../_db';
export const config = { runtime: 'edge' };
export default async function handler(request: Request): Promise<Response> {
  try {
    const sql = getDb();
    await ensureTables(sql);
    const search = new URL(request.url).searchParams.get('q')?.trim() ?? '';
    const searchPatterns = search
      .split(/\s+/)
      .filter(Boolean)
      .map((term) => `%${term}%`);
    const rows = (await sql`
      SELECT payload FROM mutual_fund_schemes
      WHERE ${searchPatterns.length === 0} OR scheme_name ILIKE ALL(${searchPatterns})
      ORDER BY scheme_name ASC
      LIMIT 1000
    `) as Array<{ payload: unknown }>;
    return jsonResponse(rows.map((row) => row.payload));
  } catch (error) {
    return jsonResponse({ error: 'Failed to read mutual funds', detail: String(error) }, 503);
  }
}
