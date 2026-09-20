import { NavType } from '../../types/types';
import { MFMetaType } from '../../data/api_data';
export interface DetailedFundItem {
  schemeCode: string;
  schemeName: string;
  color: string;
  startNav?: NavType | number;
  endNav?: NavType | number;
  startDate?: string | null;
  endDate?: string | null;
  matureAmt: number;
  profitAmt: number;
  profit: number; // CAGR %
  absProfit: number; // Absolute %
  invAmt: number;
  navData?: NavType[];
}
export interface MutualFundDetailModalProps {
  fund: DetailedFundItem | null;
  onClose: () => void;
}
export type InvestmentType = 'lumpsum' | 'sip';
export type TaxMode = 'auto' | 'ltcg' | 'stcg' | 'slab30' | 'slab20' | 'none';
export interface PerformanceMetrics {
  invested: number;
  maturity: number;
  gain: number;
  absReturn: number;
  cagr: number;
  startNavVal: number;
  endNavVal: number;
  datasets: Array<{
    label: string;
    color: string;
    data: Array<{ date: string; nav: number }>;
  }>;
}
export interface TaxCalculations {
  taxAmount: number;
  postTaxMaturity: number;
  postTaxProfit: number;
  postTaxCagr: number;
  rateLabel: string;
  categoryBadge: string;
}
export interface ConstituentProfile {
  categoryType: string;
  benchmark: string;
  topHoldings: string;
  sectors: string;
}
export interface FundModalState {
  meta: MFMetaType | null;
  investmentType: InvestmentType;
  setInvestmentType: (type: InvestmentType) => void;
  taxMode: TaxMode;
  setTaxMode: (mode: TaxMode) => void;
  startDateISO: string;
  endDateISO: string;
  setStartDateISO: (val: string) => void;
  setEndDateISO: (val: string) => void;
  minNavDateISO: string;
  maxNavDateISO: string;
  investmentValue: string;
  setInvestmentValue: (val: string) => void;
  currentNavStartDate: string;
  currentNavEndDate: string;
  handleSelectPreset: (preset: string) => void;
  holdingDays: number;
  holdingYears: number;
  isLongTerm: boolean;
  fundCategory: string;
}
