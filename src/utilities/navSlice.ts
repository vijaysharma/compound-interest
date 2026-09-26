import { navDateToISO } from './dateUtils';
import { isoToUTCDate, utcDateToISO } from './dateGuards';
/**
 * Trimming a NAV history to the window a caller actually needs.
 *
 * A full scheme history measures ~133KB over ~3,400 rows (measured against
 * official AMFI data). Every one of those bytes crosses the Upstash REST API, then
 * the React server-action payload, then a `JSON.parse` in the browser — per
 * fund, and the charts routinely draw several at once. A two-year window is
 * roughly a fifth of that.
 *
 * ## Slicing is opt-in, deliberately
 *
 * `sliceNavHistory` returns the input untouched unless an explicit start date is
 * supplied. That matters because `resolveDateRange` *invents* a start date three
 * months back when none is given — so inferring the window from the resolved
 * range would silently truncate every caller that wants the whole history to
 * ninety days, including the strategy engine, whose projections run from an
 * investment date years earlier.
 *
 * ## The margin
 *
 * NAV lookups resolve a date to the nearest *preceding* published NAV, because
 * the requested day may be a weekend, a holiday, or simply unpublished. A slice
 * cut exactly at `startDate` leaves those lookups with nothing behind them and
 * they fail at the very start of the window. The slice therefore reaches back
 * `SLICE_MARGIN_DAYS` further — comfortably more than the longest observed gap
 * in publication, which included a two-business-day stretch in September 2026.
 */
export const SLICE_MARGIN_DAYS = 10;
export interface NavRow {
  date?: string;
  [k: string]: unknown;
}
/** Steps an ISO date back by `days`, staying on the calendar. */
export function shiftISODays(iso: string, days: number): string {
  const date = isoToUTCDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return utcDateToISO(date);
}
/**
 * The inclusive lower bound a slice actually cuts at, given the window the
 * caller asked for.
 */
export function sliceLowerBound(startDate: string): string {
  return shiftISODays(startDate, -SLICE_MARGIN_DAYS);
}
/**
 * Keeps the rows inside `[startDate - margin, endDate]`, preserving input order.
 *
 * Returns the same array reference when no `startDate` is given, so the
 * full-history callers pay nothing at all.
 */
export function sliceNavHistory<T extends NavRow>(
  rows: readonly T[],
  startDate?: string | null,
  endDate?: string | null
): readonly T[] {
  if (!startDate || rows.length === 0) return rows;
  const lower = sliceLowerBound(startDate);
  const upper = endDate || null;
  const kept: T[] = [];
  for (const row of rows) {
    const iso = row?.date ? navDateToISO(row.date) : '';
    // A row whose date cannot be parsed is kept rather than dropped: it is not
    // this function's job to silently discard data it does not understand.
    if (!iso) {
      kept.push(row);
      continue;
    }
    if (iso < lower) continue;
    if (upper && iso > upper) continue;
    kept.push(row);
  }
  // Never hand back an empty window when the input had rows. A start date past
  // the end of a scheme's history would otherwise render as "no data" rather
  // than as the flat tail it really is.
  return kept.length > 0 ? kept : rows;
}
