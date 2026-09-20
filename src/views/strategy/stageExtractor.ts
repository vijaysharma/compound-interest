import { ExecutionStage, FundStageMetrics, SelectedFund, StageTaxSummary } from './types';
export interface MonthlySimulationStep {
  monthIndex: number;
  date: string;
  sourceBalance: number;
  sourceCost: number;
  sipBalance: number;
  combinedNetWorth: number;
  grossSwp: number;
  taxPaid: number;
  netSwp: number;
  topUpAmount: number;
  cumulativeInvested: number;
  cumulativeWithdrawn: number;
  cumulativeTaxPaid: number;
  fundBalances: Map<string, { units: number; nav: number; costBasis: number; cashIn: number; cashOut: number }>;
  taxDetails: { stcgGains: number; ltcgGains: number; stcgTax: number; ltcgTax: number; debtTax: number; totalTax: number };
}
export function extractExecutionStages(
  steps: MonthlySimulationStep[],
  sourceFunds: SelectedFund[],
  swpStartMonth: number,
  swpChangeMonth: number,
  topUpMonths: number[]
): ExecutionStage[] {
  if (steps.length === 0) return [];
  const totalMonths = steps.length;
  const milestoneMonthSet = new Set<number>([1]);
  if (swpStartMonth > 1 && swpStartMonth <= totalMonths) milestoneMonthSet.add(swpStartMonth);
  if (swpChangeMonth > 1 && swpChangeMonth <= totalMonths) milestoneMonthSet.add(swpChangeMonth);
  for (const tm of topUpMonths) {
    if (tm >= 1 && tm <= totalMonths) milestoneMonthSet.add(tm);
  }
  // Intermediate checkpoints (e.g. Year 3, Year 5, Year 7 if applicable)
  [36, 60, 84].forEach((m) => {
    if (m <= totalMonths) milestoneMonthSet.add(m);
  });
  milestoneMonthSet.add(totalMonths);
  const sortedMilestoneMonths = Array.from(milestoneMonthSet).sort((a, b) => a - b);
  return sortedMilestoneMonths.map((mIndex, idx) => {
    const step = steps[mIndex - 1];
    let badge = 'Growth';
    let title = `Stage ${idx + 1}: Compounding Phase`;
    let description = 'Portfolio compounding under active asset allocation.';
    if (mIndex === 1) {
      badge = 'Initial';
      title = 'Stage 1: Capital Inception';
      description = 'Initial deployment across selected mutual fund portfolio.';
    } else if (mIndex === swpStartMonth) {
      badge = 'SWP Active';
      title = `Stage ${idx + 1}: SWP Trigger Initiation`;
      description = 'Systematic redemptions commence with parallel SIP routing.';
    } else if (topUpMonths.includes(mIndex)) {
      badge = 'Top-Up';
      title = `Stage ${idx + 1}: Capital Top-Up Inflow`;
      description = 'Additional capital injection deployed into portfolio.';
    } else if (mIndex === swpChangeMonth) {
      badge = 'Step-Up';
      title = `Stage ${idx + 1}: Step-Up Adjustment`;
      description = 'Withdrawal amount dynamically stepped up to match cashflow target.';
    } else if (mIndex === totalMonths) {
      badge = 'Maturity';
      title = `Stage ${idx + 1}: Final Maturity Horizon`;
      description = 'Terminal valuation and multi-tier wealth distribution outcome.';
    }
    const fundMetrics: FundStageMetrics[] = sourceFunds.map((fund) => {
      const fundState = step.fundBalances.get(fund.schemeCode) || {
        units: 0,
        nav: 100,
        costBasis: 0,
        cashIn: 0,
        cashOut: 0,
      };
      const curVal = fundState.units * fundState.nav;
      const absReturn = curVal - fundState.costBasis;
      const years = mIndex / 12;
      const cagr = fundState.costBasis > 0 && years > 0
        ? (Math.pow(curVal / fundState.costBasis, 1 / years) - 1) * 100
        : fund.expectedCagr;
      return {
        schemeCode: fund.schemeCode,
        schemeName: fund.schemeName,
        fundType: fund.fundType,
        allocationPercent: fund.allocationPercent,
        currentNav: Math.round(fundState.nav * 100) / 100,
        units: Math.round(fundState.units * 100) / 100,
        costBasis: Math.round(fundState.costBasis),
        currentValue: Math.round(curVal),
        absoluteReturn: Math.round(absReturn),
        cagr: Math.round(cagr * 10) / 10,
        cashFlowIn: Math.round(fundState.cashIn),
        cashFlowOut: Math.round(fundState.cashOut),
      };
    });
    const taxSummary: StageTaxSummary = {
      grossWithdrawalOrRealized: step.grossSwp,
      stcgGains: step.taxDetails.stcgGains,
      ltcgGains: step.taxDetails.ltcgGains,
      stcgTax: step.taxDetails.stcgTax,
      ltcgTax: step.taxDetails.ltcgTax,
      debtTax: step.taxDetails.debtTax,
      totalTaxPayable: step.taxPaid,
      netPostTaxCashFlow: step.netSwp,
      preTaxPortfolioValue: step.sourceBalance + step.grossSwp,
      postTaxPortfolioValue: step.sourceBalance,
      effectiveTaxRate: step.grossSwp > 0 ? Math.round((step.taxPaid / step.grossSwp) * 1000) / 10 : 0,
    };
    const trajectoryPoints = steps.slice(0, mIndex).map((s) => ({
      month: s.monthIndex,
      date: s.date,
      value: s.combinedNetWorth,
      cost: s.cumulativeInvested,
    }));
    return {
      id: `stage-${idx + 1}-${mIndex}`,
      stageNumber: idx + 1,
      title,
      badge,
      date: step.date,
      monthIndex: mIndex,
      description,
      preTaxPortfolioValue: Math.round(step.sourceBalance + step.grossSwp),
      postTaxPortfolioValue: Math.round(step.sourceBalance),
      cumulativeInvested: Math.round(step.cumulativeInvested),
      cumulativeWithdrawn: Math.round(step.cumulativeWithdrawn),
      cumulativeTaxPaid: Math.round(step.cumulativeTaxPaid),
      combinedNetWorth: Math.round(step.combinedNetWorth),
      fundMetrics,
      taxSummary,
      trajectoryPoints,
    };
  });
}
