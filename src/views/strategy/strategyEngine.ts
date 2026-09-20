import { SelectedFund, TopUpEvent, SwpConfig, SipConfig, TimelineStage, StrategySummary } from './types';
import { TaxTracker } from './strategyTaxEngine';
export function runStrategySimulation(
  investmentDate: string,
  initialAmount: number,
  sourceFunds: SelectedFund[],
  swpConfig: SwpConfig,
  sipConfig: SipConfig,
  sipFunds: SelectedFund[],
  topUps: TopUpEvent[],
  totalMonths = 120
): { stages: TimelineStage[]; summary: StrategySummary } {
  const sourceCagr = sourceFunds.reduce((acc, f) => acc + (f.allocationPercent / 100) * f.expectedCagr, 0) || 12;
  const sourceMonthlyRate = Math.pow(1 + sourceCagr / 100, 1 / 12) - 1;
  const sipCagr = sipFunds.reduce((acc, f) => acc + (f.allocationPercent / 100) * f.expectedCagr, 0) || 12;
  const sipMonthlyRate = Math.pow(1 + sipCagr / 100, 1 / 12) - 1;
  const equityWeight = sourceFunds.filter((f) => f.fundType === 'equity').reduce((a, f) => a + f.allocationPercent, 0) / 100;
  const stages: TimelineStage[] = [];
  const taxTracker = new TaxTracker();
  let sourceBal = initialAmount;
  let sourceCost = initialAmount;
  let sipBal = 0;
  let totalTopUps = 0;
  let totalSwpWithdrawn = 0;
  let totalTaxPaid = 0;
  let totalSipInvested = 0;
  const startDateObj = new Date(investmentDate || '2024-01-01');
  const swpStartObj = new Date(swpConfig.startDate || '2025-01-01');
  const swpChangeObj = new Date(swpConfig.changeDate || '2027-01-01');
  for (let m = 1; m <= totalMonths; m++) {
    const curDate = new Date(startDateObj);
    curDate.setMonth(startDateObj.getMonth() + m);
    const dateStr = curDate.toISOString().slice(0, 10);
    const daysSinceStart = Math.max(0, Math.floor((curDate.getTime() - startDateObj.getTime()) / 86400000));
    const openSource = sourceBal;
    const sReturns = openSource * sourceMonthlyRate;
    sourceBal += sReturns;
    let topUpThisMonth = 0;
    for (const tu of topUps) {
      if (tu.date.slice(0, 7) === dateStr.slice(0, 7)) {
        topUpThisMonth += tu.amount;
        sourceBal += tu.amount;
        sourceCost += tu.amount;
        totalTopUps += tu.amount;
      }
    }
    let grossSwp = 0;
    if (curDate >= swpStartObj && sourceBal > 0) {
      grossSwp = swpConfig.baseAmount;
      if (swpConfig.hasChange && curDate >= swpChangeObj) {
        grossSwp = swpConfig.changeType === 'percentage'
          ? swpConfig.baseAmount * (1 + swpConfig.changeValue / 100)
          : swpConfig.baseAmount + swpConfig.changeValue;
      }
      grossSwp = Math.min(grossSwp, sourceBal);
    }
    const taxRes = taxTracker.calculateRedemptionTax(dateStr, grossSwp, sourceCost, sourceBal, equityWeight, daysSinceStart);
    if (sourceBal > 0 && grossSwp > 0) {
      sourceCost = Math.max(0, sourceCost * (1 - grossSwp / sourceBal));
    }
    sourceBal = Math.max(0, sourceBal - grossSwp);
    totalSwpWithdrawn += grossSwp;
    totalTaxPaid += taxRes.taxPayable;
    let sipInflow = 0;
    if (sipConfig.enabled) {
      if (sipConfig.linkToSwp) {
        sipInflow = taxRes.netWithdrawn;
      } else {
        const stepFactor = sipConfig.stepUpFrequency === 'Monthly' ? m : sipConfig.stepUpFrequency === 'Quarterly' ? Math.floor(m / 3) : Math.floor(m / 12);
        sipInflow = sipConfig.amount * Math.pow(1 + sipConfig.stepUpPercent / 100, stepFactor);
      }
      totalSipInvested += sipInflow;
    }
    const sipReturns = (sipBal + sipInflow) * sipMonthlyRate;
    sipBal = sipBal + sipInflow + sipReturns;
    stages.push({
      monthIndex: m,
      date: dateStr,
      eventDescription: m === 1 ? 'Initial Phase' : grossSwp > 0 ? 'SWP Active' : 'Compounding Phase',
      sourceOpeningBalance: Math.round(openSource),
      sourceReturns: Math.round(sReturns),
      topUpAdded: Math.round(topUpThisMonth),
      swpGrossWithdrawn: Math.round(grossSwp),
      stcgGains: taxRes.stcgGains,
      ltcgGains: taxRes.ltcgGains,
      taxPayable: taxRes.taxPayable,
      swpNetReceived: taxRes.netWithdrawn,
      sourceClosingBalance: Math.round(sourceBal),
      sipInjected: Math.round(sipInflow),
      sipReturns: Math.round(sipReturns),
      sipClosingBalance: Math.round(sipBal),
      combinedNetWorth: Math.round(sourceBal + sipBal),
    });
  }
  return {
    stages,
    summary: {
      totalInitialInvested: initialAmount,
      totalTopUps,
      totalSwpWithdrawn: Math.round(totalSwpWithdrawn),
      totalTaxPaid: Math.round(totalTaxPaid),
      netCashflowReceived: Math.round(totalSwpWithdrawn - totalTaxPaid),
      totalSipInvested: Math.round(totalSipInvested),
      finalSourceBalance: Math.round(sourceBal),
      finalSipBalance: Math.round(sipBal),
      finalCombinedNetWorth: Math.round(sourceBal + sipBal),
    },
  };
}
