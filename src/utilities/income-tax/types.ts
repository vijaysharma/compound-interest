export type TaxRegime = 'new' | 'old';
export type AgeCategory = 'general' | 'senior' | 'super_senior'; // <60, 60-79, 80+
export type CityCategory = 'metro' | 'non_metro';
export type FinancialYear = '2026-27' | '2025-26' | '2024-25' | '2023-24';
export function getAssessmentYear(fy: FinancialYear): string {
  switch (fy) {
    case '2026-27':
      return 'AY 2027-28';
    case '2025-26':
      return 'AY 2026-27';
    case '2024-25':
      return 'AY 2025-26';
    case '2023-24':
      return 'AY 2024-25';
    default:
      return 'AY 2027-28';
  }
}
export function getLatestRunningFinancialYear(): FinancialYear {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startYear = month >= 3 ? year : year - 1;
  const endYearShort = (startYear + 1).toString().slice(2);
  const fy = `${startYear}-${endYearShort}` as FinancialYear;
  if (['2026-27', '2025-26', '2024-25', '2023-24'].includes(fy)) {
    return fy;
  }
  return '2026-27';
}
export interface TaxIncomeInputs {
  financialYear: FinancialYear;
  ageCategory: AgeCategory;
  isSalaried: boolean;
  grossSalary: number;
  basicSalary: number;
  hraReceived: number;
  rentPaid: number;
  cityCategory: CityCategory;
  professionalTax?: number;
  exemptAllowances?: number;
  customStandardDeduction?: number | null;
  businessIncome: number;
  isSelfOccupied: boolean;
  rentalIncome: number;
  municipalTaxes: number;
  homeLoanInterestProperty: number;
  equityStcg: number;
  equityLtcg: number;
  otherCapitalGains: number;
  savingsInterest: number;
  fdInterest: number;
  ppfInterest: number;
  otherIncome: number;
  section80C: number;
  section80Ccd1b: number;
  section80Ccd2: number;
  section80D_self: number;
  selfSeniorCitizen?: boolean;
  section80D_parents: number;
  parentsSeniorCitizen?: boolean;
  section80E: number;
  section80G: number;
  section80Tta: number;
  section80Gg?: number;
  section80Ddb?: number;
  section80U?: number;
  section80Eea?: number;
  section80Eeb?: number;
  section80Dd?: number;
  section80Ggc?: number;
  customDeductions?: Array<{ id: string; name: string; amount: number }>;
  otherDeductions: number;
}
export interface TaxSlabBreakdown {
  slab: string;
  rate: number;
  taxableInSlab: number;
  taxAmount: number;
}
export interface RegimeTaxResult {
  regime: TaxRegime;
  grossTotalIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  normalTaxableIncome: number;
  slabTax: number;
  slabs: TaxSlabBreakdown[];
  stcgTax: number;
  ltcgTax: number;
  rebate87A: number;
  taxAfterRebate: number;
  surcharge: number;
  cess: number;
  totalTaxPayable: number;
  effectiveTaxRate: number;
  standardDeduction: number;
  hraExemption: number;
  housePropertyLossDeduction: number;
}
export interface TaxOptimizationTip {
  category: string;
  title: string;
  description: string;
  potentialTaxSavings: number;
  actionable: boolean;
  codeSection?: string;
}
export interface TaxComparisonResult {
  newRegime: RegimeTaxResult;
  oldRegime: RegimeTaxResult;
  recommendedRegime: TaxRegime;
  taxSavings: number;
  breakevenDeductions: number;
  currentDeductionsClaimed: number;
  additionalDeductionsNeeded: number;
  optimizationTips: TaxOptimizationTip[];
}
