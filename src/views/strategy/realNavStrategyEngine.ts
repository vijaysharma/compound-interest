import { NavType } from '../../types/types';
import { getNearest } from '../../utilities/navUtils';
import { SwpInterval, RecurringTopUpSource, Column1GrowthPoint } from './column1Types';
export interface RealNavSimulationResult {
  points: Column1GrowthPoint[];
  finalFundSize: number;
  totalInvested: number;
  totalWithdrawn: number;
  totalUnits: number;
}
export function runRealNavSimulation(
  investmentDate: string,
  investmentAmount: number,
  swpIntervals: SwpInterval[],
  topUps: RecurringTopUpSource[],
  navData: NavType[]
): RealNavSimulationResult {
  if (!navData || navData.length === 0 || investmentAmount <= 0) {
    return { points: [], finalFundSize: 0, totalInvested: investmentAmount, totalWithdrawn: 0, totalUnits: 0 };
  }
  const startNavObj = getNearest(investmentDate, navData);
  const startNav = startNavObj ? parseFloat(startNavObj.nav) : 100;
  let currentUnits = investmentAmount / startNav;
  let cumInvested = investmentAmount;
  let cumWithdrawn = 0;
  const points: Column1GrowthPoint[] = [];
  const startDt = new Date(investmentDate);
  const totalMonths = 120; // 10 years continuous timeline
  for (let m = 0; m <= totalMonths; m++) {
    const curDate = new Date(startDt);
    curDate.setMonth(startDt.getMonth() + m);
    const dateStr = curDate.toISOString().slice(0, 10);
    const dayNavObj = getNearest(dateStr, navData);
    const dayNav = dayNavObj ? parseFloat(dayNavObj.nav) : startNav;
    // Process top-ups scheduled for this month
    if (m > 0) {
      topUps.forEach((tu) => {
        if (!tu.enabled || !tu.startDate) return;
        const tuStart = new Date(tu.startDate);
        const tuEnd = tu.endDate ? new Date(tu.endDate) : null;
        if (curDate < tuStart || (tuEnd && curDate > tuEnd)) return;
        const monthsDiff = (curDate.getFullYear() - tuStart.getFullYear()) * 12 + (curDate.getMonth() - tuStart.getMonth());
        let isTriggerMonth = false;
        if (tu.frequency === 'Monthly') isTriggerMonth = true;
        else if (tu.frequency === 'Quarterly' && monthsDiff % 3 === 0) isTriggerMonth = true;
        else if (tu.frequency === 'Yearly' && monthsDiff % 12 === 0) isTriggerMonth = true;
        if (isTriggerMonth && dayNav > 0) {
          const unitsAdded = tu.amount / dayNav;
          currentUnits += unitsAdded;
          cumInvested += tu.amount;
        }
      });
    }
    // Process SWP withdrawals scheduled for this month
    if (m > 0 && currentUnits > 0) {
      for (const interval of swpIntervals) {
        const fromDt = new Date(interval.fromDate);
        const toDt = new Date(interval.toDate);
        if (curDate >= fromDt && curDate <= toDt) {
          const monthsFromFrom = (curDate.getFullYear() - fromDt.getFullYear()) * 12 + (curDate.getMonth() - fromDt.getMonth());
          let isSwpMonth = false;
          if (interval.frequency === 'monthly') isSwpMonth = true;
          else if (interval.frequency === 'quarterly' && monthsFromFrom % 3 === 0) isSwpMonth = true;
          else if (interval.frequency === 'yearly' && monthsFromFrom % 12 === 0) isSwpMonth = true;
          if (isSwpMonth) {
            let swpAmt = interval.amount;
            if (interval.enableStepUp && monthsFromFrom >= 12) {
              const yearsElapsed = Math.floor(monthsFromFrom / 12);
              swpAmt = interval.stepUpType === 'percentage'
                ? interval.amount * Math.pow(1 + interval.stepUpValue / 100, yearsElapsed)
                : interval.amount + interval.stepUpValue * yearsElapsed;
            }
            const unitsToRedeem = Math.min(currentUnits, swpAmt / dayNav);
            currentUnits = Math.max(0, currentUnits - unitsToRedeem);
            cumWithdrawn += unitsToRedeem * dayNav;
          }
          break; // Use active interval
        }
      }
    }
    const currentFundSize = Math.max(0, currentUnits * dayNav);
    points.push({
      date: dateStr,
      netFundSize: Math.round(currentFundSize),
      cumulativeWithdrawals: Math.round(cumWithdrawn),
      cumulativeInvested: Math.round(cumInvested),
      nav: dayNav,
      units: Math.round(currentUnits * 100) / 100,
    });
  }
  const last = points[points.length - 1];
  return {
    points,
    finalFundSize: last ? last.netFundSize : 0,
    totalInvested: Math.round(cumInvested),
    totalWithdrawn: Math.round(cumWithdrawn),
    totalUnits: last ? last.units : 0,
  };
}
