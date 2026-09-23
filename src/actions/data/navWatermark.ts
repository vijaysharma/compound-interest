import { MF_URL } from '@/lib/db';
import { redisGet, redisSet, redisSetIfAbsent } from '@/lib/redis';
import { navFreshnessCeiling } from '../../utilities/navCalendar';
import { navDateToISO } from '../../utilities/dateUtils';
import {
  SCHEME_MAX_INTERVAL_SECONDS,
  probeIntervalSeconds,
  schemeIntervalSeconds,
} from '../../utilities/navBackoff';
export { probeIntervalSeconds, schemeIntervalSeconds } from '../../utilities/navBackoff';
export {
  PROBE_BASE_INTERVAL_SECONDS,
  PROBE_MAX_INTERVAL_SECONDS,
} from '../../utilities/navBackoff';
/**
 * How far NAV publication has actually got, learned from upstream rather than
 * predicted from a calendar.
 *
 * ## The problem this replaces
 *
 * Freshness used to be judged against a *predicted* date: yesterday, stepped
 * back over weekends. Nothing in that prediction knows about exchange holidays,
 * an AMC publishing late, or the provider itself lagging — and when the
 * prediction names a date that will never exist, every cache layer reports
 * stale forever and every request becomes a candidate for an upstream fetch
 * that cannot possibly improve anything.
 *
 * That was not hypothetical. Measured against api.mfapi.in, the newest NAV was
 * dated 18-09-2026 (a Friday) while the predicted ceiling was 22-09-2026 — two
 * business days that simply had no NAV. A per-scheme cooldown reduced the
 * frequency of the doomed fetch but not its cost, and that cost is severe: the
 * same provider answered identical requests in 1.2s and in 62s.
 *
 * ## The approach
 *
 * Keep one market-wide watermark — the newest NAV date known to exist anywhere
 * — and judge freshness against `min(endDate, watermark)`. The watermark only
 * advances when upstream is observed to have published, so weekends, holidays,
 * late AMCs and provider outages are all handled by construction. No calendar
 * is consulted and there is no unsatisfiable ceiling.
 *
 * Because AMFI publishes all schemes together, one 349-byte `/latest` probe
 * answers "has the market moved?" for the entire catalogue, instead of one
 * 133KB full-history fetch per scheme.
 */
export interface NavWatermark {
  /** Newest NAV date observed upstream, `YYYY-MM-DD`. */
  date: string;
  /** When that observation was made, epoch ms. */
  observedAt: number;
  /** Consecutive probes that found nothing newer. Drives the backoff. */
  noAdvanceCount: number;
}
const WATERMARK_KEY = 'nav:market:watermark';
const PROBE_GATE_KEY = 'nav:probe:gate';
const WATERMARK_TTL_SECONDS = 7 * 24 * 60 * 60;
/**
 * Schemes probed to decide whether the market has moved.
 *
 * Large, long-running, daily-priced funds from different fund houses. More than
 * one because a single scheme can be suspended, merged or simply late, and a
 * stuck probe would freeze the watermark and with it every scheme's freshness.
 * The newest date across them wins.
 */
const PROBE_SCHEME_CODES = ['118825', '120503', '119551'];
/**
 * A probe is cheap (`/latest` is a few hundred bytes) but the provider's
 * latency is not, so it still gets a bounded timeout. It runs off the request
 * path, so this can be generous.
 */
const PROBE_TIMEOUT_MS = 20_000;
/**
 * Process-level memo for the watermark.
 *
 * The watermark is consulted on every NAV request, and `redisGet` is a network
 * round trip to Upstash every time — which would put 10-50ms back onto the very
 * path this work exists to speed up. The value changes at most once per probe
 * window, so a few seconds of staleness costs nothing: being one tick behind
 * only means a refresh is scheduled a moment later than it could have been.
 */
let watermarkMemo: { value: NavWatermark | null; expiresAt: number } | null = null;
const WATERMARK_MEMO_MS = 30_000;
/** Drops the memo so the next read observes a write made by this process. */
function invalidateWatermarkMemo(): void {
  watermarkMemo = null;
}
export async function readWatermark(): Promise<NavWatermark | null> {
  if (watermarkMemo && watermarkMemo.expiresAt > Date.now()) {
    return watermarkMemo.value;
  }
  const value = await readWatermarkUncached();
  watermarkMemo = { value, expiresAt: Date.now() + WATERMARK_MEMO_MS };
  return value;
}
async function readWatermarkUncached(): Promise<NavWatermark | null> {
  const raw = await redisGet<NavWatermark | string>(WATERMARK_KEY);
  if (!raw) return null;
  const parsed = typeof raw === 'string' ? safeParse(raw) : raw;
  if (!parsed || typeof parsed.date !== 'string') return null;
  return {
    date: parsed.date,
    observedAt: Number(parsed.observedAt) || 0,
    noAdvanceCount: Number(parsed.noAdvanceCount) || 0,
  };
}
function safeParse(raw: string): NavWatermark | null {
  try {
    return JSON.parse(raw) as NavWatermark;
  } catch {
    return null;
  }
}
export async function writeWatermark(next: NavWatermark): Promise<void> {
  await redisSet(WATERMARK_KEY, next, WATERMARK_TTL_SECONDS);
  invalidateWatermarkMemo();
}
/**
 * How far a cached payload must reach to count as fresh.
 *
 * Falls back to the calendar prediction only when no watermark has been
 * established yet — a cold Redis with nothing in the database to seed from.
 * `seedDate`, when supplied, is the newest NAV date we already hold; it is a
 * strictly better starting point than the prediction because it is something we
 * have actually seen.
 */
