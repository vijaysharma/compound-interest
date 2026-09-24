import type { NavType } from '../../types/types';
import { getTodayISO } from '../../utilities/dateGuards';
import { isNavHistoryFresh, navFreshnessCeiling } from '../../utilities/navCalendar';
export interface MFMetaType {
  fund_house?: string;
  scheme_type?: string;
  scheme_category?: string;
  scheme_code?: number | string;
  scheme_name?: string;
  isin_growth?: string;
  isin_div_reinvestment?: string | null;
}
export interface MFDetailsResult {
  data: NavType[];
  meta?: MFMetaType;
}
let marketAsOf: string | null = null;
export const rememberMarketAsOf = (payload: { marketAsOf?: unknown }): void => {
  if (typeof payload?.marketAsOf === 'string' && payload.marketAsOf) {
    marketAsOf = payload.marketAsOf;
  }
};
export const historySatisfies = (
  data: NavType[] | undefined,
  endDate?: string | null
): boolean => {
  if (!data || data.length === 0) return false;
  const requested = endDate || getTodayISO();
  const ceiling = marketAsOf
    ? requested < marketAsOf
      ? requested
      : marketAsOf
    : navFreshnessCeiling(requested);
  return isNavHistoryFresh(data, ceiling);
};
