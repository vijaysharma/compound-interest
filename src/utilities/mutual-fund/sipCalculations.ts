import type { NavType } from '../../types/types';
import type { CashFlow, NavPoint, SimulationResult } from './mfCalcTypes';
import { calculateXirr, toDate } from './xirrCalculation';
import {
  getEffectiveStartDate,
  getMonthlyDates,
  getNav,
  validateInputs,
} from './mfDateHelpers';
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
