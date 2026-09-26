import { NextResponse } from 'next/server';
import { getActiveSchemeCodeSet } from '@/lib/amfi/trackedSchemes';
import { fetchTradingDayWithFallback } from '@/lib/amfi/amfiSingleDayFetcher';
import { upsertWhitelistedNavBatch, updateRedisNavCache } from '@/lib/amfi/amfiNavStorage';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const authHeader = req.headers.get('authorization');
  return authHeader === `Bearer ${secret}`;
}
export async function GET(req: Request): Promise<NextResponse> {
  const startedAt = Date.now();
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }
  const url = new URL(req.url);
  const requestedDate = url.searchParams.get('date') ?? new Date().toISOString().slice(0, 10);
  const activeCodes = await getActiveSchemeCodeSet();
  if (activeCodes.size === 0) {
    return NextResponse.json({ ok: false, message: 'No tracked schemes configured.' }, { status: 400 });
  }
  const { records, syncedDate, isFallback } = await fetchTradingDayWithFallback(requestedDate, activeCodes);
  if (records.length === 0) {
    return NextResponse.json({
      ok: false,
      message: `No AMFI NAV data found for ${requestedDate} or preceding trading days.`,
      elapsedMs: Date.now() - startedAt,
    }, { status: 404 });
  }
  const upsertedCount = await upsertWhitelistedNavBatch(records, 5000);
  await updateRedisNavCache(records);
  return NextResponse.json({
    ok: true,
    targetDate: requestedDate,
    syncedDate,
    isFallback,
    trackedSchemes: activeCodes.size,
    recordsSynced: upsertedCount,
    elapsedMs: Date.now() - startedAt,
  });
}
