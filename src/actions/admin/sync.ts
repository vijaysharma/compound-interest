'use server';
import { ensureTables, getDb, isAuthorizedUser } from '@/lib/db';
import { redisSet } from '@/lib/redis';
const WORLD_BANK_PPP_API =
  'https://api.worldbank.org/v2/country/all/indicator/PA.NUS.PPP?format=json&per_page=300&mrv=1';
export async function syncMutualFundsAction(token?: string | null): Promise<{ synced: number }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  const { fetchAmfiLatest } = await import('@/lib/amfi/amfiClient');
  const amfiParsed = await fetchAmfiLatest();
  const schemesList = Array.from(amfiParsed.schemes.entries()).map(([code, meta]) => ({
    schemeCode: code,
    schemeName: meta.schemeName,
    isinGrowth: meta.isinGrowth ?? null,
  }));
  if (schemesList.length === 0) {
    throw new Error('AMFI returned an invalid scheme list');
  }
  await sql`DELETE FROM mutual_fund_schemes`;
  await sql`
    INSERT INTO mutual_fund_schemes (scheme_code, scheme_name, payload)
    SELECT item->>'schemeCode', item->>'schemeName', item
    FROM jsonb_array_elements(${JSON.stringify(schemesList)}::jsonb) AS item
    WHERE item->>'schemeCode' IS NOT NULL AND item->>'schemeName' IS NOT NULL
    ON CONFLICT (scheme_code) DO UPDATE SET
      scheme_name = EXCLUDED.scheme_name, payload = EXCLUDED.payload, updated_at = NOW()
  `;
  const compactSchemes = schemesList.map((item) => ({
    schemeCode: Number(item.schemeCode),
    schemeName: item.schemeName,
  }));
  await redisSet('cache:mf:all_schemes', compactSchemes, 86400 * 30).catch(() => {});
  return { synced: schemesList.length };
}
/**
 * Parameter order matters here: `token` comes first, matching every other admin
 * action. It used to be `(payload, token)` while the only caller passed
 * `(token, body)` — so the token was stored as the payload and the payload used
 * as the token, and this action could never succeed. TypeScript could not see
 * it because an `unknown` first parameter accepts a token string happily.
 */
export async function syncIMFAction(
  token: string | null | undefined,
  payload: unknown
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
/** Token first, for the reason given on `syncIMFAction`. */
export async function syncPPPAction(
  token?: string | null,
  inputPayload?: unknown
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
