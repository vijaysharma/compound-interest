import type { NavType } from '../../types/types';
export interface StoredPinnedFund {
  schemeCode: string;
  schemeName: string;
}
export interface SipSavedState {
  searchKey: string;
  selectedType: string;
  selectedGrowth: string;
  selectedCode: string;
  duration: string;
  monthlyAmount: string;
  showDate: boolean;
  viewChart: boolean;
  pinnedFunds: StoredPinnedFund[];
  startDate: string | null;
  endDate: string | null;
  dayOfMonth: string;
  investmentStepUp: string;
}
export interface SipFundAnalysis {
  schemeCode: string;
  schemeName: string;
  color: string;
  startNav: NavType | undefined;
  endNav: NavType | undefined;
  profit: number;
  absProfit: number;
  matureAmt: number;
  latestValue?: number;
  latestNavDate?: string;
  latestXirr?: number;
  profitAmt: number;
  invested: number;
  units: number;
  averageNav: number;
  installments: number;
  xirr: number | undefined;
}
