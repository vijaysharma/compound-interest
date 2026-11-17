import { checkDateExistsInDb, upsertWhitelistedNavBatch, updateRedisNavCache } from '@/lib/amfi/amfiNavStorage';
import { getActiveSchemeCodeSet } from '@/lib/amfi/trackedSchemes';
import { fetchTradingDayWithFallback } from '@/lib/amfi/amfiSingleDayFetcher';
import type { SingleDaySyncResult } from '@/lib/amfi/amfiNavTypes';
import { getDb, isAuthorizedUser } from '@/lib/db';
async function isAuthorized(req: Request): Promise<boolean> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return false;
  try {
    const sql = getDb();
    return await isAuthorizedUser(authHeader, sql);
  } catch {
    // Fallback: verify stateless tokens (CRON_SECRET or ADMIN_SYNC_TOKEN) without DB
    return await isAuthorizedUser(authHeader);
  }
}
async function resolveRequestedDate(req: Request): Promise<string> {
  const url = new URL(req.url);
  const queryDate = url.searchParams.get('date');
  if (queryDate && /^\d{4}-\d{2}-\d{2}$/.test(queryDate)) return queryDate;
  if (req.method === 'POST') {
    try {
      const body = (await req.json()) as { date?: string };
      if (body?.date && /^\d{4}-\d{2}-\d{2}$/.test(body.date)) return body.date;
    } catch {
      // Body not JSON
    }
  }
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}
export async function POST(req: Request): Promise<Response> {
  if (!(await isAuthorized(req))) {
    return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }
  const targetDate = await resolveRequestedDate(req);
  const existingCount = await checkDateExistsInDb(targetDate);
  if (existingCount > 0) {
    const res: SingleDaySyncResult = {
      success: true,
      dateSynced: targetDate,
      totalRecords: existingCount,
      message: `NAV data for ${targetDate} already exists in database (${existingCount} records).`,
    };
    return Response.json(res);
  }
  const activeCodes = await getActiveSchemeCodeSet();
  const { records, syncedDate, isFallback } = await fetchTradingDayWithFallback(targetDate, activeCodes);
  if (records.length === 0) {
    const res: SingleDaySyncResult = {
      success: false,
      dateSynced: targetDate,
      totalRecords: 0,
      error: `No AMFI NAV data found for ${targetDate} or preceding trading days.`,
    };
    return Response.json(res, { status: 404 });
  }
  const insertedCount = await upsertWhitelistedNavBatch(records, 5000);
  await updateRedisNavCache(records);
  const res: SingleDaySyncResult = {
    success: true,
    dateSynced: syncedDate,
    requestedDate: targetDate,
    isFallback,
    totalRecords: insertedCount,
    message: isFallback
      ? `Requested ${targetDate} was a non-trading day/holiday. Synced most recent preceding trading day ${syncedDate}.`
      : `Successfully synced ${insertedCount} AMFI NAV records for ${syncedDate}.`,
  };
  return Response.json(res);
}
export async function GET(req: Request): Promise<Response> {
  return POST(req);
}