export async function resolveFreshnessCeiling(
  endDate: string,
  seedDate?: string | null
): Promise<string> {
  const watermark = await readWatermark();
  if (watermark?.date) {
    return endDate < watermark.date ? endDate : watermark.date;
  }
  if (seedDate) {
    return endDate < seedDate ? endDate : seedDate;
  }
  return navFreshnessCeiling(endDate);
}
/** The newest NAV date in a `/latest` (or full) upstream response. */
function latestDateFromUpstream(payload: unknown): string | null {
  const rows = (payload as { data?: Array<{ date?: string }> } | null)?.data;
  if (!Array.isArray(rows) || rows.length === 0) return null;
  let latest = '';
  for (const row of rows) {
    const iso = row?.date ? navDateToISO(row.date) : '';
    if (iso && iso > latest) latest = iso;
  }
  return latest || null;
}
/**
 * Asks upstream whether anything newer has been published, at most once per
 * backoff window across the whole deployment.
 *
 * Returns the watermark in force afterwards, and whether it moved. Safe to call
 * from anywhere; the gate makes all but one caller per window a no-op.
 *
 * Must only be called off the request path — it can block for
 * `PROBE_TIMEOUT_MS`.
 */
export async function probeMarketWatermark(
  options: { force?: boolean } = {}
): Promise<{ watermark: NavWatermark | null; advanced: boolean; probed: boolean }> {
  const current = await readWatermark();
  if (!options.force) {
    const interval = probeIntervalSeconds(current?.noAdvanceCount ?? 0);
    const claimed = await redisSetIfAbsent(PROBE_GATE_KEY, Date.now(), interval);
    if (!claimed) return { watermark: current, advanced: false, probed: false };
  }
  const observations = await Promise.all(
    PROBE_SCHEME_CODES.map(async (code) => {
      try {
        const res = await fetch(`${MF_URL}/${encodeURIComponent(code)}/latest`, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
        });
        if (!res.ok) return null;
        return latestDateFromUpstream(await res.json());
      } catch {
        // A probe failure is not an error worth surfacing: the watermark simply
        // does not move, and everything keeps serving what it has.
        return null;
      }
    })
  );
  let observed = '';
  for (const date of observations) {
    if (date && date > observed) observed = date;
  }
  if (!observed) {
    // Every probe failed. Leave the watermark alone but count it as
    // no-advance so the interval widens rather than retrying hard against a
    // provider that is evidently struggling.
    if (current) {
      const next = { ...current, noAdvanceCount: current.noAdvanceCount + 1 };
      await writeWatermark(next);
      return { watermark: next, advanced: false, probed: true };
    }
    return { watermark: null, advanced: false, probed: true };
  }
  const advanced = !current || observed > current.date;
  const next: NavWatermark = {
    date: advanced ? observed : current.date,
    observedAt: Date.now(),
    noAdvanceCount: advanced ? 0 : (current?.noAdvanceCount ?? 0) + 1,
  };
  await writeWatermark(next);
  return { watermark: next, advanced, probed: true };
}
// ── Per-scheme refresh gating ───────────────────────────────────────────────
const SCHEME_GATE_KEY = (code: string) => `nav:sync:${code}`;
const SCHEME_ATTEMPTS_KEY = (code: string) => `nav:sync:attempts:${code}`;
/**
 * Claims the right to refresh one scheme from upstream.
 *
 * The interval widens with each attempt that leaves the scheme still behind the
 * watermark, so a delisted scheme settles at one attempt per day instead of one
 * per window forever. `recordSchemeOutcome` resets it once the scheme catches
 * up.
 */
export async function claimSchemeRefresh(schemeCode: string): Promise<boolean> {
  const attempts = Number(await redisGet<number>(SCHEME_ATTEMPTS_KEY(schemeCode))) || 0;
  return redisSetIfAbsent(
    SCHEME_GATE_KEY(schemeCode),
    Date.now(),
    schemeIntervalSeconds(attempts)
  );
}
/** `caughtUp` resets the backoff; otherwise the next window is wider. */
export async function recordSchemeOutcome(schemeCode: string, caughtUp: boolean): Promise<void> {
  if (caughtUp) {
    await redisSet(SCHEME_ATTEMPTS_KEY(schemeCode), 0, SCHEME_MAX_INTERVAL_SECONDS);
    return;
  }
  const attempts = Number(await redisGet<number>(SCHEME_ATTEMPTS_KEY(schemeCode))) || 0;
  await redisSet(SCHEME_ATTEMPTS_KEY(schemeCode), attempts + 1, SCHEME_MAX_INTERVAL_SECONDS);
}
