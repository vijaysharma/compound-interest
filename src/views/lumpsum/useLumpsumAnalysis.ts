import { useMemo } from 'react';
import type { NavType } from '../../types/types';
import type { PinnedFund, FundAnalysis } from '../../components/mutual-fund/types';
import { getDuration, getNearest } from '../../utilities/utility';
const getNavDateTime = (date: string): number => {
  const parts = date.split('-');
  if (parts.length !== 3) return Number.NaN;
  const day = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const year = Number(parts[2]);
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return Number.NaN;
  return new Date(year, month, day).getTime();
};
export function useLumpsumAnalysis(
  pinnedFunds: PinnedFund[],
  pinnedNavData: Record<string, NavType[]>,
  startDate: string | null,
  endDate: string | null,
  invAmt: string,
  viewChart: boolean
) {
  const fundAnalyses = useMemo<FundAnalysis[]>(() => {
    return pinnedFunds.map((fund) => {
      const navData = pinnedNavData[fund.schemeCode] ?? [];
      if (navData.length === 0) {
        return { schemeCode: fund.schemeCode, schemeName: fund.schemeName, color: fund.color, startNav: undefined, endNav: undefined, profit: 0, absProfit: 0, matureAmt: 0, profitAmt: 0 };
      }
      const start = startDate ? getNearest(startDate, navData) : undefined;
      const end = endDate ? getNearest(endDate, navData) : undefined;
      if (!start || !end) {
        return { schemeCode: fund.schemeCode, schemeName: fund.schemeName, color: fund.color, startNav: start, endNav: end, profit: 0, absProfit: 0, matureAmt: 0, profitAmt: 0 };
      }
      const startValue = parseFloat(start.nav);
      const endValue = parseFloat(end.nav);
      const investment = parseFloat(invAmt) || 0;
      if (!Number.isFinite(startValue) || !Number.isFinite(endValue) || startValue <= 0) {
        return { schemeCode: fund.schemeCode, schemeName: fund.schemeName, color: fund.color, startNav: start, endNav: end, profit: 0, absProfit: 0, matureAmt: 0, profitAmt: 0 };
      }
      const durationYears = Math.max(getDuration({ startDate: start.date, endDate: end.date }), 1 / 365);
      const cagr = (endValue / startValue) ** (1 / durationYears) - 1;
      const absoluteReturn = ((endValue - startValue) / startValue) * 100;
      const matureAmount = (investment / startValue) * endValue;
      const profitAmount = matureAmount - investment;
      return {
        schemeCode: fund.schemeCode,
        schemeName: fund.schemeName,
        color: fund.color,
        startNav: start,
        endNav: end,
        profit: cagr * 100,
        absProfit: absoluteReturn,
        matureAmt: Number(matureAmount.toFixed(2)),
        profitAmt: Number(profitAmount.toFixed(2)),
      };
    });
  }, [pinnedFunds, pinnedNavData, startDate, endDate, invAmt]);
  const chartDatasets = useMemo(() => {
    if (!viewChart) return [];
    return pinnedFunds.map((fund) => {
      const navData = pinnedNavData[fund.schemeCode] ?? [];
      if (navData.length === 0 || !startDate || !endDate) return { label: fund.schemeName, color: fund.color, data: [] };
      const start = getNearest(startDate, navData);
      const end = getNearest(endDate, navData);
      if (!start || !end) return { label: fund.schemeName, color: fund.color, data: [] };
      const startTime = getNavDateTime(start.date);
      const endTime = getNavDateTime(end.date);
      const lowerTime = Math.min(startTime, endTime);
      const upperTime = Math.max(startTime, endTime);
      const chartData = navData
        .map((nav) => ({ date: nav.date, nav: parseFloat(nav.nav), time: getNavDateTime(nav.date) }))
        .filter((p) => Number.isFinite(p.nav) && Number.isFinite(p.time) && p.time >= lowerTime && p.time <= upperTime)
        .sort((a, b) => a.time - b.time)
        .map(({ date, nav }) => ({ date, nav }));
      return { label: fund.schemeName, color: fund.color, data: chartData };
    });
  }, [viewChart, pinnedFunds, pinnedNavData, startDate, endDate]);
  return { fundAnalyses, chartDatasets };
}
