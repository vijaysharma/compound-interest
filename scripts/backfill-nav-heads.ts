import { getDb } from '../src/lib/db';
import { fetchAmfiLatest } from '../src/lib/amfi/amfiClient';
import { resolveAmfiFundHouseCode } from '../src/lib/amfi/amfiFundHouses';
import { backfillSchemeFromAmfi } from '../src/lib/amfi/amfiSchemeBackfill';
import { mfNavCache, navPayloadKey } from '../src/actions/data/constants';
import { redisDel } from '../src/lib/redis';
try {
  if (typeof process.loadEnvFile === 'function') {
    try { process.loadEnvFile('.env.local'); } catch { /* ignore */ }
    try { process.loadEnvFile('.env'); } catch { /* ignore */ }
  }
} catch { /* ignore */ }
/**
 * Completes the start of tracked schemes' stored NAV history. Older bulk imports stored some
 * schemes only from a later date (e.g. HDFC Large Cap Direct from 2022 though it launched in 2013),
 * which the length-based backfill check can't see. For each tracked scheme AMFI still lists, this
 * asks AMFI for the 90 days before its earliest stored NAV; if there are rows it keeps walking back
 * to the scheme's launch. Usage: npx tsx scripts/backfill-nav-heads.ts [--concurrency=4]
 */
const shiftIso = (iso: string, days: number) =>
  new Date(new Date(`${iso}T00:00:00Z`).getTime() + days * 86_400_000).toISOString().slice(0, 10);
async function main(): Promise<void> {
  let concurrency = 4;
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--concurrency=')) concurrency = Math.max(1, parseInt(arg.split('=')[1], 10) || 4);
  }
  const sql = getDb();
  const schemes = (await sql`
    SELECT t.scheme_code, min(n.date)::text AS earliest
    FROM tracked_schemes t
    JOIN mutual_fund_nav n ON n.scheme_code = t.scheme_code::integer
    WHERE t.is_active
    GROUP BY t.scheme_code
    HAVING min(n.date) > '2006-04-01'
    ORDER BY t.scheme_code
  `) as Array<{ scheme_code: string; earliest: string }>;
  const latest = await fetchAmfiLatest(60_000);
  const listed = schemes.filter((s) => latest.schemes.get(String(s.scheme_code))?.fundHouse);
  console.log(`[nav-heads] ${listed.length} listed tracked schemes to check (concurrency ${concurrency}).`);
  let cursor = 0;
  let extended = 0;
  let totalRows = 0;
  const startedAt = Date.now();
  async function worker(): Promise<void> {
    while (cursor < listed.length) {
      const { scheme_code, earliest } = listed[cursor++];
      const code = String(scheme_code);
      const house = latest.schemes.get(code)!.fundHouse!;
      const mf = await resolveAmfiFundHouseCode(house);
      if (!mf) {
        console.warn(`[nav-heads] ${code}: no AMFI code for "${house}"`);
        continue;
      }
      const result = await backfillSchemeFromAmfi(code, mf, {
        fromIso: shiftIso(earliest, -1),
        deadline: Number.POSITIVE_INFINITY,
      });
      if (result.error) {
        console.warn(`[nav-heads] ${code}: AMFI error`, result.error);
        continue;
      }
      if (result.rows > 0) {
        extended += 1;
        totalRows += result.rows;
        mfNavCache.delete(code);
        await redisDel(navPayloadKey(code)).catch(() => false);
        console.log(`[nav-heads] ${code} (${result.schemeName?.slice(0, 45)}): history started ${earliest}, +${result.rows} earlier rows`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  console.log(`[nav-heads] ${extended} schemes extended, ${totalRows} rows, in ${Math.round((Date.now() - startedAt) / 1000)}s.`);
}
main().then(() => process.exit(0)).catch((err) => { console.error('Fatal:', err); process.exit(1); });
