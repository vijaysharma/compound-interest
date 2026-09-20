import { SelectedFund, TopUpEvent, SwpConfig, SipConfig, ExecutionStage, StrategySummary } from './types';
import { FifoPortfolioTracker } from './strategyFifoEngine';
import { getCachedNav } from './strategyNavService';
import { extractExecutionStages, MonthlySimulationStep } from './stageExtractor';
import { simulateMonthlySeries } from './simulationStepRunner';
export function runStrategySimulation(
  investmentDate: string,
  initialAmount: number,
  sourceFunds: SelectedFund[],
  swpConfig: SwpConfig,
  sipConfig: SipConfig,
  sipFunds: SelectedFund[],
  topUps: TopUpEvent[],
  totalMonths = 120
): { stages: ExecutionStage[]; summary: StrategySummary; monthlySteps: MonthlySimulationStep[] } {
  const fifo = new FifoPortfolioTracker();
  const fundNavs = new Map<string, number>();
  const fundRates = new Map<string, number>();
  const fundCashIn = new Map<string, number>();
  const fundCashOut = new Map<string, number>();
  sourceFunds.forEach((f) => {
    const nav = getCachedNav(f.schemeCode);
    fundNavs.set(f.schemeCode, nav);
    fundRates.set(f.schemeCode, Math.pow(1 + f.expectedCagr / 100, 1 / 12) - 1);
    const allocAmt = initialAmount * (f.allocationPercent / 100);
    fifo.addLot(f.schemeCode, allocAmt / nav, nav, investmentDate || '2024-01-01', f.fundType);
    fundCashIn.set(f.schemeCode, allocAmt);
    fundCashOut.set(f.schemeCode, 0);
  });
  const sipCagr = sipFunds.reduce((acc, f) => acc + (f.allocationPercent / 100) * f.expectedCagr, 0) || 12;
  const sipMonthlyRate = Math.pow(1 + sipCagr / 100, 1 / 12) - 1;
  const startDateObj = new Date(investmentDate || '2024-01-01');
  const swpStartObj = new Date(swpConfig.startDate || '2025-01-01');
  const swpChangeObj = new Date(swpConfig.changeDate || '2027-01-01');
  const swpStartMonth = Math.max(1, Math.round((swpStartObj.getTime() - startDateObj.getTime()) / (30.44 * 86400000)));
  const swpChangeMonth = swpConfig.hasChange
    ? Math.max(1, Math.round((swpChangeObj.getTime() - startDateObj.getTime()) / (30.44 * 86400000)))
    : -1;
  const { monthlySteps, topUpMonths, cumSip } = simulateMonthlySeries(
    totalMonths,
    startDateObj,
    swpStartObj,
    swpChangeObj,
    sourceFunds,
    swpConfig,
    sipConfig,
    sipMonthlyRate,
    topUps,
    initialAmount,
    { fifo, fundNavs, fundRates, fundCashIn, fundCashOut }
  );
  const stages = extractExecutionStages(monthlySteps, sourceFunds, swpStartMonth, swpChangeMonth, topUpMonths);
  const lastStep = monthlySteps[monthlySteps.length - 1];
  return {
    stages,
    monthlySteps,
    summary: {
      totalInitialInvested: initialAmount,
      totalTopUps: lastStep ? lastStep.cumulativeInvested - initialAmount : 0,
      totalSwpWithdrawn: lastStep ? lastStep.cumulativeWithdrawn : 0,
      totalTaxPaid: lastStep ? lastStep.cumulativeTaxPaid : 0,
      netCashflowReceived: lastStep ? lastStep.cumulativeWithdrawn - lastStep.cumulativeTaxPaid : 0,
      totalSipInvested: Math.round(cumSip),
      finalSourceBalance: lastStep ? lastStep.sourceBalance : 0,
      finalSipBalance: lastStep ? lastStep.sipBalance : 0,
      finalCombinedNetWorth: lastStep ? lastStep.combinedNetWorth : 0,
    },
  };
}
