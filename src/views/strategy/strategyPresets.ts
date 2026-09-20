import type { ButtonDataType } from '../../types/types';
import { SelectedFund, SwpFrequency, StepUpType, SwpInterval } from './types';
import { TopUpFrequency, RecurringTopUpSource } from './column1Types';
export { DEFAULT_STREAMLINES } from './streamlinePresets';
export interface StrategyAmountStep {
  value: string;
  label: string;
}
export const STRATEGY_AMOUNT_PRESETS: StrategyAmountStep[] = [
  { value: '5000000', label: '₹50L' },
  { value: '10000000', label: '₹1Cr' },
  { value: '500000', label: '₹5L' },
  { value: '200000', label: '₹2L' },
];
export const FREQUENCY_BUTTONS: ButtonDataType<'Monthly' | 'Quarterly' | 'Yearly'>[] = [
  { id: 'freq-m', value: 'Monthly', title: 'Monthly' },
  { id: 'freq-q', value: 'Quarterly', title: 'Quarterly' },
  { id: 'freq-y', value: 'Yearly', title: 'Yearly' },
];
export const FREQUENCY_BUTTON_DATA = FREQUENCY_BUTTONS;
export const CHANGE_TYPE_BUTTONS: ButtonDataType<'percentage' | 'fixed'>[] = [
  { id: 'ct-pct', value: 'percentage', title: 'Percentage (%)' },
  { id: 'ct-fix', value: 'fixed', title: 'Flat Amount (₹)' },
];
export const SWP_FREQ_BUTTONS: ButtonDataType<SwpFrequency>[] = [
  { id: 'swp-freq-m', value: 'monthly', title: 'Monthly' },
  { id: 'swp-freq-q', value: 'quarterly', title: 'Quarterly' },
  { id: 'swp-freq-y', value: 'yearly', title: 'Yearly' },
];
export const STEP_UP_TYPE_BUTTONS: ButtonDataType<StepUpType>[] = [
  { id: 'su-pct', value: 'percentage', title: 'Percentage (%)' },
  { id: 'su-fix', value: 'fixed', title: 'Fixed Amount (₹)' },
];
export const TOPUP_FREQ_BUTTONS: ButtonDataType<TopUpFrequency>[] = [
  { id: 'tu-m', value: 'Monthly', title: 'Monthly' },
  { id: 'tu-q', value: 'Quarterly', title: 'Quarterly' },
  { id: 'tu-y', value: 'Yearly', title: 'Yearly' },
];
export const SWP_AMOUNT_PRESETS: StrategyAmountStep[] = [
  { value: '25000', label: '₹25K' },
  { value: '35000', label: '₹35K' },
  { value: '50000', label: '₹50K' },
  { value: '75000', label: '₹75K' },
  { value: '100000', label: '₹1L' },
];
export const TOPUP_AMOUNT_PRESETS: StrategyAmountStep[] = [
  { value: '10000', label: '₹10K' },
  { value: '25000', label: '₹25K' },
  { value: '50000', label: '₹50K' },
  { value: '100000', label: '₹1L' },
];
export const DEFAULT_SWP_INTERVALS: SwpInterval[] = [
  {
    id: 'swp-int-1',
    fromDate: '2025-01-01',
    toDate: '2026-12-31',
    amount: 35000,
    frequency: 'monthly',
    enableStepUp: false,
    stepUpType: 'percentage',
    stepUpValue: 5,
  },
  {
    id: 'swp-int-2',
    fromDate: '2027-01-01',
    toDate: '2033-12-31',
    amount: 45000,
    frequency: 'monthly',
    enableStepUp: true,
    stepUpType: 'percentage',
    stepUpValue: 8,
  },
];
export const DEFAULT_RECURRING_TOPUPS: RecurringTopUpSource[] = [
  {
    id: 'tu-src-1',
    name: 'Source 1 - Quarterly Bonus',
    amount: 50000,
    frequency: 'Quarterly',
    startDate: '2024-04-01',
    enabled: true,
  },
  {
    id: 'tu-src-2',
    name: 'Source 2 - Rental Income',
    amount: 25000,
    frequency: 'Monthly',
    startDate: '2024-02-01',
    enabled: true,
  },
  {
    id: 'tu-src-3',
    name: 'Source 3 - Annual Dividend',
    amount: 100000,
    frequency: 'Yearly',
    startDate: '2025-01-01',
    enabled: true,
  },
];
export const MAX_INITIAL_FUNDS = 4;
export const MAX_SIP_FUNDS = 6;
export const DEFAULT_SOURCE_FUNDS: SelectedFund[] = [
  { schemeCode: '119551', schemeName: 'HDFC Nifty 50 Index Fund', allocationPercent: 100, expectedCagr: 12.5, fundType: 'equity' },
];
export const DEFAULT_SIP_FUNDS: SelectedFund[] = [
  { schemeCode: '119551', schemeName: 'HDFC Nifty 50 Index Fund', allocationPercent: 40, expectedCagr: 12.5, fundType: 'equity' },
  { schemeCode: '120503', schemeName: 'Mirae Asset Large & Midcap Fund', allocationPercent: 30, expectedCagr: 14.0, fundType: 'equity' },
  { schemeCode: '125354', schemeName: 'Nippon India Small Cap Fund', allocationPercent: 30, expectedCagr: 16.0, fundType: 'equity' },
];
