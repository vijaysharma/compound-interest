import { ensureTables, getDb, jsonResponse } from './_db';
export const config = {
  runtime: 'edge',
};
export default async function handler(): Promise<Response> {
  try {
    const sql = getDb();
    await ensureTables(sql);
    const rows = (await sql`
      SELECT payload FROM inflation_sources WHERE source = 'world-bank-ppp'
    `) as Array<{ payload: unknown }>;
    if (rows.length === 0) {
      return jsonResponse({ error: 'World Bank PPP data has not been synced by an administrator' }, 404);
    }
    return jsonResponse(rows[0].payload);
  } catch (err) {
    return jsonResponse({ error: 'Failed to read PPP data', detail: String(err) }, 503);
  }
}
