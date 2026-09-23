import { isNavHistoryFresh, latestNavDateIn } from '../../utilities/navCalendar';
export const OPEN_EXCHANGE_API = 'https://open.er-api.com/v6/latest';
export const WORLD_BANK_PPP_API =
  'https://api.worldbank.org/v2/country/all/indicator/PA.NUS.PPP?format=json&per_page=400&mrv=1&gapfill=y';
export const DB_TTL_MS = 24 * 60 * 60 * 1000;
export const PPP_DB_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const NAV_CACHE_TTL_SECONDS = 30 * 24 * 60 * 60;
export const NAV_IN_MEMORY_TTL_MS = 30 * 24 * 60 * 60 * 1000;
/**
 * Upstream was given 15s. Nothing downstream waits that long usefully — the
 * page has already rendered a skeleton — and a 15s hold on a serverless
 * invocation is expensive. 8s is comfortably above the observed p99 for a full
 * scheme history and fails fast enough to fall back to a stored payload.
 */
export const NAV_UPSTREAM_TIMEOUT_MS = 8000;
/**
 * Upstream fetches run through a pool of this size in the batch path, which
 * previously issued one `Promise.all` leg per missing scheme with no ceiling —
 * a portfolio of ten funds meant ten concurrent full-history downloads.
 */
export const NAV_BATCH_CONCURRENCY = 4;
/**
 * Minimum gap between upstream re-sync attempts for one scheme.
 *
 * The freshness ceiling says whether a refresh is wanted; this says whether one
 * is allowed. It is what keeps an unsatisfiable ceiling — an exchange holiday,
 * a suspended scheme, a fund whose AMC published late — from turning every
 * request back into an upstream fetch, and it collapses a burst of concurrent
 * requests for the same cold scheme into a single fetch.
 */
export const NAV_SYNC_COOLDOWN_SECONDS = 15 * 60;
/** Redis key namespaces. Centralised so the read and write sides cannot drift. */
export const navPayloadKey = (schemeCode: string): string => `cache:mf:nav:${schemeCode}`;
export const navSyncGateKey = (schemeCode: string): string => `gate:mf:nav:sync:${schemeCode}`;
export const SEARCH_CACHE_TTL_SECONDS = 30 * 24 * 60 * 60;
export const SEARCH_IN_MEMORY_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const memoryState: {
  exchangeRates: { rates: Record<string, number>; timestamp: number } | null;
  pppData: { data: unknown; timestamp: number } | null;
  imfData: { data: unknown; timestamp: number } | null;
} = {
  exchangeRates: null,
  pppData: null,
  imfData: null,
};
export const mfSearchCache = new Map<string, { expiresAt: number; data: unknown[] }>();
/**
 * Process-level NAV cache.
 *
 * `latest` is carried alongside the payload because deriving it means walking
 * every row — ~3,400 for a typical scheme, each one a `split` and a `padStart`
 * — and that walk happens on the hottest path there is, a cache hit. Storing it
 * at write time makes the hit O(1).
 */
export const mfNavCache = new Map<
  string,
  { expiresAt: number; data: unknown; latest?: string | null }
>();
export function parseNavPayload(val: unknown): { data: unknown[]; [k: string]: unknown } | null {
  if (!val) return null;
  let parsed = val;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return null;
    }
  }
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { data?: unknown }).data)) {
    return parsed as { data: unknown[]; [k: string]: unknown };
  }
  return null;
}
/**
 * Whether a stored payload reaches `ceiling`.
 *
 * `ceiling` comes from `resolveFreshnessCeiling` — the newest NAV *observed* to
 * exist upstream, not a date predicted from a calendar. Keeping the test in one
 * place is the point: it was previously inlined at six call sites across the two
 * handlers, which is how the single- and batch-fetch paths came to disagree.
 */
export function isNavPayloadFresh(payload: unknown, ceiling: string): boolean {
  return isNavHistoryFresh(parseNavPayload(payload)?.data as Array<{ date?: string }>, ceiling);
}
/** Newest NAV date inside a server payload wrapper. */
export function getLatestNavDateISO(payload: unknown): string | null {
  return latestNavDateIn(parseNavPayload(payload)?.data as Array<{ date?: string }>);
}
