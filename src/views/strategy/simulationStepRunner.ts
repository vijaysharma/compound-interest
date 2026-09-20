import { SelectedFund, TopUpEvent, SwpConfig, SipConfig } from './types';
import { FifoPortfolioTracker } from './strategyFifoEngine';
import { MonthlySimulationStep } from './stageExtractor';
export interface SimulationContext {
  fifo: FifoPortfolioTracker;
  fundNavs: Map<string, number>;
  fundRates: Map<string, number>;
  fundCashIn: Map<string, number>;
  fundCashOut: Map<string, number>;
}
export function simulateMonthlySeries(
  totalMonths: number,
  startDateObj: Date,
  swpStartObj: Date,
  swpChangeObj: Date,
  sourceFunds: SelectedFund[],
  swpConfig: SwpConfig,
  sipConfig: SipConfig,
  sipMonthlyRate: number,
  topUps: TopUpEvent[],
  initialAmount: number,
  ctx: SimulationContext
): { monthlySteps: MonthlySimulationStep[]; topUpMonths: number[]; cumSip: number } {
  const { fifo, fundNavs, fundRates, fundCashIn, fundCashOut } = ctx;
  const steps: MonthlySimulationStep[] = [];
  const topUpMonths: number[] = [];
  let cumInvested = initialAmount;
  let cumWithdrawn = 0;
  let cumTaxPaid = 0;
  let cumSip = 0;
  let sipBal = 0;
  for (let m = 1; m <= totalMonths; m++) {
    const curDate = new Date(startDateObj);
    curDate.setMonth(startDateObj.getMonth() + m);
    const dateStr = curDate.toISOString().slice(0, 10);
    sourceFunds.forEach((f) => {
      const curNav = fundNavs.get(f.schemeCode) || 100;
      fundNavs.set(f.schemeCode, curNav * (1 + (fundRates.get(f.schemeCode) || 0)));
    });
    let topUpThisMonth = 0;
    topUps.forEach((tu) => {
      if (tu.date.slice(0, 7) === dateStr.slice(0, 7)) {
        topUpThisMonth += tu.amount;
        cumInvested += tu.amount;
        topUpMonths.push(m);
        sourceFunds.forEach((f) => {
          const alloc = tu.amount * (f.allocationPercent / 100);
          const nav = fundNavs.get(f.schemeCode) || 100;
          fifo.addLot(f.schemeCode, alloc / nav, nav, dateStr, f.fundType);
          fundCashIn.set(f.schemeCode, (fundCashIn.get(f.schemeCode) || 0) + alloc);
        });
      }
    });
    let sourceVal = 0;
    sourceFunds.forEach((f) => {
      sourceVal += fifo.getFundUnits(f.schemeCode) * (fundNavs.get(f.schemeCode) || 100);
    });
    let grossSwp = 0;
    if (curDate >= swpStartObj && sourceVal > 0) {
      grossSwp = swpConfig.baseAmount;
      if (swpConfig.hasChange && curDate >= swpChangeObj) {
        grossSwp = swpConfig.changeType === 'percentage'
          ? swpConfig.baseAmount * (1 + swpConfig.changeValue / 100)
          : swpConfig.baseAmount + swpConfig.changeValue;
      }
      grossSwp = Math.min(grossSwp, sourceVal);
    }
    let mTax = 0;
    let mStcg = 0;
    let mLtcg = 0;
    let mDebt = 0;
    let mNetSwp = 0;
    if (grossSwp > 0 && sourceVal > 0) {
      sourceFunds.forEach((f) => {
        const fNav = fundNavs.get(f.schemeCode) || 100;
        const fUnits = fifo.getFundUnits(f.schemeCode);
        const fVal = fUnits * fNav;
        const portion = grossSwp * (fVal / sourceVal);
        const res = fifo.redeemUnitsFifo(f.schemeCode, dateStr, fNav, portion / fNav);
        mTax += res.totalTax;
        mStcg += res.stcgGains;
        mLtcg += res.ltcgGains;
        mDebt += res.debtGains;
        mNetSwp += res.netProceeds;
        fundCashOut.set(f.schemeCode, (fundCashOut.get(f.schemeCode) || 0) + res.grossAmount);
      });
    }
    cumWithdrawn += grossSwp;
    cumTaxPaid += mTax;
    let sipInflow = 0;
    if (sipConfig.enabled) {
      if (sipConfig.linkToSwp) {
        sipInflow = mNetSwp;
      } else {
        const factor = sipConfig.stepUpFrequency === 'Monthly' ? m : sipConfig.stepUpFrequency === 'Quarterly' ? Math.floor(m / 3) : Math.floor(m / 12);
        sipInflow = sipConfig.amount * Math.pow(1 + sipConfig.stepUpPercent / 100, factor);
      }
      cumSip += sipInflow;
    }
    sipBal = sipBal + sipInflow + (sipBal + sipInflow) * sipMonthlyRate;
    const fundBalances = new Map<string, { units: number; nav: number; costBasis: number; cashIn: number; cashOut: number }>();
    let finalSourceBal = 0;
    let totalCost = 0;
    sourceFunds.forEach((f) => {
      const u = fifo.getFundUnits(f.schemeCode);
      const n = fundNavs.get(f.schemeCode) || 100;
      const c = fifo.getFundCostBasis(f.schemeCode);
      finalSourceBal += u * n;
      totalCost += c;
      fundBalances.set(f.schemeCode, { units: u, nav: n, costBasis: c, cashIn: fundCashIn.get(f.schemeCode) || 0, cashOut: fundCashOut.get(f.schemeCode) || 0 });
    });
    steps.push({
      monthIndex: m,
      date: dateStr,
      sourceBalance: Math.round(finalSourceBal),
      sourceCost: Math.round(totalCost),
      sipBalance: Math.round(sipBal),
      combinedNetWorth: Math.round(finalSourceBal + sipBal),
      grossSwp: Math.round(grossSwp),
      taxPaid: Math.round(mTax),
      netSwp: Math.round(mNetSwp),
      topUpAmount: Math.round(topUpThisMonth),
      cumulativeInvested: Math.round(cumInvested),
      cumulativeWithdrawn: Math.round(cumWithdrawn),
      cumulativeTaxPaid: Math.round(cumTaxPaid),
      fundBalances,
      taxDetails: { stcgGains: Math.round(mStcg), ltcgGains: Math.round(mLtcg), stcgTax: Math.round(mStcg * 0.2), ltcgTax: Math.round(mLtcg * 0.125), debtTax: Math.round(mDebt * 0.3), totalTax: Math.round(mTax) },
    });
  }
  return { monthlySteps: steps, topUpMonths, cumSip };
}
