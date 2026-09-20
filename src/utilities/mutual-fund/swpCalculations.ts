import type { NavType } from '../../types/types';
import type { CashFlow, NavPoint, SimulationResult } from './mfCalcTypes';
import { calculateXirr, toDate } from './xirrCalculation';
import {
  getEffectiveStartDate,
  getEffectiveSwpStartDate,
  getMonthlyDates,
  getNav,
  validateInputs,
} from './mfDateHelpers';
export const calculateSwp = (
  navData: NavType[],
  investmentDate: string,
  withdrawalStartDate: string,
  endDate: string,
  initialInvestment: number,
  monthlyWithdrawal: number,
  annualStepUp: number,
  installmentDay?: number
): SimulationResult => {
  validateInputs(investmentDate, endDate, initialInvestment);
  validateInputs(withdrawalStartDate, endDate, monthlyWithdrawal);
  if (toDate(withdrawalStartDate) < toDate(investmentDate)) {
    throw new Error('SWP start date cannot be before the investment date.');
  }
  const effectiveInvestmentDate = getEffectiveStartDate(investmentDate, navData);
  const effectiveWithdrawalStartDate = getEffectiveSwpStartDate(
    investmentDate,
    withdrawalStartDate,
    navData
  );
  const startNav = getNav(effectiveInvestmentDate, navData);
  if (!startNav) throw new Error('No NAV data is available for the selected start date.');
  let units = initialInvestment / startNav.nav;
  let remainingInvested = initialInvestment;
  let withdrawn = 0;
  let installments = 0;
  let lastWithdrawalAmount = 0;
  let lastWithdrawalDate: string | undefined;
  let lastNav = startNav.nav;
  const cashFlows: CashFlow[] = [{ date: startNav.date, amount: -initialInvestment }];
  const dates = getMonthlyDates(effectiveWithdrawalStartDate, endDate, installmentDay);
  for (const [index, date] of dates.entries()) {
    const nav = getNav(date, navData);
    if (!nav) continue;
    const amount = monthlyWithdrawal * Math.pow(1 + annualStepUp / 100, Math.floor(index / 12));
    const withdrawalUnits = amount / nav.nav;
    if (withdrawalUnits > units) {
      break;
    }
    units -= withdrawalUnits;
    remainingInvested -= withdrawalUnits * startNav.nav;
    withdrawn += amount;
    lastNav = nav.nav;
    installments += 1;
    lastWithdrawalAmount = amount;
    lastWithdrawalDate = nav.date;
    cashFlows.push({ date: nav.date, amount });
  }
  const finalNav = getNav(endDate, navData)?.nav ?? lastNav;
  const currentValue = units * finalNav;
  cashFlows.push({ date: endDate, amount: currentValue });
  return {
    invested: initialInvestment,
    withdrawn,
    units,
    currentValue,
    lastNav: finalNav,
    installments,
    lastWithdrawalAmount,
    lastWithdrawalDate,
    remainingInvested: Math.max(0, remainingInvested),
    xirr: calculateXirr(cashFlows),
  };
};
export const calculateSwpGrowth = (
  navData: NavType[],
  investmentDate: string,
  withdrawalStartDate: string,
  endDate: string,
  initialInvestment: number,
  monthlyWithdrawal: number,
  annualStepUp: number,
  installmentDay?: number
): NavPoint[] => {
  validateInputs(investmentDate, endDate, initialInvestment);
  validateInputs(withdrawalStartDate, endDate, monthlyWithdrawal);
  if (toDate(withdrawalStartDate) < toDate(investmentDate)) {
    throw new Error('SWP start date cannot be before the investment date.');
  }
  const effectiveInvestmentDate = getEffectiveStartDate(investmentDate, navData);
  const effectiveWithdrawalStartDate = getEffectiveSwpStartDate(
    investmentDate,
    withdrawalStartDate,
    navData
  );
  const startNav = getNav(effectiveInvestmentDate, navData);
  const endNav = getNav(endDate, navData);
  if (!startNav || !endNav) {
    throw new Error('No NAV data is available for the selected dates.');
  }
  let units = initialInvestment / startNav.nav;
  let withdrawalIndex = 0;
  const withdrawals = getMonthlyDates(effectiveWithdrawalStartDate, endDate, installmentDay)
    .map((date, index) => {
      const nav = getNav(date, navData);
      return nav
        ? {
            date: nav.date,
            units:
              (monthlyWithdrawal * Math.pow(1 + annualStepUp / 100, Math.floor(index / 12))) /
              nav.nav,
          }
        : undefined;
    })
    .filter((withdrawal): withdrawal is { date: string; units: number } => Boolean(withdrawal));
  const startTime = toDate(startNav.date).getTime();
  const endTime = toDate(endNav.date).getTime();
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
    .map(({ point, time, nav }) => {
      while (
        withdrawalIndex < withdrawals.length &&
        toDate(withdrawals[withdrawalIndex].date).getTime() <= time
      ) {
        units = Math.max(0, units - withdrawals[withdrawalIndex].units);
        withdrawalIndex += 1;
      }
      return { date: point.date, nav: Number((units * nav).toFixed(2)) };
    });
};
