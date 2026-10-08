import { test } from 'node:test';
import assert from 'node:assert/strict';
const { computeTaxForRegime, calculateNewRegimeSlabTax } = await import('../incomeTaxCalculations');
const { calculateDeductions } = await import('../income-tax/deductions');
import type { FinancialYear, TaxIncomeInputs } from '../income-tax/types';
function salaried(grossSalary: number, financialYear: FinancialYear, extra: Partial<TaxIncomeInputs> = {}): TaxIncomeInputs {
  return {
    financialYear,
    ageCategory: 'general',
    isSalaried: true,
    grossSalary,
    basicSalary: grossSalary / 2,
    hraReceived: 0,
    rentPaid: 0,
    cityCategory: 'metro',
    businessIncome: 0,
    isSelfOccupied: false,
    rentalIncome: 0,
    municipalTaxes: 0,
    homeLoanInterestProperty: 0,
    equityStcg: 0,
    equityLtcg: 0,
    otherCapitalGains: 0,
    savingsInterest: 0,
    fdInterest: 0,
    ppfInterest: 0,
    otherIncome: 0,
    section80C: 0,
    section80Ccd1b: 0,
    section80Ccd2: 0,
    section80D_self: 0,
    section80D_parents: 0,
    section80E: 0,
    section80G: 0,
    section80Tta: 0,
    otherDeductions: 0,
    ...extra,
  };
}
test('FY 2025-26: salaried income up to ₹12.75L pays no tax under the new regime', () => {
  const r = computeTaxForRegime(salaried(1275000, '2025-26'), 'new');
  assert.equal(r.taxableIncome, 1200000);
  assert.equal(r.slabTax, 60000, '5% of 4-8L + 10% of 8-12L');
  assert.equal(r.rebate87A, 60000);
  assert.equal(r.totalTaxPayable, 0);
});
test('FY 2025-26: marginal relief limits tax to the income above ₹12L', () => {
  const r = computeTaxForRegime(salaried(1345000, '2025-26'), 'new');
  assert.equal(r.taxableIncome, 1270000);
  assert.equal(r.slabTax, 70500);
  assert.equal(r.rebate87A, 500);
  assert.equal(r.taxAfterRebate, 70000, 'equal to the ₹70,000 earned above the limit');
  assert.equal(r.totalTaxPayable, 72800);
});
test('FY 2025-26: marginal relief ends once slab tax is below the excess income', () => {
  const r = computeTaxForRegime(salaried(1375000, '2025-26'), 'new');
  assert.equal(r.rebate87A, 0);
  assert.equal(r.totalTaxPayable, 78000);
});
test('FY 2025-26 and 2026-27 use the Budget 2025 slabs, including the 25% band', () => {
  for (const fy of ['2025-26', '2026-27'] as const) {
    const r = computeTaxForRegime(salaried(2575000, fy), 'new');
    assert.equal(r.slabTax, 330000, fy);
    assert.equal(r.totalTaxPayable, 343200, fy);
  }
  const { slabs } = calculateNewRegimeSlabTax(2500000, '2025-26');
  assert.deepEqual(
    slabs.map((s) => [s.slab, s.rate]),
    [
      ['Up to ₹4,00,000', 0],
      ['₹4,00,001 to ₹8,00,000', 5],
      ['₹8,00,001 to ₹12,00,000', 10],
      ['₹12,00,001 to ₹16,00,000', 15],
      ['₹16,00,001 to ₹20,00,000', 20],
      ['₹20,00,001 to ₹24,00,000', 25],
      ['Above ₹24,00,000', 30],
    ]
  );
});
test('FY 2025-26: the 87A rebate does not offset tax on equity STCG', () => {
  const r = computeTaxForRegime(salaried(1075000, '2025-26', { equityStcg: 100000 }), 'new');
  assert.equal(r.taxableIncome, 1100000);
  assert.equal(r.slabTax, 40000);
  assert.equal(r.stcgTax, 20000);
  assert.equal(r.rebate87A, 40000, 'only the slab tax is rebated');
  assert.equal(r.totalTaxPayable, 20800);
});
test('FY 2024-25 keeps the ₹7L rebate and its marginal relief', () => {
  assert.equal(computeTaxForRegime(salaried(775000, '2024-25'), 'new').totalTaxPayable, 0);
  const marginal = computeTaxForRegime(salaried(795000, '2024-25'), 'new');
  assert.equal(marginal.slabTax, 22000);
  assert.equal(marginal.rebate87A, 2000);
  assert.equal(marginal.totalTaxPayable, 20800);
  assert.equal(computeTaxForRegime(salaried(1075000, '2024-25'), 'new').totalTaxPayable, 52000);
  const { slabs } = calculateNewRegimeSlabTax(800000, '2024-25');
  assert.equal(slabs[1].slab, '₹3,00,001 to ₹7,00,000');
});
test('80TTA is limited to the savings interest actually reported', () => {
  const old = (extra: Partial<TaxIncomeInputs>) => calculateDeductions(salaried(1000000, '2025-26', extra), 'old');
  assert.equal(old({ section80Tta: 10000, savingsInterest: 0 }), 0, 'no interest, no deduction');
  assert.equal(old({ section80Tta: 10000, savingsInterest: 6000 }), 6000);
  assert.equal(old({ section80Tta: 10000, savingsInterest: 25000 }), 10000, '₹10k cap');
});
test('80TTB lets seniors deduct savings plus deposit interest up to ₹50k', () => {
  const inputs = salaried(1000000, '2025-26', {
    ageCategory: 'senior',
    section80Tta: 50000,
    savingsInterest: 20000,
    fdInterest: 40000,
  });
  assert.equal(calculateDeductions(inputs, 'old'), 50000);
});
test('new-regime employer NPS (80CCD(2)) cap is 10% of basic in FY 2023-24 and 14% after', () => {
  const extra = { section80Ccd2: 200000 };
  assert.equal(calculateDeductions(salaried(1000000, '2023-24', extra), 'new'), 50000);
  assert.equal(calculateDeductions(salaried(1000000, '2025-26', extra), 'new'), 70000);
});
