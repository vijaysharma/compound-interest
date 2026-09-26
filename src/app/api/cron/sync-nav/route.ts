import { NextResponse } from 'next/server';
import { probeMarketWatermark, readWatermark } from '@/actions/data/navWatermark';
import {
  isCronAuthorised,
  fetchCronCandidates,
  executeCronWorkers,
  syncStoredSchemesFromAmfi,
  type CandidateRow,
} from './cronNavWorker';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
const MAX_SCHEMES_PER_RUN = 40;
const REFRESH_BUDGET_MS = 20_000;
export async function GET(request: Request) {
  if (!isCronAuthorised(request)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }
  const startedAt = Date.now();
  const existing = await readWatermark();
  const probePromise = probeMarketWatermark({ force: true });
  const probeForSelection = existing ? null : await probePromise;
  const watermark = existing ?? probeForSelection?.watermark ?? null;
  if (!watermark?.date) {
    const probe = await probePromise;
    return NextResponse.json({
      ok: true,
      probed: probe.probed,
      note: 'No watermark could be established; upstream is unreachable.',
      elapsedMs: Date.now() - startedAt,
    });
  }
  let candidates: CandidateRow[] = [];
  try {
    candidates = await fetchCronCandidates(watermark.date, MAX_SCHEMES_PER_RUN);
  } catch (dbErr) {
    console.warn('[nav][cron] candidate query failed:', dbErr);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
  const deadline = startedAt + REFRESH_BUDGET_MS;
  const [{ outcomes, ranOutOfTime }, probe, amfiSync] = await Promise.all([
    executeCronWorkers(candidates, deadline),
    probePromise,
    syncStoredSchemesFromAmfi(),
  ]);
  const latestWatermark = probe.watermark ?? watermark;
  return NextResponse.json({
    ok: true,
    watermark: latestWatermark.date,
    watermarkAdvanced: probe.advanced,
    noAdvanceCount: latestWatermark.noAdvanceCount,
    candidates: candidates.length,
    amfiSync,
    ...outcomes,
    ranOutOfTime,
    elapsedMs: Date.now() - startedAt,
  });
}
