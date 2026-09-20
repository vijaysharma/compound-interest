import { FundType } from './types';
export type SwpFrequency = 'monthly' | 'quarterly' | 'yearly';
export type StepUpType = 'percentage' | 'fixed';
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
export interface StrategyColumn1State {
  investmentDate: string;
  investmentAmount: number;
  selectedFunds: Array<{ fundId: string; schemeName?: string; allocationPercentage: number; fundType?: FundType; expectedCagr?: number }>;
  swpStartDate: string;
  swpEndDate: string;
  swpIntervals: SwpInterval[];
}
