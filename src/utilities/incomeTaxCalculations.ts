import type {
  TaxRegime,
  TaxIncomeInputs,
  TaxComparisonResult,
} from './income-tax/types';
import { computeTaxForRegime } from './income-tax/computeRegimeTax';
import { generateTaxOptimizationTips } from './income-tax/optimizationTips';
export type {
  TaxRegime,
  AgeCategory,
  CityCategory,
  FinancialYear,
  TaxIncomeInputs,
  TaxSlabBreakdown,
  RegimeTaxResult,
  TaxOptimizationTip,
  TaxComparisonResult,
} from './income-tax/types';
export {
  getAssessmentYear,
  getLatestRunningFinancialYear,
} from './income-tax/types';
export {
  calculateHRAExemption,
  calculateHousePropertyIncome,
} from './income-tax/exemptions';
export {
  calculateNewRegimeSlabTax,
  calculateOldRegimeSlabTax,
  calculateSurcharge,
} from './income-tax/taxSlabs';
export { computeTaxForRegime } from './income-tax/computeRegimeTax';
export { generateTaxOptimizationTips } from './income-tax/optimizationTips';
export function calculateBreakevenDeduction(inputs: TaxIncomeInputs): number {
  const newResult = computeTaxForRegime(inputs, 'new');
  const targetTax = newResult.totalTaxPayable;
  let low = 0;
  let high = Math.max(2000000, inputs.grossSalary + inputs.businessIncome);
  let bestDeduction = 0;
  for (let i = 0; i < 30; i++) {
    const mid = (low + high) / 2;
    const testInputs: TaxIncomeInputs = {
      ...inputs,
      section80C: Math.min(150000, mid),
      section80Ccd1b: Math.max(0, Math.min(50000, mid - 150000)),
      otherDeductions: Math.max(0, mid - 200000),
    };
    const oldRes = computeTaxForRegime(testInputs, 'old');
    if (oldRes.totalTaxPayable <= targetTax) {
      bestDeduction = mid;
      high = mid;
    } else {
      low = mid;
    }
  }
  return Math.round(bestDeduction);
}
function oldResultDeductionTotal(inputs: TaxIncomeInputs): number {
  const capped80C = Math.min(150000, Math.max(0, inputs.section80C));
  const capped80CCD1B = Math.min(50000, Math.max(0, inputs.section80Ccd1b));
  const capped80CCD2 = Math.min(inputs.section80Ccd2, inputs.basicSalary * 0.14);
  const capped80D = Math.min(100000, inputs.section80D_self + inputs.section80D_parents);
  const capped80TTA = Math.min(50000, inputs.section80Tta);
  return (
    capped80C +
    capped80CCD1B +
    capped80CCD2 +
    capped80D +
    inputs.section80E +
    inputs.section80G +
    capped80TTA +
    inputs.otherDeductions
  );
}
export function compareTaxRegimes(inputs: TaxIncomeInputs): TaxComparisonResult {
  const newRegime = computeTaxForRegime(inputs, 'new');
  const oldRegime = computeTaxForRegime(inputs, 'old');
  const isNewBetter = newRegime.totalTaxPayable <= oldRegime.totalTaxPayable;
  const recommendedRegime: TaxRegime = isNewBetter ? 'new' : 'old';
  const taxSavings = Math.abs(oldRegime.totalTaxPayable - newRegime.totalTaxPayable);
  const breakevenDeductions = calculateBreakevenDeduction(inputs);
  const currentDeductionsClaimed = oldResultDeductionTotal(inputs);
  const additionalDeductionsNeeded = Math.max(0, breakevenDeductions - currentDeductionsClaimed);
  const optimizationTips = generateTaxOptimizationTips(inputs, oldRegime, newRegime);
  return {
    newRegime,
    oldRegime,
    recommendedRegime,
    taxSavings,
    breakevenDeductions,
    currentDeductionsClaimed,
    additionalDeductionsNeeded,
    optimizationTips,
  };
}
