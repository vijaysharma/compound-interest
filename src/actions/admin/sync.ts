'use server';
import { ensureTables, getDb, isAuthorizedUser, MF_URL } from '@/lib/db';
import { redisSet } from '@/lib/redis';
const WORLD_BANK_PPP_API =
  'https://api.worldbank.org/v2/country/all/indicator/PA.NUS.PPP?format=json&per_page=300&mrv=1';
export async function syncMutualFundsAction(token?: string | null): Promise<{ synced: number }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  const upstream = await fetch(MF_URL, { headers: { Accept: 'application/json' } });
  if (!upstream.ok) {
    throw new Error(`MF API returned ${upstream.status}`);
  }
  const payload = await upstream.json();
  if (!Array.isArray(payload)) {
    throw new Error('MF API returned an invalid list');
  }
  await sql`DELETE FROM mutual_fund_schemes`;
  await sql`
    INSERT INTO mutual_fund_schemes (scheme_code, scheme_name, payload)
    SELECT item->>'schemeCode', item->>'schemeName', item
    FROM jsonb_array_elements(${JSON.stringify(payload)}::jsonb) AS item
    WHERE item->>'schemeCode' IS NOT NULL AND item->>'schemeName' IS NOT NULL
    ON CONFLICT (scheme_code) DO UPDATE SET
      scheme_name = EXCLUDED.scheme_name, payload = EXCLUDED.payload, updated_at = NOW()
  `;
  const compactSchemes = payload
    .filter((item: { schemeCode?: unknown; schemeName?: unknown }) => item?.schemeCode && item?.schemeName)
    .map((item: { schemeCode: number | string; schemeName: string }) => ({
      schemeCode: Number(item.schemeCode),
      schemeName: String(item.schemeName),
    }));
  await redisSet('cache:mf:all_schemes', compactSchemes, 86400 * 30).catch(() => {});
  return { synced: payload.length };
}
export async function syncIMFAction(
  payload: unknown,
  token?: string | null
): Promise<{ synced: boolean }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('IMF payload must be a JSON object');
  }
  await sql`
    INSERT INTO inflation_sources (source, payload)
    VALUES ('imf-pcpipch', ${JSON.stringify(payload)}::jsonb)
    ON CONFLICT (source) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
  `;
  return { synced: true };
}
export async function syncPPPAction(
  inputPayload?: unknown,
  token?: string | null
): Promise<{ synced: number | boolean }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  let payload = inputPayload;
  if (!payload) {
    const upstream = await fetch(WORLD_BANK_PPP_API, {
      headers: { Accept: 'application/json' },
    });
    if (!upstream.ok) {
      throw new Error(`World Bank API returned ${upstream.status}`);
    }
    payload = await upstream.json();
  }
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid PPP payload format');
  }
  await sql`
    INSERT INTO inflation_sources (source, payload)
    VALUES ('world-bank-ppp', ${JSON.stringify(payload)}::jsonb)
    ON CONFLICT (source) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
  `;
  let count = 0;
  if (Array.isArray(payload)) {
    if (Array.isArray(payload[1])) {
      count = payload[1].length;
    } else {
      count = payload.length;
    }
  }
  return { synced: count || true };
}
