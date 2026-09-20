import { isoDateToNavDate } from '../../../utilities/dateUtils';
import type { NavType } from '../../../types/types';
import type { Column2FundConfig, FundRef, NavBook, StrategyConfig } from '../types';
/**
 * NAV fixtures are hand-written so each expected figure can be checked by
 * hand. They stand in for the AMFI feed; the engine never generates NAVs.
 */
export const navRows = (rows: [iso: string, nav: number][]): NavType[] =>
  rows.map(([iso, nav]) => ({ date: isoDateToNavDate(iso), nav: String(nav) }));
export const fundRef = (schemeCode: string, schemeName = `Fund ${schemeCode}`): FundRef => ({
  schemeCode,
  schemeName,
  color: '#6d0b74',
});
export const C1 = fundRef('100', 'Column One Fund');
/** Column 1 fund: ₹100 at inception, then a handful of published days. */
export const C1_NAV = navRows([
  ['2018-01-01', 100],
  ['2019-01-01', 110],
  ['2019-06-03', 115],
  ['2020-01-01', 120],
  ['2020-07-01', 125],
  ['2021-01-01', 150],
]);
export const column2Entry = (
  id: string,
  schemeCode: string,
  allocationPct: number,
  sipStartDate: string,
  overrides: Partial<Column2FundConfig> = {}
): Column2FundConfig => ({
  id,
  fund: fundRef(schemeCode),
  allocationPct,
  sipStartDate,
  swp: {
    enabled: false,
    startDate: sipStartDate,
    endDate: '2021-01-01',
    amount: 0,
    frequency: 'monthly',
    toColumn3: 0,
  },
  ...overrides,
});
export const baseConfig = (overrides: Partial<StrategyConfig> = {}): StrategyConfig => ({
  column1: {
    fund: C1,
    amount: 7000000,
    investmentDate: '2018-01-01',
    withdrawals: [],
  },
  column2: [],
  column3: { frequency: 'monthly', startDate: '2021-01-01', mode: 'sweep', amount: 0 },
  asOfDate: '2021-01-01',
  ...overrides,
});
export const navBook = (extra: NavBook = {}): NavBook => ({ [C1.schemeCode]: C1_NAV, ...extra });
/** Four Column 2 funds priced at a flat ₹10 so unit maths stays checkable. */
export const FLAT_TEN = navRows([
  ['2019-01-01', 10],
  ['2020-01-01', 10],
  ['2021-01-01', 10],
]);
