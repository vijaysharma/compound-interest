import { getNavHistory } from '@/lib/amfi/navRepository';
import { readStored } from '@/actions/data/navStoredReader';
import { isSchemeTracked } from '@/lib/amfi/trackedSchemes';
import { ensureSchemeTrackedAndBackfilled } from '@/lib/amfi/autoInclusion';
import { syncSchemeFromUpstream } from '@/actions/data/navUpstreamSync';
import { FIRST_FETCH_TIMEOUT_MS } from '@/actions/data/navSync';
export async function GET(
  request: Request,
  context: { params: Promise<{ schemeCode: string }> }
): Promise<Response> {
  const { schemeCode } = await context.params;
  const cleanCode = String(schemeCode).trim();
  if (!/^\d{1,10}$/.test(cleanCode)) {
    return Response.json({ error: 'Invalid scheme code. Must be numeric.' }, { status: 400 });
  }
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate') ?? undefined;
  const endDate = searchParams.get('endDate') ?? undefined;
  if (!(await isSchemeTracked(cleanCode))) {
    await ensureSchemeTrackedAndBackfilled(cleanCode);
  }
  let stored = await readStored(cleanCode);
  if (!stored.payload) {
    const fetched = await syncSchemeFromUpstream(cleanCode, FIRST_FETCH_TIMEOUT_MS, null);
    if (!fetched) {
      return Response.json({ error: `Scheme ${cleanCode} not found in AMFI database` }, { status: 404 });
    }
    stored = { payload: fetched, latest: null, fromDb: false };
  }
  const rows = await getNavHistory(cleanCode, startDate, endDate);
  const payload = stored.payload as { meta?: unknown; latest_nav_date?: string };
  return Response.json({
    meta: payload?.meta ?? { scheme_code: cleanCode },
    data: rows,
    latest_nav_date: stored.latest ?? payload?.latest_nav_date ?? null,
    source: 'Official AMFI (Association of Mutual Funds in India)',
  });
}
