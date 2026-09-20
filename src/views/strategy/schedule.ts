import { addMonths, toISO } from '../../utilities/mutual-fund/mfDateHelpers';
import { parseAnyDate } from '../../utilities/dateUtils';
import type { Frequency } from './types';
export const MONTHS_PER_INTERVAL: Record<Frequency, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};
export const FREQUENCY_LABEL: Record<Frequency, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};
export const FREQUENCY_OPTIONS: Frequency[] = ['monthly', 'quarterly', 'yearly'];
/** Cap on generated installments, so an accidental 200-year range cannot hang the UI. */
const MAX_INSTALLMENTS = 1200;
/**
 * Installment dates from `startDate` up to and including `endDate`, stepping by
 * the frequency. The day-of-month is anchored to the start date and clamped to
 * the length of each month (a 31st start becomes the 28th/30th where needed).
 */
export const installmentDates = (
  startDate: string,
  endDate: string,
  frequency: Frequency
): string[] => {
  const start = parseAnyDate(startDate);
  const end = parseAnyDate(endDate);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return [];
  if (start.getTime() > end.getTime()) return [];
  const step = MONTHS_PER_INTERVAL[frequency];
  const dates: string[] = [];
  for (let index = 0; index < MAX_INSTALLMENTS; index += 1) {
    const date = addMonths(start, index * step);
    if (date.getTime() > end.getTime()) break;
    dates.push(toISO(date));
  }
  return dates;
};
/**
 * Multiplier for an escalating instalment, e.g. "withdraw 10% more each year".
 *
 * This is the user's own step-up applied to the rupee amount they ask for, not
 * a market-return assumption: whatever amount comes out of this is still
 * converted to units at the actual NAV on the transaction date. The escalation
 * steps on completed years, so a quarterly schedule holds the same amount for
 * four instalments before stepping.
 */
export const stepUpFactor = (
  index: number,
  frequency: Frequency,
  annualPct: number
): number => {
  if (!annualPct) return 1;
  const completedYears = Math.floor((index * MONTHS_PER_INTERVAL[frequency]) / 12);
  return Math.pow(1 + annualPct / 100, completedYears);
};
export const isOnOrBefore = (a: string, b: string): boolean =>
  parseAnyDate(a).getTime() <= parseAnyDate(b).getTime();
export const isBefore = (a: string, b: string): boolean =>
  parseAnyDate(a).getTime() < parseAnyDate(b).getTime();
export const earliestDate = (dates: string[]): string | null =>
  dates.filter(Boolean).sort((a, b) => parseAnyDate(a).getTime() - parseAnyDate(b).getTime())[0] ??
  null;
