import type { NavType } from '../../types/types';
export interface PinnedFund {
  schemeCode: string;
  schemeName: string;
  color: string;
}
export interface MutualFundSelection {
  funds: PinnedFund[];
  navData: Record<string, NavType[]>;
  startDate: string | null;
  endDate: string | null;
}
export interface FundAnalysis {
  schemeCode: string;
  schemeName: string;
  color: string;
  startNav: NavType | undefined;
  endNav: NavType | undefined;
  profit: number;
  absProfit: number;
  matureAmt: number;
  profitAmt: number;
}
export interface LumpsumSavedState {
  searchKey: string;
  selectedType: string;
  selectedGrowth: string;
  selectedCode: string;
  duration: string;
  invAmt: string;
  showDate: boolean;
  viewChart: boolean;
  pinnedFunds: PinnedFund[];
  startDate: string | null;
  endDate: string | null;
}
