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
