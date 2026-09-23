import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ensureTables } from '@/lib/db/migrations';
import { parseNavPayload, NAV_BATCH_CONCURRENCY } from '@/actions/data/constants';
import { probeMarketWatermark, readWatermark } from '@/actions/data/navWatermark';
import {
  BACKGROUND_FETCH_TIMEOUT_MS,
  type RefreshOutcome,
  refreshSchemeIfStale,
} from '@/actions/data/navSync';
/**
 * Scheduled NAV refresh.
 *
 * Reads are served from storage and never wait on the third-party API, which
 * means nothing in the read path is responsible for keeping data current any
 * more. Without a schedule, freshness would depend on somebody happening to
 * load a page — fine for a popular fund, useless for one nobody has opened in a
 * week. This route is what makes currency independent of traffic.
 *
 * It is deliberately bounded: one market probe, then at most
 * `MAX_SCHEMES_PER_RUN` of the schemes furthest behind. A run that tried to
 * refresh the whole catalogue would exceed the 30s function limit in
 * `vercel.json` and be killed part-way, which is both slower and harder to
 * reason about than converging over several runs.
 *
 * ## Once a day, not twice
 *
 * The schedule in `vercel.json` is a single daily run at 19:00 UTC (00:30 IST),
 * just after the publication window. It was briefly two runs a day, which is
 * rejected on Vercel's Hobby plan — cron schedules there may fire at most once
 * per day — and an invalid schedule fails the *deployment*, not just the cron,
 * so nothing reached production at all.
 *
 * One run a day is enough because nothing user-facing depends on it: reads are
 * served from storage and never wait on upstream, and `after()` refreshes a
 * scheme opportunistically whenever somebody loads a page that uses it. The
 * cron is the backstop for schemes nobody visits. If the catalogue grows past
 * what one run can converge — watch `ranOutOfTime` in the response — raise
 * `REFRESH_BUDGET_MS`, or move to a plan that allows a tighter schedule.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
/**
 * Upper bound on how many schemes a single run will consider.
 *
 * Comfortably more than a run can refresh, because most candidates cost almost
 * nothing: a scheme inside its backoff window is skipped after a single Redis
 * check. Selecting a short list instead meant permanently stalled schemes —
 * merged funds, matured close-ended series — filled it, since the query is
 * ordered oldest-first and their `latest_nav_date` never moves.
 */
const MAX_SCHEMES_PER_RUN = 40;
/**
 * Wall-clock budget for the refresh loop, under the 30s `maxDuration`.
 *
 * A count-based limit alone is not enough, and that is measured rather than
 * assumed: a run of 12 schemes at concurrency 4 took **34.3s** against the live
 * provider and would have been killed mid-flight, losing the response and any
 * idea of how far it had got. Provider latency varies by a factor of fifty
 * (1.2s to 62s for the same request), so no fixed count is safe.
 *
 * Workers therefore stop picking up new schemes once the budget is spent and
 * the run returns cleanly, reporting what it managed. The next run continues
 * from the same query, which is ordered oldest-first, so progress is monotonic.
 */
const REFRESH_BUDGET_MS = 20_000;
/**
 * Rejects anything without the shared secret.
 *
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Absent a configured
 * secret the route refuses every request rather than defaulting to open — an
 * unauthenticated endpoint that triggers third-party fetches is an easy way to
 * burn someone else's rate limit.
 *
 * Compared with `timingSafeEqual` rather than `===`. The practical risk of a
 * timing attack across the public internet is slight, but `===` returns as soon
 * as two bytes differ, so it leaks how much of a guess was correct — and the
 * constant-time version costs nothing. Lengths are checked first because
 * `timingSafeEqual` throws on a mismatch, and the length of a secret is not
 * itself worth protecting.
 */
function isAuthorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get('authorization') ?? '';
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}
export async function GET(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }
  const startedAt = Date.now();
  /*
   * The probe runs alongside the refresh loop rather than before it.
   *
   * Choosing which schemes to refresh only needs the watermark we already have
   * — the probe exists to discover whether publication has *advanced*, which
   * matters for the next run, not this one. Awaiting it first was measurably
   * wasteful: a run where the provider took ~25s to answer `/latest` spent its
   * entire budget on the probe and refreshed nothing at all.
   *
   * `force: true` bypasses the probe's own backoff, because the schedule is the
   * rate limit in this context.
   */
  const existing = await readWatermark();
  const probePromise = probeMarketWatermark({ force: true });
  // With no watermark at all there is nothing to select against, so the first
  // ever run does have to wait for the probe.
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
  let candidates: Array<{ scheme_code: string; payload: unknown }> = [];
  try {
    await ensureTables(getDb());
    const sql = getDb();
    // Behind the watermark, oldest first, so repeated runs converge instead of
    // re-examining the same schemes. `latest_nav_date IS NULL` covers rows that
    // predate the column and have not been refreshed since.
    candidates = (await sql`
      SELECT scheme_code, payload
      FROM mutual_fund_nav
      WHERE latest_nav_date IS NULL OR latest_nav_date < ${watermark.date}::date
      ORDER BY latest_nav_date ASC NULLS FIRST
      LIMIT ${MAX_SCHEMES_PER_RUN}
    `) as Array<{ scheme_code: string; payload: unknown }>;
  } catch (dbErr) {
    console.warn('[nav][cron] candidate query failed:', dbErr);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
  /*
   * Goes through `refreshSchemeIfStale` rather than fetching directly, so each
   * scheme's own backoff window is honoured.
   *
   * Fetching directly meant the four permanently-stalled schemes in this table
   * — HDFC Balanced (merged in 2018), two matured ICICI Value Fund series, an
   * ICICI Blended Plan last priced in 2016 — were each given a full 25s attempt
   * on *every* run. They sort first, being the oldest, so with a pool of four
   * they could consume the entire budget and leave nothing for schemes that can
   * actually make progress. Their backoff now holds them at one attempt a day
   * and every other slot goes to useful work.
   */
  const outcomes: Record<RefreshOutcome, number> = {
    current: 0,
    gated: 0,
    refreshed: 0,
    behind: 0,
    failed: 0,
  };
  let ranOutOfTime = 0;
  let cursor = 0;
  const deadline = startedAt + REFRESH_BUDGET_MS;
  const workers = Array.from(
    { length: Math.min(NAV_BATCH_CONCURRENCY, candidates.length) },
    async () => {
      while (cursor < candidates.length) {
        const row = candidates[cursor++];
        if (Date.now() >= deadline) {
          ranOutOfTime += 1;
          continue;
        }
        // Never let one scheme overrun what is left of the budget.
        const remaining = Math.max(1000, deadline - Date.now());
        const outcome = await refreshSchemeIfStale(
          row.scheme_code,
          parseNavPayload(row.payload),
          Math.min(BACKGROUND_FETCH_TIMEOUT_MS, remaining)
        );
        outcomes[outcome] += 1;
      }
    }
  );
  // Both must settle before the response, or the runtime freezes the function
  // with the probe still in flight and its result is lost.
  const [, probe] = await Promise.all([Promise.all(workers), probePromise]);
  const latestWatermark = probe.watermark ?? watermark;
  return NextResponse.json({
    ok: true,
    watermark: latestWatermark.date,
    watermarkAdvanced: probe.advanced,
    noAdvanceCount: latestWatermark.noAdvanceCount,
    candidates: candidates.length,
    ...outcomes,
    // Non-zero means the budget ran out; the next run picks these up.
    ranOutOfTime,
    elapsedMs: Date.now() - startedAt,
  });
}
