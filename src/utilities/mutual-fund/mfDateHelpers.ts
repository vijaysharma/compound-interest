import type { NavType } from '../../types/types';
import { getNearest } from '../utility';
import type { NavPoint } from './mfCalcTypes';
import { toDate } from './xirrCalculation';
export const toISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
export const addMonths = (date: Date, months: number): Date => {
  const next = new Date(date);
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(date.getDate(), lastDay));
  return next;
};
export const getNav = (isoDate: string, data: NavType[]): NavPoint | undefined => {
  const nearest = getNearest(isoDate, data);
  const nav = Number(nearest?.nav);
  return nearest && Number.isFinite(nav) && nav > 0 ? { date: nearest.date, nav } : undefined;
};
export const getEffectiveStartDate = (startDate: string, data: NavType[]): string => {
  const earliestNav = [...data]
    .map((nav) => ({ ...nav, time: toDate(nav.date).getTime(), value: Number(nav.nav) }))
    .filter(({ time, value }) => Number.isFinite(time) && Number.isFinite(value) && value > 0)
    .sort((a, b) => a.time - b.time)[0];
  if (!earliestNav || toDate(startDate).getTime() >= earliestNav.time) {
    return startDate;
  }
  return earliestNav.date;
};
export const getEffectiveSwpStartDate = (
  investmentDate: string,
  withdrawalStartDate: string,
  data: NavType[]
): string => {
  const fundStartDate = getEffectiveStartDate(investmentDate, data);
  return toDate(withdrawalStartDate).getTime() >= toDate(fundStartDate).getTime()
    ? withdrawalStartDate
    : fundStartDate;
};
export const getMonthlyDates = (startDate: string, endDate: string, installmentDay?: number): string[] => {
  const start = toDate(startDate);
  const end = toDate(endDate);
  const dates: string[] = [];
  const day = installmentDay ?? start.getDate();
  for (let month = 0; ; month += 1) {
    const date = addMonths(new Date(start.getFullYear(), start.getMonth(), day), month);
    if (month === 0 && date < start) continue;
    if (date > end) break;
    dates.push(toISO(date));
  }
  return dates;
};
export const validateInputs = (startDate: string, endDate: string, amount: number): void => {
  if (!startDate || !endDate || toDate(startDate) > toDate(endDate)) {
    throw new Error('Choose a valid start and end date.');
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Enter an amount greater than zero.');
  }
};
