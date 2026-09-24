import { parseAnyDate } from '../../utilities/dateUtils';
import { roundMoney } from './money';
const MS_PER_YEAR = 365.2425 * 24 * 60 * 60 * 1000;
export const deflateSnapshots = <T extends { date: string }>(
  snapshots: T[],
  keys: ReadonlyArray<keyof T & string>,
  baseDate: string,
  annualPct: number
): T[] => {
  if (annualPct <= 0 || snapshots.length === 0) return snapshots;
  const baseTime = parseAnyDate(baseDate).getTime();
  if (!Number.isFinite(baseTime)) return snapshots;
  const rate = 1 + annualPct / 100;
  return snapshots.map((snapshot) => {
    const time = parseAnyDate(snapshot.date).getTime();
    if (!Number.isFinite(time) || time <= baseTime) return snapshot;
    const years = (time - baseTime) / MS_PER_YEAR;
    const divisor = rate ** years;
    if (!Number.isFinite(divisor) || divisor <= 0) return snapshot;
    const next = { ...snapshot };
    for (const key of keys) {
      const value = snapshot[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        (next as Record<string, unknown>)[key] = value / divisor;
      }
    }
    return next;
  });
};
export const inTodaysRupees = (value: number, annualPct: number, years: number): number => {
  if (annualPct <= 0 || years <= 0) return value;
  return roundMoney(value / (1 + annualPct / 100) ** years);
};
