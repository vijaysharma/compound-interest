import { NextResponse } from 'next/server';
import { probeMarketWatermark } from '@/actions/data/navWatermark';
import { syncTrackedSchemesFromAmfi } from '@/lib/amfi/trackedNavSync';
import { isCronAuthorised } from './cronNavWorker';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
// Leaves headroom under maxDuration for the watermark probe and the response.
const SYNC_BUDGET_MS = 24_000;
/**
 * Nightly (~1 AM IST, vercel.json): brings every tracked scheme's stored NAV up to date from AMFI
 * and re-probes the market watermark the request path's freshness checks use.
 */
export async function GET(request: Request) {
  if (!isCronAuthorised(request)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }
  const startedAt = Date.now();
  const [sync, probe] = await Promise.all([
    syncTrackedSchemesFromAmfi({ deadline: startedAt + SYNC_BUDGET_MS }).catch((err) => {
      console.warn('[nav][cron] tracked sync failed:', err);
      return null;
    }),
    probeMarketWatermark({ force: true }),
  ]);
  if (!sync) return NextResponse.json({ error: 'Tracked NAV sync failed' }, { status: 503 });
  return NextResponse.json({
    ok: !sync.error,
    watermark: probe.watermark?.date ?? null,
    watermarkAdvanced: probe.advanced,
    ...sync,
    elapsedMs: Date.now() - startedAt,
  });
}
