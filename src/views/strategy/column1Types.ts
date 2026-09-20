import { FundType } from './types';
export type SwpFrequency = 'monthly' | 'quarterly' | 'yearly';
export type StepUpType = 'percentage' | 'fixed';
export type TopUpFrequency = 'Monthly' | 'Quarterly' | 'Yearly';
export interface SwpInterval {
  id: string;
  fromDate: string;
  toDate: string;
  amount: number;
  frequency: SwpFrequency;
  enableStepUp: boolean;
  stepUpType: StepUpType;
  stepUpValue: number;
}
export interface SelectedFundAllocation {
  fundId: string;
  schemeName?: string;
  allocationPercentage: number;
  fundType?: FundType;
  expectedCagr?: number;
}
export interface RecurringTopUpSource {
  id: string;
  name: string;
  amount: number;
  frequency: TopUpFrequency;
  startDate: string;
  endDate?: string;
  enabled: boolean;
}
export interface Column1GrowthPoint {
  date: string;
  netFundSize: number;
  cumulativeWithdrawals: number;
  cumulativeInvested: number;
  nav: number;
  units: number;
}
export interface StrategyColumn1State {
  investmentDate: string;
  investmentAmount: number;
  selectedFund: { fundId: string; schemeName: string; fundType?: FundType };
  swpStartDate: string;
  swpEndDate: string;
  swpIntervals: SwpInterval[];
  recurringTopUps: RecurringTopUpSource[];
}
