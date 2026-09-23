/**
 * Global Date Guards and Fallback Defaults
 * Enforces:
 * 1. endDate >= startDate strictly across all forms, API handlers, query params, and utility functions.
 * 2. Whenever startDate or endDate are omitted/null:
 *    - endDate default = Today's date (YYYY-MM-DD)
 *    - startDate default = 3 months prior to today (YYYY-MM-DD)
 * 3. Never request or allow dates strictly in the future (endDate <= today).
 */
export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
/**
 * The timezone every date in this module is resolved in.
 *
 * Server-local time is not a safe substitute. The NAV data this app is built
 * around is published on the Indian market calendar, and on Vercel the runtime
 * clock is UTC — so a naive `new Date().getFullYear()` rolls "today" over at
 * 05:30 IST, while the AMCs publish after market close around 23:00 IST. That
 * gap meant `getTodayISO()` returned a different day depending on whether it
 * ran on the server or in the browser, and the NAV cache compared the two
 * against each other.
 *
 * Held as one offset so a second market can be supported by parameterising this
 * rather than by hunting down `new Date()` calls. IST has no DST, so a fixed
 * offset is exact rather than an approximation.
 */
export const MARKET_UTC_OFFSET_MINUTES = 330; // IST = UTC+05:30
const pad2 = (n: number): string => String(n).padStart(2, '0');
/**
 * Wall-clock parts in the market timezone.
 *
 * Read back with `getUTC*` on purpose: the offset has already been added to the
 * instant, so the UTC fields of the shifted value *are* the market-local
 * fields. Using `getHours()` here would apply the host's offset a second time.
 */
export function getMarketNowParts(instant: Date = new Date()): {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  weekday: number;
} {
  const shifted = new Date(instant.getTime() + MARKET_UTC_OFFSET_MINUTES * 60_000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hours: shifted.getUTCHours(),
    minutes: shifted.getUTCMinutes(),
    weekday: shifted.getUTCDay(),
  };
}
/** Today in the market timezone, as `YYYY-MM-DD`. */
export function getTodayISO(instant?: Date): string {
  const { year, month, day } = getMarketNowParts(instant);
  return `${year}-${pad2(month)}-${pad2(day)}`;
}
/** Parses `YYYY-MM-DD` as a timezone-free calendar date. */
export function isoToUTCDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
/** Formats a date built by `isoToUTCDate` back to `YYYY-MM-DD`. */
export function utcDateToISO(date: Date): string {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}
export function getThreeMonthsPriorISO(referenceDate?: string | Date): string {
  const ref = referenceDate instanceof Date ? new Date(referenceDate) : referenceDate && ISO_DATE_REGEX.test(referenceDate) ? new Date(referenceDate + 'T00:00:00') : new Date(getTodayISO() + 'T00:00:00');
  ref.setMonth(ref.getMonth() - 3);
  const year = ref.getFullYear();
  const month = String(ref.getMonth() + 1).padStart(2, '0');
  const day = String(ref.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
export interface SafeDateRange {
  startDate: string;
  endDate: string;
}
export function resolveDateRange(
  rawStartDate?: string | null,
  rawEndDate?: string | null,
  options?: { allowFuture?: boolean; defaultMonthsPrior?: number }
): SafeDateRange {
  const today = getTodayISO();
  let endDate = rawEndDate && ISO_DATE_REGEX.test(rawEndDate.trim()) ? rawEndDate.trim() : today;
  if (!options?.allowFuture && endDate > today) {
    endDate = today;
  }
  const monthsPrior = options?.defaultMonthsPrior ?? 3;
  let startDate = rawStartDate && ISO_DATE_REGEX.test(rawStartDate.trim()) ? rawStartDate.trim() : '';
  if (!startDate) {
    const endObj = new Date(endDate + 'T00:00:00');
    endObj.setMonth(endObj.getMonth() - monthsPrior);
    const y = endObj.getFullYear();
    const m = String(endObj.getMonth() + 1).padStart(2, '0');
    const d = String(endObj.getDate()).padStart(2, '0');
    startDate = `${y}-${m}-${d}`;
  }
  if (endDate < startDate) {
    // Strictly enforce endDate >= startDate
    endDate = startDate;
  }
  if (!options?.allowFuture && endDate > today) {
    endDate = today;
    if (startDate > endDate) {
      startDate = getThreeMonthsPriorISO(endDate);
    }
  }
  return { startDate, endDate };
}
export function isValidDateRange(startDate?: string | null, endDate?: string | null): boolean {
  if (!startDate || !endDate) return false;
  if (!ISO_DATE_REGEX.test(startDate) || !ISO_DATE_REGEX.test(endDate)) return false;
  return endDate >= startDate;
}
