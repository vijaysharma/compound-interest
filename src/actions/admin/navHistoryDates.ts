import { formatAmfiDate } from '@/lib/amfi/amfiDate';
const MS_IN_DAY = 24 * 60 * 60 * 1000;
export const MAX_AMFI_HISTORY_DAYS = 90;
export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function daysBetween(fromIso: string, toIso: string): number {
  const t1 = new Date(`${fromIso}T00:00:00Z`).getTime();
  const t2 = new Date(`${toIso}T00:00:00Z`).getTime();
  if (isNaN(t1) || isNaN(t2)) return 0;
  return Math.round((t2 - t1) / MS_IN_DAY) + 1;
}
export function calculateNext90DayWindow(currentFromIso: string): { nextFrom: string; nextTo: string } {
  const nextTo = addDays(currentFromIso, -1);
  const nextFrom = addDays(nextTo, -(MAX_AMFI_HISTORY_DAYS - 1));
  return { nextFrom, nextTo };
}
export function calculateShiftedWindow(
  fromIso: string,
  toIso: string,
  shiftDays: number
): { fromDate: string; toDate: string } {
  return {
    fromDate: addDays(fromIso, shiftDays),
    toDate: addDays(toIso, shiftDays),
  };
}
export function validate90DayInterval(
  fromDate: string,
  toDate: string
): { isValid: boolean; days: number; error?: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate) || !/^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
    return { isValid: false, days: 0, error: 'Dates must be in YYYY-MM-DD format' };
  }
  const days = daysBetween(fromDate, toDate);
  if (days <= 0) {
    return { isValid: false, days, error: 'Start date must be before or equal to End date' };
  }
  if (days > MAX_AMFI_HISTORY_DAYS) {
    return {
      isValid: false,
      days,
      error: `Interval is ${days} days. AMFI restricts historical downloads to a maximum of 90 days.`,
    };
  }
  return { isValid: true, days };
}
export function getAmfiDateLabel(isoDate: string): string {
  return formatAmfiDate(isoDate);
}
