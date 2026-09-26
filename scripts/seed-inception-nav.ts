import { ensureTables, getDb } from '../src/lib/db';
import { getActiveTrackedSchemes } from '../src/lib/amfi/trackedSchemes';
import { upsertWhitelistedNavBatch, updateRedisNavCache } from '../src/lib/amfi/amfiNavStorage';
import { redisSet } from '../src/lib/redis';
import { navPayloadKey } from '../src/actions/data/constants';
import { parseAnyDate } from '../src/utilities/dateUtils';
import type { AmfiNavRecord } from '../src/lib/amfi/amfiNavTypes';
try {
  if (typeof process.loadEnvFile === 'function') {
    try { process.loadEnvFile('.env.local'); } catch { /* ignore */ }
    try { process.loadEnvFile('.env'); } catch { /* ignore */ }
  }
} catch { /* ignore */ }
interface MfApiResponse {
  status?: string;
  meta?: { scheme_code?: number | string; scheme_name?: string };
  data?: Array<{ date: string; nav: string }>;
}
function toIsoDate(ddMmYyyy: string): string | null {
  const d = parseAnyDate(ddMmYyyy);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}
async function seedSchemeInception(
  schemeCode: string,
  schemeName: string,
  sinceDate?: string
): Promise<{ count: number; oldest: string | null; newest: string | null }> {
  const url = `https://api.mfapi.in/mf/${schemeCode}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) return { count: 0, oldest: null, newest: null };
  const json = (await res.json()) as MfApiResponse;
  const rows = json.data ?? [];
  if (rows.length === 0) return { count: 0, oldest: null, newest: null };
  const records: AmfiNavRecord[] = [];
  let oldest: string | null = null;
  let newest: string | null = null;
  for (const r of rows) {
    const iso = toIsoDate(r.date);
    const navVal = parseFloat(r.nav);
    if (!iso || !Number.isFinite(navVal) || navVal <= 0) continue;
    if (sinceDate && iso < sinceDate) continue;
    records.push({ schemeCode, schemeName, nav: navVal, date: iso });
    if (!oldest || iso < oldest) oldest = iso;
    if (!newest || iso > newest) newest = iso;
  }
  const inserted = await upsertWhitelistedNavBatch(records, 5000);
  await updateRedisNavCache(records);
  const payload = { meta: { scheme_code: schemeCode, scheme_name: schemeName }, data: rows };
  await redisSet(navPayloadKey(schemeCode), payload, 7 * 24 * 3600).catch(() => {});
  return { count: inserted, oldest, newest };
}
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let since = '2008-01-01';
  let concurrency = 4;
  for (const arg of args) {
    if (arg.startsWith('--since=')) since = arg.split('=')[1];
    if (arg.startsWith('--concurrency=')) concurrency = Math.max(1, parseInt(arg.split('=')[1], 10) || 4);
  }
  console.log(`[seed-inception] Seeding historical NAVs since ${since} (concurrency: ${concurrency})...`);
  const sql = getDb();
  await ensureTables(sql);
  const schemes = await getActiveTrackedSchemes(sql);
  console.log(`[seed-inception] Processing ${schemes.length} active tracked schemes.`);
  let cursor = 0;
  let totalRows = 0;
  const startedAt = Date.now();
  async function worker(id: number): Promise<void> {
    while (cursor < schemes.length) {
      const idx = cursor++;
      const s = schemes[idx];
      const start = Date.now();
      try {
        const { count, oldest, newest } = await seedSchemeInception(s.scheme_code, s.scheme_name, since);
        totalRows += count;
        console.log(`[Worker ${id}] [${idx + 1}/${schemes.length}] ${s.scheme_code} (${s.scheme_name.slice(0, 35)}...): ${count} rows [${oldest ?? 'N/A'} -> ${newest ?? 'N/A'}] in ${Date.now() - start}ms`);
      } catch (err) {
        console.warn(`[Worker ${id}] [${idx + 1}/${schemes.length}] ${s.scheme_code} failed:`, err instanceof Error ? err.message : err);
      }
    }
  }
  const workers = Array.from({ length: concurrency }, (_, i) => worker(i + 1));
  await Promise.all(workers);
  console.log(`\n[seed-inception] Completed in ${Math.round((Date.now() - startedAt) / 1000)}s.`);
  console.log(`[seed-inception] Total rows inserted/updated in mutual_fund_nav: ${totalRows}`);
}
main().then(() => process.exit(0)).catch((err) => { console.error('Fatal:', err); process.exit(1); });
