import type { FinancialYear } from './types';
/** One new-regime slab: income up to `upTo` (exclusive of the previous slab) is taxed at `rate`%. */
export interface NewRegimeSlab {
  upTo: number;
  rate: number;
}
/**
 * New-regime (Section 115BAC) rules that change from one financial year to the next.
 * Add a row here for each new Budget instead of branching on the year in the calculators.
 */
export interface NewRegimeRules {
  slabs: NewRegimeSlab[];
  standardDeduction: number;
  /** Section 87A: full rebate when total income is at or below this limit... */
  rebateIncomeLimit: number;
  /** ...capped at this amount, with marginal relief just above the limit. */
  rebateMax: number;
  /**
   * From FY 2025-26 the rebate cannot be set off against tax on special-rate income
   * (equity STCG u/s 111A, LTCG u/s 112A); before that it applied to the whole tax.
   */
  rebateExcludesSpecialRateTax: boolean;
  /** Section 80CCD(2) employer NPS cap as a fraction of basic salary. */
  employerNpsCap: number;
}
/** Equity capital-gains rates (Sections 111A / 112A), shared by both regimes. */
export interface CapitalGainsRules {
  stcgRate: number;
  ltcgRate: number;
  ltcgExemption: number;
}
const BUDGET_2023_SLABS: NewRegimeSlab[] = [
  { upTo: 300000, rate: 0 },
  { upTo: 600000, rate: 5 },
  { upTo: 900000, rate: 10 },
  { upTo: 1200000, rate: 15 },
  { upTo: 1500000, rate: 20 },
  { upTo: Infinity, rate: 30 },
];
const BUDGET_2024_SLABS: NewRegimeSlab[] = [
  { upTo: 300000, rate: 0 },
  { upTo: 700000, rate: 5 },
  { upTo: 1000000, rate: 10 },
  { upTo: 1200000, rate: 15 },
  { upTo: 1500000, rate: 20 },
  { upTo: Infinity, rate: 30 },
];
const BUDGET_2025_SLABS: NewRegimeSlab[] = [
  { upTo: 400000, rate: 0 },
  { upTo: 800000, rate: 5 },
  { upTo: 1200000, rate: 10 },
  { upTo: 1600000, rate: 15 },
  { upTo: 2000000, rate: 20 },
  { upTo: 2400000, rate: 25 },
  { upTo: Infinity, rate: 30 },
];
const BUDGET_2025_RULES: NewRegimeRules = {
  slabs: BUDGET_2025_SLABS,
  standardDeduction: 75000,
  rebateIncomeLimit: 1200000,
  rebateMax: 60000,
  rebateExcludesSpecialRateTax: true,
  employerNpsCap: 0.14,
};
export const NEW_REGIME_RULES: Record<FinancialYear, NewRegimeRules> = {
  '2023-24': {
    slabs: BUDGET_2023_SLABS,
    standardDeduction: 50000,
    rebateIncomeLimit: 700000,
    rebateMax: 25000,
    rebateExcludesSpecialRateTax: false,
    employerNpsCap: 0.1,
  },
  '2024-25': {
    slabs: BUDGET_2024_SLABS,
    standardDeduction: 75000,
    rebateIncomeLimit: 700000,
    rebateMax: 25000,
    rebateExcludesSpecialRateTax: false,
    employerNpsCap: 0.14,
  },
  '2025-26': BUDGET_2025_RULES,
  '2026-27': BUDGET_2025_RULES,
};
// FY 2024-25 is treated entirely at the post-23-July-2024 rates (simplification).
const POST_JULY_2024_GAINS: CapitalGainsRules = { stcgRate: 0.2, ltcgRate: 0.125, ltcgExemption: 125000 };
export const CAPITAL_GAINS_RULES: Record<FinancialYear, CapitalGainsRules> = {
  '2023-24': { stcgRate: 0.15, ltcgRate: 0.1, ltcgExemption: 100000 },
  '2024-25': POST_JULY_2024_GAINS,
  '2025-26': POST_JULY_2024_GAINS,
  '2026-27': POST_JULY_2024_GAINS,
};
export function getNewRegimeRules(fy: FinancialYear): NewRegimeRules {
  return NEW_REGIME_RULES[fy] ?? NEW_REGIME_RULES['2026-27'];
}
export function getCapitalGainsRules(fy: FinancialYear): CapitalGainsRules {
  return CAPITAL_GAINS_RULES[fy] ?? CAPITAL_GAINS_RULES['2026-27'];
}
