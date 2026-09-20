import type { NavType } from '../../types/types';
import type { StoredPinnedFund } from '../sip/types';
export interface SwpSavedState {
  searchKey: string;
  selectedType: string;
  selectedGrowth: string;
  selectedCode: string;
  monthlyWithdrawalAmount: string;
  lumpSumInvestmentAmount: string;
  viewChart: boolean;
  pinnedFunds: StoredPinnedFund[];
  startSwpDate: string | null;
  endSwpDate: string | null;
  lumpsumStartDate: string | null;
  dayOfMonth: string;
  investmentStepUp: string;
}
export interface SwpFundAnalysis {
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
  totalWithdrawn?: number;
  lastWithdrawalAmount?: number;
  lastWithdrawalDate?: string;
  profitAmt: number;
  invested: number;
  units: number;
  averageNav: number;
  installments: number;
  xirr: number | undefined;
}
export interface SwpSelection {
  funds: import('../../components/mutual-fund/types').PinnedFund[];
  navData: Record<string, NavType[]>;
  startSwpDate: string | null;
  endSwpDate: string | null;
}
export interface SwpProps {
  onSelectionChange?: (selection: SwpSelection) => void;
}
