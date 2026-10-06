import { syncTrackedSchemesFromAmfi } from '../src/lib/amfi/trackedNavSync';
try {
  if (typeof process.loadEnvFile === 'function') {
    try { process.loadEnvFile('.env.local'); } catch { /* ignore */ }
    try { process.loadEnvFile('.env'); } catch { /* ignore */ }
  }
} catch { /* ignore */ }
/**
 * Runs the nightly tracked-scheme NAV sync (normally /api/cron/sync-nav) without the cron's time
 * budget, so a backlog of gaps is filled in one go. Usage: npx tsx scripts/sync-tracked-nav.ts
 */
async function main(): Promise<void> {
  const startedAt = Date.now();
  const report = await syncTrackedSchemesFromAmfi({ deadline: Number.POSITIVE_INFINITY });
  console.log(JSON.stringify(report, null, 2));
  console.log(`[sync-tracked-nav] Completed in ${Math.round((Date.now() - startedAt) / 1000)}s.`);
}
main().then(() => process.exit(0)).catch((err) => { console.error('Fatal:', err); process.exit(1); });
