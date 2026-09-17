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
export function getTodayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
export function getThreeMonthsPriorISO(referenceDate?: string | Date): string {
  const ref = referenceDate instanceof Date ? new Date(referenceDate) : referenceDate && ISO_DATE_REGEX.test(referenceDate) ? new Date(referenceDate + 'T00:00:00') : new Date();
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
