/**
 * How often to ask upstream whether anything new has been published.
 *
 * Pure arithmetic, kept apart from the module that performs the IO so the
 * policy can be exercised on its own — and so importing it does not drag in
 * Redis and `next/server`, which the unit-test loader cannot resolve.
 */
/** First interval after a probe finds nothing newer. */
export const PROBE_BASE_INTERVAL_SECONDS = 30 * 60;
/** Ceiling on the backed-off probe interval; a multi-day gap settles here. */
export const PROBE_MAX_INTERVAL_SECONDS = 6 * 60 * 60;
/** First interval after a scheme fails to reach the watermark. */
export const SCHEME_BASE_INTERVAL_SECONDS = 30 * 60;
/**
 * Ceiling for a single scheme. A delisted or unpriced scheme can never reach
 * the watermark, so without a cap it would be retried for as long as it stays
 * in the table.
 */
export const SCHEME_MAX_INTERVAL_SECONDS = 24 * 60 * 60;
const backoff = (base: number, max: number, attempts: number): number =>
  Math.min(base * 2 ** Math.max(0, attempts), max);
/**
 * 30m, 1h, 2h, 4h, then 6h for as long as publication stays put.
 *
 * Over the five-day gap that prompted this — upstream's newest NAV was dated
 * 18-09-2026 on 23-09-2026 — that is roughly twenty probes for the entire
 * application, against the ~480 per scheme a fixed 15-minute cooldown made.
 */
export function probeIntervalSeconds(noAdvanceCount: number): number {
  return backoff(PROBE_BASE_INTERVAL_SECONDS, PROBE_MAX_INTERVAL_SECONDS, noAdvanceCount);
}
/** Same curve per scheme, capped at a day. */
export function schemeIntervalSeconds(attempts: number): number {
  return backoff(SCHEME_BASE_INTERVAL_SECONDS, SCHEME_MAX_INTERVAL_SECONDS, attempts);
}
