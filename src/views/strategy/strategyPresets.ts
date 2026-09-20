import { SelectedFund } from './types';
export const STRATEGY_AMOUNT_PRESETS = [
  { id: 'p-50l', value: '5000000', title: '50L' },
  { id: 'p-1cr', value: '10000000', title: '1Cr' },
  { id: 'p-5l', value: '500000', title: '5L' },
  { id: 'p-2l', value: '200000', title: '2L' },
];
export const FREQUENCY_BUTTON_DATA: Array<{ id: string; title: string; value: 'Monthly' | 'Quarterly' | 'Yearly' }> = [
  { id: 'freq-monthly', title: 'Monthly', value: 'Monthly' },
  { id: 'freq-quarterly', title: 'Quarterly', value: 'Quarterly' },
  { id: 'freq-yearly', title: 'Yearly', value: 'Yearly' },
];
export const CHANGE_TYPE_BUTTONS: Array<{ id: string; title: string; value: 'percentage' | 'fixed' }> = [
  { id: 'type-pct', title: '+ % Step Up', value: 'percentage' },
  { id: 'type-fix', title: '+ Fixed ₹', value: 'fixed' },
];
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
export const MAX_INITIAL_FUNDS = 4;
export const MAX_SIP_FUNDS = 6;
