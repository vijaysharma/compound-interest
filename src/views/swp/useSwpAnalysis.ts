import { useMemo } from 'react';
import type { NavType } from '../../types/types';
import type { PinnedFund } from '../../components/mutual-fund/types';
import type { ChartDataset } from '../../components/chart/types';
import type { SwpFundAnalysis } from './types';
import { getNearest } from '../../utilities/utility';
import { calculateSwp, calculateSwpGrowth } from '../../utilities/mutualFundCalculations';
const getNavDateTime = (date: string): number => {
  const [day, month, year] = date.split('-').map(Number);
  return Number.isFinite(day) && Number.isFinite(month) && Number.isFinite(year)
    ? new Date(year, month - 1, day).getTime()
    : Number.NaN;
};
const getLatestNav = (data: NavType[]): NavType | undefined => {
  return data.reduce<NavType | undefined>((latest, nav) => {
    const navTime = getNavDateTime(nav.date);
    return Number.isFinite(Number(nav.nav)) &&
      Number.isFinite(navTime) &&
      (!latest || navTime > getNavDateTime(latest.date))
      ? nav
      : latest;
  }, undefined);
};
export function useSwpAnalysis(
  pinnedFunds: PinnedFund[],
  pinnedNavData: Record<string, NavType[]>,
  lumpsumStartDate: string | null,
  startSwpDate: string | null,
  endSwpDate: string | null,
  lumpSumInvestmentAmount: string,
  monthlyWithdrawalAmount: string,
  investmentStepUp: string,
  dayOfMonth: string,
  viewChart: boolean
) {
  const fundAnalyses = useMemo<SwpFundAnalysis[]>(() => {
    return pinnedFunds.map((fund) => {
      const navData = pinnedNavData[fund.schemeCode] ?? [];
      const emptyItem: SwpFundAnalysis = {
        schemeCode: fund.schemeCode, schemeName: fund.schemeName, color: fund.color,
        startNav: undefined, endNav: undefined, profit: 0, absProfit: 0, matureAmt: 0,
        profitAmt: 0, invested: 0, units: 0, averageNav: 0, installments: 0, xirr: undefined,
      };
      if (navData.length === 0) return emptyItem;
      const start = startSwpDate ? getNearest(startSwpDate, navData) : undefined;
      const end = endSwpDate ? getNearest(endSwpDate, navData) : undefined;
      if (!start || !end) return { ...emptyItem, startNav: start, endNav: end };
      const startValue = parseFloat(start.nav);
      if (!Number.isFinite(startValue) || startValue <= 0) return { ...emptyItem, startNav: start, endNav: end };
      try {
        const simulation = calculateSwp(
          navData, lumpsumStartDate ?? '', startSwpDate ?? '', endSwpDate ?? '',
          Number(lumpSumInvestmentAmount), Number(monthlyWithdrawalAmount),
          Number(investmentStepUp), Number(dayOfMonth)
        );
        const matureAmount = simulation.currentValue;
        const latestNav = getLatestNav(navData);
        const latestValue = latestNav ? Number((simulation.units * Number(latestNav.nav)).toFixed(2)) : undefined;
        const absProfit = ((latestValue ?? simulation.currentValue) / simulation.invested - 1) * 100;
        const profitAmount = Math.round(
          simulation.withdrawn + (latestValue ?? simulation.currentValue) - simulation.invested
        );
        return {
          schemeCode: fund.schemeCode, schemeName: fund.schemeName, color: fund.color,
          startNav: start, endNav: end, profit: simulation.xirr ? simulation.xirr * 100 : 0,
          absProfit, matureAmt: Number(matureAmount.toFixed(2)), latestValue,
          latestNavDate: latestNav?.date, latestXirr: simulation.latestXirr,
          totalWithdrawn: simulation.withdrawn, lastWithdrawalAmount: simulation.lastWithdrawalAmount,
          lastWithdrawalDate: simulation.lastWithdrawalDate, profitAmt: Number(profitAmount.toFixed(2)),
          invested: simulation.invested, units: simulation.units,
          averageNav: simulation.units > 0 ? (simulation.remainingInvested ?? simulation.invested) / simulation.units : 0,
          installments: simulation.installments, xirr: simulation.xirr,
        };
      } catch {
        return { ...emptyItem, startNav: start, endNav: end };
      }
    });
  }, [pinnedFunds, pinnedNavData, lumpsumStartDate, startSwpDate, endSwpDate, lumpSumInvestmentAmount, monthlyWithdrawalAmount, investmentStepUp, dayOfMonth]);
  const chartDatasets = useMemo<ChartDataset[]>(() => {
    if (!viewChart) return [];
    return pinnedFunds.map((fund) => {
      const navData = pinnedNavData[fund.schemeCode] ?? [];
      if (navData.length === 0 || !startSwpDate || !endSwpDate) return { label: fund.schemeName, color: fund.color, data: [] };
      try {
        const chartData = calculateSwpGrowth(
          navData, lumpsumStartDate ?? '', startSwpDate, endSwpDate,
          Number(lumpSumInvestmentAmount), Number(monthlyWithdrawalAmount),
          Number(investmentStepUp), Number(dayOfMonth)
        );
        return { label: fund.schemeName, color: fund.color, data: chartData };
      } catch {
        return { label: fund.schemeName, color: fund.color, data: [] };
      }
    });
  }, [viewChart, pinnedFunds, pinnedNavData, lumpsumStartDate, startSwpDate, endSwpDate, lumpSumInvestmentAmount, monthlyWithdrawalAmount, investmentStepUp, dayOfMonth]);
  return { fundAnalyses, chartDatasets };
}
