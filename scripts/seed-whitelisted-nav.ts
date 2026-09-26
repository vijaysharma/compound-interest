import { formatAmfiDate } from '../src/lib/amfi/amfiDate';
import { parseAmfiRawTextToRecords } from '../src/lib/amfi/amfiSingleDayFetcher';
import { upsertWhitelistedNavBatch, updateRedisNavCache } from '../src/lib/amfi/amfiNavStorage';
import { getActiveSchemeCodeSet } from '../src/lib/amfi/trackedSchemes';
import { ensureTables, getDb } from '../src/lib/db';
import type { SeederOptions } from '../src/lib/amfi/amfiNavTypes';
try {
  if (typeof process.loadEnvFile === 'function') {
    try { process.loadEnvFile('.env.local'); } catch { /* ignore */ }
    try { process.loadEnvFile('.env'); } catch { /* ignore */ }
  }
} catch { /* ignore */ }
function parseCliArgs(): SeederOptions {
  const args = process.argv.slice(2);
  let days = 900;
  let offset = 0;
  let batchSize = 5000;
  for (const arg of args) {
    if (arg.startsWith('--days=')) days = Math.max(1, parseInt(arg.split('=')[1], 10) || 900);
    if (arg.startsWith('--offset=')) offset = Math.max(0, parseInt(arg.split('=')[1], 10) || 0);
    if (arg.startsWith('--batchSize=')) batchSize = Math.max(100, parseInt(arg.split('=')[1], 10) || 5000);
  }
  return { days, offset, batchSize };
}
function addDays(iso: string, d: number): string {
  const dt = new Date(`${iso}T00:00:00Z`);
  dt.setUTCDate(dt.getUTCDate() + d);
  return dt.toISOString().slice(0, 10);
}
async function fetchAmfiChunkText(fromAmfi: string, toAmfi: string, timeoutMs = 60_000): Promise<string> {
  const url = `https://portal.amfiindia.com/DownloadNAVHistoryReport_Po.aspx?frmdt=${fromAmfi}&todt=${toAmfi}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', Accept: 'text/plain,*/*' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`AMFI returned HTTP ${res.status}`);
  return res.text();
}
async function runSeeder(): Promise<void> {
  const { days, offset, batchSize } = parseCliArgs();
  console.log(`[seed-whitelisted-nav] Starting: ${days} days, offset: ${offset}, batchSize: ${batchSize}`);
  const sql = getDb();
  await ensureTables(sql);
  const activeCodes = await getActiveSchemeCodeSet(sql);
  console.log(`[seed-whitelisted-nav] Filtering against ${activeCodes.size} active tracked schemes.`);
  if (activeCodes.size === 0) throw new Error('No tracked schemes found in database. Seed tracked_schemes first.');
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  let cursorEndDate = addDays(now.toISOString().slice(0, 10), -offset);
  let daysRemaining = days;
  let chunkIndex = 1;
  const totalChunks = Math.ceil(days / 90);
  let grandTotalUpserted = 0;
  const startTime = Date.now();
  while (daysRemaining > 0) {
    const chunkDays = Math.min(daysRemaining, 90);
    const chunkStartDate = addDays(cursorEndDate, -(chunkDays - 1));
    const fromAmfi = formatAmfiDate(chunkStartDate);
    const toAmfi = formatAmfiDate(cursorEndDate);
    const chunkStartMs = Date.now();
    console.log(`\n[Chunk ${chunkIndex}/${totalChunks}] Fetching AMFI interval: ${fromAmfi} to ${toAmfi} (${chunkDays} days)...`);
    try {
      const rawText = await fetchAmfiChunkText(fromAmfi, toAmfi);
      const filteredRecords = parseAmfiRawTextToRecords(rawText, activeCodes);
      console.log(`[Chunk ${chunkIndex}] Matched ${filteredRecords.length} records for tracked schemes.`);
      const upserted = await upsertWhitelistedNavBatch(filteredRecords, batchSize);
      await updateRedisNavCache(filteredRecords);
      grandTotalUpserted += upserted;
      const memMb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
      console.log(`[Chunk ${chunkIndex}] Done in ${Date.now() - chunkStartMs}ms. Upserted: ${upserted}. Memory: ${memMb}MB.`);
    } catch (err) {
      console.error(`[Chunk ${chunkIndex}] Failed:`, err instanceof Error ? err.message : err);
    }
    cursorEndDate = addDays(chunkStartDate, -1);
    daysRemaining -= chunkDays;
    chunkIndex++;
  }
  console.log(`\n[seed-whitelisted-nav] Completed in ${Math.round((Date.now() - startTime) / 1000)}s.`);
  console.log(`[seed-whitelisted-nav] Total rows upserted into mutual_fund_nav: ${grandTotalUpserted}`);
}
runSeeder().then(() => process.exit(0)).catch((err) => { console.error('Seeder fatal error:', err); process.exit(1); });
