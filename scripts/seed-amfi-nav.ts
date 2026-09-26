import { formatAmfiDate } from '../src/lib/amfi/amfiDate';
import { parseAmfiRawTextToRecords } from '../src/lib/amfi/amfiSingleDayFetcher';
import { upsertDailyNavBatch, updateRedisNavCache } from '../src/lib/amfi/amfiDailyStorage';
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
  console.log(`[seed-amfi-nav] Starting historical seeding: ${days} days, offset: ${offset}, batchSize: ${batchSize}`);
  const sql = getDb();
  await ensureTables(sql);
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  let cursorEndDate = addDays(now.toISOString().slice(0, 10), -offset);
  let daysRemaining = days;
  let chunkIndex = 1;
  const totalChunks = Math.ceil(days / 90);
  let grandTotalRecords = 0;
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
      const records = parseAmfiRawTextToRecords(rawText);
      console.log(`  Parsed ${records.length.toLocaleString()} records from AMFI (${(rawText.length / 1024 / 1024).toFixed(1)} MB).`);
      if (records.length > 0) {
        const upserted = await upsertDailyNavBatch(records, batchSize);
        grandTotalRecords += records.length;
        grandTotalUpserted += upserted;
        const redisUpdated = await updateRedisNavCache(records);
        console.log(`  Upserted ${upserted.toLocaleString()} records into Postgres in chunks of ${batchSize}. Redis cached ${redisUpdated} schemes.`);
      } else {
        console.log(`  Skipping: No trading records found for this interval.`);
      }
    } catch (chunkErr) {
      console.warn(`  Warning: Chunk ${fromAmfi} to ${toAmfi} failed: ${chunkErr instanceof Error ? chunkErr.message : String(chunkErr)}. Continuing...`);
    }
    console.log(`  Chunk ${chunkIndex} completed in ${((Date.now() - chunkStartMs) / 1000).toFixed(1)}s.`);
    cursorEndDate = addDays(chunkStartDate, -1);
    daysRemaining -= chunkDays;
    chunkIndex++;
  }
  const totalSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n[seed-amfi-nav] Seeding complete! Processed ${grandTotalRecords.toLocaleString()} records (${grandTotalUpserted.toLocaleString()} upserted) in ${totalSec}s.`);
  process.exit(0);
}
void runSeeder();
