import type { ButtonDataType } from '../../types/types';
import { SelectedFund, Streamline } from './types';
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
export const MAX_INITIAL_FUNDS = 4;
export const MAX_SIP_FUNDS = 6;
export const DEFAULT_SOURCE_FUNDS: SelectedFund[] = [
  { schemeCode: '119551', schemeName: 'HDFC Nifty 50 Index Fund', allocationPercent: 50, expectedCagr: 12.5, fundType: 'equity' },
  { schemeCode: '120503', schemeName: 'Mirae Asset Large & Midcap Fund', allocationPercent: 30, expectedCagr: 14.0, fundType: 'equity' },
  { schemeCode: '120828', schemeName: 'ICICI Prudential Corporate Bond Fund', allocationPercent: 20, expectedCagr: 7.5, fundType: 'debt' },
];
export const DEFAULT_SIP_FUNDS: SelectedFund[] = [
  { schemeCode: '119551', schemeName: 'HDFC Nifty 50 Index Fund', allocationPercent: 40, expectedCagr: 12.5, fundType: 'equity' },
  { schemeCode: '120503', schemeName: 'Mirae Asset Large & Midcap Fund', allocationPercent: 30, expectedCagr: 14.0, fundType: 'equity' },
  { schemeCode: '125354', schemeName: 'Nippon India Small Cap Fund', allocationPercent: 30, expectedCagr: 16.0, fundType: 'equity' },
];
export const DEFAULT_STREAMLINES: Streamline[] = [
  {
    id: 'streamline-1',
    name: 'Balanced Hybrid (Primary)',
    color: '#7b1fa2',
    investmentDate: '2024-01-01',
    investmentAmount: '5000000',
    sourceFunds: DEFAULT_SOURCE_FUNDS,
    swpConfig: {
      startDate: '2025-01-01',
      baseAmount: 35000,
      hasChange: true,
      changeDate: '2027-01-01',
      changeType: 'percentage',
      changeValue: 10,
    },
    sipConfig: {
      enabled: true,
      linkToSwp: true,
      startDate: '2025-01-01',
      amount: 35000,
      stepUpFrequency: 'Yearly',
      stepUpPercent: 10,
    },
    sipFunds: DEFAULT_SIP_FUNDS,
    topUps: [{ id: 'tu-1', date: '2026-06-01', amount: 500000, note: 'Bonus allocation' }],
    durationYears: 10,
  },
  {
    id: 'streamline-2',
    name: 'Aggressive Equity Growth',
    color: '#0284c7',
    investmentDate: '2024-01-01',
    investmentAmount: '5000000',
    sourceFunds: [
      { schemeCode: '119551', schemeName: 'HDFC Nifty 50 Index Fund', allocationPercent: 40, expectedCagr: 13.0, fundType: 'equity' },
      { schemeCode: '125354', schemeName: 'Nippon India Small Cap Fund', allocationPercent: 40, expectedCagr: 16.5, fundType: 'equity' },
      { schemeCode: '120503', schemeName: 'Mirae Asset Large & Midcap Fund', allocationPercent: 20, expectedCagr: 14.5, fundType: 'equity' },
    ],
    swpConfig: {
      startDate: '2025-06-01',
      baseAmount: 25000,
      hasChange: false,
      changeDate: '2027-01-01',
      changeType: 'percentage',
      changeValue: 10,
    },
    sipConfig: {
      enabled: true,
      linkToSwp: true,
      startDate: '2025-06-01',
      amount: 25000,
      stepUpFrequency: 'Yearly',
      stepUpPercent: 12,
    },
    sipFunds: DEFAULT_SIP_FUNDS,
    topUps: [{ id: 'tu-2', date: '2026-01-01', amount: 1000000, note: 'Capital top-up' }],
    durationYears: 10,
  },
];
