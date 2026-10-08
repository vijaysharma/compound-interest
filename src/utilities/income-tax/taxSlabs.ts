import type { AgeCategory, FinancialYear, TaxRegime, TaxSlabBreakdown } from './types';
import { getNewRegimeRules } from './rules';
export function calculateNewRegimeSlabTax(
  taxableIncome: number,
  financialYear: FinancialYear = '2026-27'
): { slabTax: number; slabs: TaxSlabBreakdown[] } {
  const slabs: TaxSlabBreakdown[] = [];
  let tax = 0;
  const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  const ruleSlabs = getNewRegimeRules(financialYear).slabs;
  const thresholds = ruleSlabs.map((slab, i) => {
    const from = i === 0 ? 0 : ruleSlabs[i - 1].upTo;
    const label =
      i === 0
        ? `Up to ${inr(slab.upTo)}`
        : slab.upTo === Infinity
          ? `Above ${inr(from)}`
          : `${inr(from + 1)} to ${inr(slab.upTo)}`;
    return { limit: slab.upTo, rate: slab.rate, label };
  });
  let prevLimit = 0;
  for (const item of thresholds) {
    if (taxableIncome > prevLimit) {
      const taxableInThisSlab = Math.min(taxableIncome, item.limit) - prevLimit;
      const amount = (taxableInThisSlab * item.rate) / 100;
      tax += amount;
      slabs.push({
        slab: item.label,
        rate: item.rate,
        taxableInSlab: taxableInThisSlab,
        taxAmount: amount,
      });
      prevLimit = item.limit;
    } else {
      break;
    }
  }
  return { slabTax: tax, slabs };
}
export function calculateOldRegimeSlabTax(
  taxableIncome: number,
  ageCategory: AgeCategory
): { slabTax: number; slabs: TaxSlabBreakdown[] } {
  const slabs: TaxSlabBreakdown[] = [];
  let tax = 0;
  let nilLimit = 250000;
  if (ageCategory === 'senior') nilLimit = 300000;
  if (ageCategory === 'super_senior') nilLimit = 500000;
  const thresholds = [
    { limit: nilLimit, rate: 0, label: `Up to ₹${(nilLimit / 100000).toFixed(1)} Lakh` },
    { limit: 500000, rate: 5, label: `₹${(nilLimit / 100000).toFixed(1)}L to ₹5,00,000` },
    { limit: 1000000, rate: 20, label: '₹5,00,001 to ₹10,00,000' },
    { limit: Infinity, rate: 30, label: 'Above ₹10,00,000' },
  ];
  let prevLimit = 0;
  for (const item of thresholds) {
    if (taxableIncome > prevLimit) {
      const taxableInThisSlab = Math.min(taxableIncome, item.limit) - prevLimit;
      const amount = (taxableInThisSlab * item.rate) / 100;
      tax += amount;
      slabs.push({
        slab: item.label,
        rate: item.rate,
        taxableInSlab: taxableInThisSlab,
        taxAmount: amount,
      });
      prevLimit = item.limit;
    } else {
      break;
    }
  }
  return { slabTax: tax, slabs };
}
export function calculateSurcharge(
  taxAmount: number,
  totalIncome: number,
  regime: TaxRegime
): number {
  if (totalIncome <= 5000000) return 0;
  let rate = 0;
  if (totalIncome <= 10000000) {
    rate = 0.10;
  } else if (totalIncome <= 20000000) {
    rate = 0.15;
  } else if (totalIncome <= 50000000) {
    rate = 0.25;
  } else {
    rate = regime === 'new' ? 0.25 : 0.37;
  }
  return taxAmount * rate;
}
