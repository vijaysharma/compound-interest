import { NextResponse } from 'next/server';
import { getDb, ensureTables } from '@/lib/db';
import {
  fetchNSELiveFiiDii,
  fetchYahooIndexPrices,
  fetchWorldBankCPI,
  fetchWorldBankPPP,
  getLatestEligibleFiiDiiDate,
} from '@/lib/fiiDii/fiiDiiFetcher';
import {
  upsertInstitutionalFlow,
  upsertIndexPricesBatch,
  upsertMacroIndicatorsBatch,
} from '@/lib/fiiDii/fiiDiiRepository';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = req.headers.get('authorization');
  if (authHeader === `Bearer ${secret}`) return true;
  const url = new URL(req.url);
  return url.searchParams.get('key') === secret;
}
export async function GET(req: Request): Promise<NextResponse> {
  const startedAt = Date.now();
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }
  const sql = getDb();
  await ensureTables(sql);
  const results: Record<string, unknown> = {};
  const maxEligibleDate = getLatestEligibleFiiDiiDate();
  // 1. Fetch & Upsert Today's Official FII/DII Data
  try {
    const liveFlow = await fetchNSELiveFiiDii();
    if (liveFlow && liveFlow.tradeDate <= maxEligibleDate) {
      await upsertInstitutionalFlow(sql, liveFlow);
      results.flow = {
        tradeDate: liveFlow.tradeDate,
        fiiNetCrores: liveFlow.fiiNetCrores,
        diiNetCrores: liveFlow.diiNetCrores,
      };
    } else {
      results.flow = {
        synced: false,
        message: liveFlow
          ? `NSE returned date ${liveFlow.tradeDate} which is past eligible cutoff (${maxEligibleDate})`
          : 'No live flow returned from NSE (market may be open or data not yet published)',
      };
    }
  } catch (err) {
    results.flow = { error: err instanceof Error ? err.message : String(err) };
  }
  // 2. Fetch & Upsert Recent Index Prices (Nifty 50 and Sensex) clamped to closed days
  try {
    const [niftyPrices, sensexPrices] = await Promise.all([
      fetchYahooIndexPrices('^NSEI', '5d'),
      fetchYahooIndexPrices('^BSESN', '5d'),
    ]);
    const validNifty = niftyPrices.filter((p) => p.tradeDate <= maxEligibleDate);
    const validSensex = sensexPrices.filter((p) => p.tradeDate <= maxEligibleDate);
    const [niftyCount, sensexCount] = await Promise.all([
      upsertIndexPricesBatch(sql, 'NIFTY50', validNifty),
      upsertIndexPricesBatch(sql, 'SENSEX', validSensex),
    ]);
    results.indices = {
      niftyCount,
      sensexCount,
      latestNifty: validNifty[validNifty.length - 1],
      latestSensex: validSensex[validSensex.length - 1],
    };
  } catch (err) {
    results.indices = { error: err instanceof Error ? err.message : String(err) };
  }
  // 3. Ensure Current Year Macro Indicators
  try {
    const currentYear = new Date().getFullYear().toString();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const recordDate = `${currentYear}-${currentMonth}-01`;
    const existingMacro = (await sql`
      SELECT record_date FROM macro_indicators WHERE record_date = ${recordDate} LIMIT 1
    `) as Array<{ record_date: string }>;
    if (existingMacro.length === 0) {
      const [cpiMap, pppMap] = await Promise.all([
        fetchWorldBankCPI(),
        fetchWorldBankPPP(),
      ]);
      const cpi = cpiMap[currentYear] || 208.5;
      const ppp = pppMap[currentYear] || 24.8;
      await upsertMacroIndicatorsBatch(sql, [{ recordDate, cpiIndex: cpi, pppFactor: ppp }]);
      results.macro = { updated: true, recordDate, cpi, ppp };
    } else {
      results.macro = { updated: false, recordDate, message: 'Already exists' };
    }
  } catch (err) {
    results.macro = { error: err instanceof Error ? err.message : String(err) };
  }
  return NextResponse.json({
    ok: true,
    results,
    elapsedMs: Date.now() - startedAt,
  });
}
