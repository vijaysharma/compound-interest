export type FundType = 'equity' | 'debt';
export interface SelectedFund {
  schemeCode: string;
  schemeName: string;
  allocationPercent: number;
  expectedCagr: number;
  fundType: FundType;
}
export interface TopUpEvent {
  id: string;
  date: string;
  amount: number;
  note?: string;
}
export interface SwpConfig {
  startDate: string;
  baseAmount: number;
  hasChange: boolean;
  changeDate: string;
  changeType: 'percentage' | 'fixed';
  changeValue: number;
}
export interface SipConfig {
  enabled: boolean;
  linkToSwp: boolean;
  startDate: string;
  amount: number;
  stepUpFrequency: 'Monthly' | 'Quarterly' | 'Yearly';
  stepUpPercent: number;
}
export interface FundLot {
  schemeCode: string;
  units: number;
  purchaseNav: number;
  purchaseDate: string;
  costBasis: number;
  fundType: FundType;
}
export interface FundStageMetrics {
  schemeCode: string;
  schemeName: string;
  fundType: FundType;
  allocationPercent: number;
  currentNav: number;
  units: number;
  costBasis: number;
  currentValue: number;
  absoluteReturn: number;
  cagr: number;
  cashFlowIn: number;
  cashFlowOut: number;
}
export interface StageTaxSummary {
  grossWithdrawalOrRealized: number;
  stcgGains: number;
  ltcgGains: number;
  stcgTax: number;
  ltcgTax: number;
  debtTax: number;
  totalTaxPayable: number;
  netPostTaxCashFlow: number;
  preTaxPortfolioValue: number;
  postTaxPortfolioValue: number;
  effectiveTaxRate: number;
}
export interface ExecutionStage {
  id: string;
  stageNumber: number;
  title: string;
  badge: string;
  date: string;
  monthIndex: number;
  description: string;
  preTaxPortfolioValue: number;
  postTaxPortfolioValue: number;
  cumulativeInvested: number;
  cumulativeWithdrawn: number;
  cumulativeTaxPaid: number;
  combinedNetWorth: number;
  fundMetrics: FundStageMetrics[];
  taxSummary: StageTaxSummary;
  trajectoryPoints: Array<{ month: number; date: string; value: number; cost: number }>;
}
export interface StrategySummary {
  totalInitialInvested: number;
  totalTopUps: number;
  totalSwpWithdrawn: number;
  totalTaxPaid: number;
  netCashflowReceived: number;
  totalSipInvested: number;
  finalSourceBalance: number;
  finalSipBalance: number;
  finalCombinedNetWorth: number;
}
export interface Streamline {
  id: string;
  name: string;
  color: string;
  investmentDate: string;
  investmentAmount: string;
  sourceFunds: SelectedFund[];
  swpConfig: SwpConfig;
  sipConfig: SipConfig;
  sipFunds: SelectedFund[];
  topUps: TopUpEvent[];
  durationYears: number;
  swpStartDate?: string;
  swpEndDate?: string;
  swpIntervals?: import('./column1Types').SwpInterval[];
  recurringTopUps?: import('./column1Types').RecurringTopUpSource[];
}
export type { SwpFrequency, StepUpType, SwpInterval, SelectedFundAllocation, StrategyColumn1State, RecurringTopUpSource, Column1GrowthPoint } from './column1Types';
export interface TimelineStage {
  monthIndex: number;
  date: string;
  eventDescription: string;
  sourceOpeningBalance: number;
  sourceReturns: number;
  topUpAdded: number;
  swpGrossWithdrawn: number;
  stcgGains: number;
  ltcgGains: number;
  taxPayable: number;
  swpNetReceived: number;
  sourceClosingBalance: number;
  sipInjected: number;
  sipReturns: number;
  sipClosingBalance: number;
  combinedNetWorth: number;
}
