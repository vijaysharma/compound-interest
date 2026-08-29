import { NavType } from '../types/types';
import { getNearest } from './utility';
export interface NavPoint {
  date: string;
  nav: number;
}
export interface SimulationResult {
  invested: number;
  withdrawn: number;
  units: number;
  currentValue: number;
  lastNav: number;
  installments: number;
  xirr?: number;
  latestXirr?: number;
}
interface CashFlow {
  date: string;
  amount: number;
}
const toDate = (date: string): Date => {
  const parts = date.split('-').map(Number);
  if (date.split('-')[0].length === 4) {
    const [year, month, day] = parts;
    return new Date(year, month - 1, day);
  }
  const [day, month, year] = parts;
  return new Date(year, month - 1, day);
};
const toISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const addMonths = (date: Date, months: number): Date => {
  const next = new Date(date);
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(date.getDate(), lastDay));
  return next;
};
const getNav = (isoDate: string, data: NavType[]): NavPoint | undefined => {
  const nearest = getNearest(isoDate, data);
  const nav = Number(nearest?.nav);
  return nearest && Number.isFinite(nav) && nav > 0 ? { date: nearest.date, nav } : undefined;
};
const getEffectiveStartDate = (startDate: string, data: NavType[]): string => {
  const earliestNav = [...data]
    .map((nav) => ({ ...nav, time: toDate(nav.date).getTime(), value: Number(nav.nav) }))
    .filter(({ time, value }) => Number.isFinite(time) && Number.isFinite(value) && value > 0)
    .sort((a, b) => a.time - b.time)[0];
  if (!earliestNav || toDate(startDate).getTime() >= earliestNav.time) {
    return startDate;
  }
  return earliestNav.date;
};
const calculateXirr = (cashFlows: CashFlow[]): number | undefined => {
  if (cashFlows.length < 2) return undefined;
  const baseDate = toDate(cashFlows[0].date).getTime();
  const years = (date: string) => (toDate(date).getTime() - baseDate) / (365.25 * 86400000);
  const valueAt = (rate: number) =>
    cashFlows.reduce(
      (total, flow) => total + flow.amount / Math.pow(1 + rate, years(flow.date)),
      0
    );
  const derivativeAt = (rate: number) =>
    cashFlows.reduce(
      (total, flow) =>
        total - (years(flow.date) * flow.amount) / Math.pow(1 + rate, years(flow.date) + 1),
      0
    );
  let rate = 0.1;
  for (let iteration = 0; iteration < 100; iteration += 1) {
    const value = valueAt(rate);
    const derivative = derivativeAt(rate);
    if (!Number.isFinite(value) || !Number.isFinite(derivative) || derivative === 0) break;
    const nextRate = rate - value / derivative;
    if (nextRate <= -1 || !Number.isFinite(nextRate)) break;
    if (Math.abs(nextRate - rate) < 1e-10) return nextRate;
    rate = nextRate;
  }
  return Math.abs(valueAt(rate)) < 0.01 ? rate : undefined;
};
const getMonthlyDates = (startDate: string, endDate: string, installmentDay?: number): string[] => {
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
const validateInputs = (startDate: string, endDate: string, amount: number) => {
  if (!startDate || !endDate || toDate(startDate) > toDate(endDate)) {
    throw new Error('Choose a valid start and end date.');
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Enter an amount greater than zero.');
  }
};
export const calculateSip = (
  navData: NavType[],
  startDate: string,
  endDate: string,
  monthlyAmount: number,
  annualStepUp: number,
  installmentDay?: number
): SimulationResult => {
  validateInputs(startDate, endDate, monthlyAmount);
  const effectiveStartDate = getEffectiveStartDate(startDate, navData);
  const dates = getMonthlyDates(effectiveStartDate, endDate, installmentDay);
  let invested = 0;
  let units = 0;
  let lastNav = 0;
  let installments = 0;
  const cashFlows: CashFlow[] = [];
  for (const [index, date] of dates.entries()) {
    const nav = getNav(date, navData);
    if (!nav) continue;
    const amount = monthlyAmount * Math.pow(1 + annualStepUp / 100, Math.floor(index / 12));
    invested += amount;
    units += amount / nav.nav;
    lastNav = nav.nav;
    installments += 1;
    cashFlows.push({ date: nav.date, amount: -amount });
  }
  if (!units || !lastNav) throw new Error('No NAV data is available for the selected dates.');
  const finalNav = getNav(endDate, navData)?.nav ?? lastNav;
  const maturityCashFlows = [...cashFlows, { date: endDate, amount: units * finalNav }];
  const latestNav = [...navData]
    .map((nav) => ({ nav: Number(nav.nav), date: nav.date, time: toDate(nav.date).getTime() }))
    .filter(({ nav, time }) => Number.isFinite(nav) && nav > 0 && Number.isFinite(time))
    .sort((a, b) => b.time - a.time)[0];
  const latestCashFlows =
    latestNav && latestNav.time >= toDate(endDate).getTime()
      ? [...cashFlows, { date: latestNav.date, amount: units * latestNav.nav }]
      : maturityCashFlows;
  return {
    invested,
    withdrawn: 0,
    units,
    currentValue: units * finalNav,
    lastNav: finalNav,
    installments,
    xirr: calculateXirr(maturityCashFlows),
    latestXirr: calculateXirr(latestCashFlows),
  };
};
export const calculateSipGrowth = (
  navData: NavType[],
  startDate: string,
  endDate: string,
  monthlyAmount: number,
  annualStepUp: number,
  installmentDay?: number
): NavPoint[] => {
  validateInputs(startDate, endDate, monthlyAmount);
  const effectiveStartDate = getEffectiveStartDate(startDate, navData);
  const firstNav = getNav(effectiveStartDate, navData);
  const lastNav = getNav(endDate, navData);
  if (!firstNav || !lastNav) {
    throw new Error('No NAV data is available for the selected dates.');
  }
  const startTime = toDate(firstNav.date).getTime();
  const endTime = toDate(lastNav.date).getTime();
  const installmentDates = getMonthlyDates(effectiveStartDate, endDate, installmentDay)
    .map((date, index) => {
      const nav = getNav(date, navData);
      if (!nav) return undefined;
      return {
        date: nav.date,
        units: (monthlyAmount * Math.pow(1 + annualStepUp / 100, Math.floor(index / 12))) / nav.nav,
      };
    })
    .filter((installment): installment is { date: string; units: number } => Boolean(installment))
    .sort((a, b) => toDate(a.date).getTime() - toDate(b.date).getTime());
  let units = 0;
  let installmentIndex = 0;
  return [...navData]
    .map((point) => ({ point, time: toDate(point.date).getTime(), nav: Number(point.nav) }))
    .filter(
      ({ time, nav }) =>
        Number.isFinite(time) &&
        Number.isFinite(nav) &&
        nav > 0 &&
        time >= startTime &&
        time <= endTime
    )
    .sort((a, b) => a.time - b.time)
    .flatMap(({ point, nav }) => {
      while (
        installmentIndex < installmentDates.length &&
        toDate(installmentDates[installmentIndex].date).getTime() <= toDate(point.date).getTime()
      ) {
        units += installmentDates[installmentIndex].units;
        installmentIndex += 1;
      }
      return units > 0 ? [{ date: point.date, nav: Number((units * nav).toFixed(2)) }] : [];
    });
};
export const calculateSwp = (
  navData: NavType[],
  startDate: string,
  endDate: string,
  initialInvestment: number,
  monthlyWithdrawal: number,
  annualStepUp: number
): SimulationResult => {
  validateInputs(startDate, endDate, initialInvestment);
  validateInputs(startDate, endDate, monthlyWithdrawal);
  const startNav = getNav(startDate, navData);
  if (!startNav) throw new Error('No NAV data is available for the selected start date.');
  let units = initialInvestment / startNav.nav;
  let withdrawn = 0;
  let lastNav = startNav.nav;
  const dates = getMonthlyDates(startDate, endDate).slice(1);
  for (const [index, date] of dates.entries()) {
    const nav = getNav(date, navData);
    if (!nav) continue;
    const amount = monthlyWithdrawal * Math.pow(1 + annualStepUp / 100, Math.floor(index / 12));
    units -= amount / nav.nav;
    withdrawn += amount;
    lastNav = nav.nav;
    if (units <= 0) {
      units = 0;
      break;
    }
  }
  const finalNav = getNav(endDate, navData)?.nav ?? lastNav;
  return {
    invested: initialInvestment,
    withdrawn,
    units,
    currentValue: units * finalNav,
    lastNav: finalNav,
    installments: dates.length,
  };
};
