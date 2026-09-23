/**
 * When a NAV can be expected to exist upstream — the ceiling every NAV cache
 * layer compares its stored payload against.
 *
 * ## Why this module exists
 *
 * Every cache layer used to ask "does the stored payload reach the date the
 * caller requested?":
 *
 *     if (latestNavDate >= requestedEndDate) return cached;
 *
 * and the client never sent a date, so `requestedEndDate` defaulted to *today*.
 * AMCs publish a business day's NAV after that day's market close, so the
 * newest NAV in existence is never dated today during trading hours. The
 * comparison was therefore false on every request, which sent every request
 * through all three caches and out to the third-party API — and then stored a
 * payload that could not satisfy the comparison next time either. Redis was
 * written on every call and successfully read on none.
 *
 * The fix is to compare against what *could* exist rather than what was asked
 * for: `min(requestedEndDate, lastExpectedNavDateISO())`.
 *
 * ## What this module cannot know
 *
 * Exchange holidays. There is no holiday calendar here, so on a holiday the
 * ceiling names a date that will never be published and the payload looks
 * permanently stale. That is why the handlers pair this ceiling with a re-sync
 * cooldown: the ceiling decides whether a refresh is *wanted*, the cooldown
 * decides whether one is *allowed*. Without the cooldown a holiday would
 * reproduce exactly the hot-loop this module was written to remove.
 */
import { getMarketNowParts, getTodayISO, isoToUTCDate, utcDateToISO } from './dateGuards';
import { navDateToISO } from './dateUtils';
/**
 * Market-local hour after which the current business day's NAV is expected to
 * be available upstream. AMCs are required to publish by 23:00 IST; before that
 * the newest NAV in existence belongs to the previous business day.
 */
export const NAV_PUBLISH_HOUR = 23;
/** Saturday or Sunday in the market timezone — no NAV is published for these. */
export function isMarketWeekend(iso: string): boolean {
  const weekday = isoToUTCDate(iso).getUTCDay();
  return weekday === 0 || weekday === 6;
}
export function previousCalendarDayISO(iso: string): string {
  const date = isoToUTCDate(iso);
  date.setUTCDate(date.getUTCDate() - 1);
  return utcDateToISO(date);
}
/**
 * The newest NAV date that can plausibly exist upstream right now.
 *
 * Steps back one day when the current day's publication window has not opened
 * yet, then back over any weekend. Holidays are not represented — see the note
 * at the top of this file.
 */
export function lastExpectedNavDateISO(instant?: Date): string {
  const { hours } = getMarketNowParts(instant);
  let iso = getTodayISO(instant);
  if (hours < NAV_PUBLISH_HOUR) {
    iso = previousCalendarDayISO(iso);
  }
  // Bounded: at most two steps for a weekend, plus one for a Monday morning.
  while (isMarketWeekend(iso)) {
    iso = previousCalendarDayISO(iso);
  }
  return iso;
}
/**
 * How far a cached payload must reach to be considered fresh for `endDate`.
 *
 * Asking for a past date only needs data up to that date; asking for today only
 * needs data up to the last published NAV, because nothing newer exists.
 */
export function navFreshnessCeiling(endDate: string, instant?: Date): string {
  const ceiling = lastExpectedNavDateISO(instant);
  return endDate < ceiling ? endDate : ceiling;
}
/**
 * Newest NAV date in a row list, as `YYYY-MM-DD`, or `null` if there is none.
 *
 * Operates on the row array rather than a payload wrapper so the server (which
 * holds `{ data: [...] }`) and the browser (which holds `NavType[]`) can share
 * one implementation — they previously each had their own, and disagreed.
 *
 * Cheaper than it was, but not free: `navDateToISO` allocates a `split` array
 * and padded strings per row, so a ~3,400-row scheme costs several thousand
 * short-lived objects. Dropping the per-row `Date` construction was the win;
 * comparing ISO strings works because they sort in calendar order. Callers on a
 * hot path should cache the result rather than recompute it — `mfNavCache`
 * stores it next to the payload for exactly that reason.
 */
export function latestNavDateIn(rows: ReadonlyArray<{ date?: string }> | null | undefined): string | null {
  if (!rows || rows.length === 0) return null;
  let latest = '';
  for (const row of rows) {
    const iso = row?.date ? navDateToISO(row.date) : '';
    if (iso && iso > latest) latest = iso;
  }
  return latest || null;
}
/**
 * Whether a row list reaches the freshness ceiling, i.e. holds everything that
 * could currently be published. Pair with `navFreshnessCeiling(endDate)`.
 */
export function isNavHistoryFresh(
  rows: ReadonlyArray<{ date?: string }> | null | undefined,
  ceiling: string
): boolean {
  const latest = latestNavDateIn(rows);
  return Boolean(latest && latest >= ceiling);
}
