import type { RegimeTaxResult, TaxIncomeInputs, TaxRegime } from './types';
import { calculateHousePropertyIncome, calculateHRAExemption } from './exemptions';
import { calculateNewRegimeSlabTax, calculateOldRegimeSlabTax, calculateSurcharge } from './taxSlabs';
import { calculateDeductions } from './deductions';
import { getCapitalGainsRules, getNewRegimeRules } from './rules';
export function computeTaxForRegime(inputs: TaxIncomeInputs, regime: TaxRegime): RegimeTaxResult {
  const {
    financialYear = '2026-27',
    isSalaried,
    grossSalary,
    basicSalary,
    hraReceived,
    rentPaid,
    cityCategory,
    professionalTax = 0,
    exemptAllowances = 0,
    customStandardDeduction,
    businessIncome,
    isSelfOccupied,
    rentalIncome,
    municipalTaxes,
    homeLoanInterestProperty,
    equityStcg,
    equityLtcg,
    otherCapitalGains,
    savingsInterest,
    fdInterest,
    otherIncome,
    ageCategory,
  } = inputs;
  const newRules = getNewRegimeRules(financialYear);
  const gainsRules = getCapitalGainsRules(financialYear);
  const hpResult = calculateHousePropertyIncome(isSelfOccupied, rentalIncome, municipalTaxes, homeLoanInterestProperty);
  let standardDeduction = 0;
  if (isSalaried && grossSalary > 0) {
    if (customStandardDeduction !== undefined && customStandardDeduction !== null) {
      standardDeduction = Math.min(grossSalary, Math.max(0, customStandardDeduction));
    } else if (regime === 'new') {
      standardDeduction = Math.min(grossSalary, newRules.standardDeduction);
    } else {
      standardDeduction = Math.min(grossSalary, 50000);
    }
  }
  const hraExemption = regime === 'old' && isSalaried ? calculateHRAExemption(hraReceived, rentPaid, basicSalary, cityCategory) : 0;
  const pTaxDeduction = regime === 'old' && isSalaried ? Math.max(0, professionalTax) : 0;
  const allowancesDeduction = regime === 'old' && isSalaried ? Math.max(0, exemptAllowances) : 0;
  const netSalary = Math.max(0, grossSalary - standardDeduction - hraExemption - pTaxDeduction - allowancesDeduction);
  const housePropertyNet = hpResult.incomeOrLoss;
  const housePropertyLossDeduction = hpResult.lossForSetOff;
  const normalIncomeSources =
    netSalary +
    Math.max(0, businessIncome) +
    (housePropertyNet >= 0 ? housePropertyNet : -housePropertyLossDeduction) +
    Math.max(0, otherCapitalGains) +
    Math.max(0, savingsInterest) +
    Math.max(0, fdInterest) +
    Math.max(0, otherIncome);
  const totalSpecialGains = Math.max(0, equityStcg) + Math.max(0, equityLtcg);
  const grossTotalIncome = normalIncomeSources + totalSpecialGains;
  const totalDeductions = calculateDeductions(inputs, regime);
  const normalTaxableIncome = Math.max(0, normalIncomeSources - totalDeductions);
  const totalTaxableIncome = normalTaxableIncome + totalSpecialGains;
  const slabCalc =
    regime === 'new'
      ? calculateNewRegimeSlabTax(normalTaxableIncome, financialYear)
      : calculateOldRegimeSlabTax(normalTaxableIncome, ageCategory);
  const { stcgRate, ltcgRate, ltcgExemption } = gainsRules;
  const stcgTax = Math.max(0, equityStcg) * stcgRate;
  const taxableLtcg = Math.max(0, equityLtcg - ltcgExemption);
  const ltcgTax = taxableLtcg * ltcgRate;
  const totalTaxBeforeRebate = slabCalc.slabTax + stcgTax + ltcgTax;
  let rebate87A = 0;
  if (regime === 'new') {
    const { rebateIncomeLimit, rebateMax, rebateExcludesSpecialRateTax } = newRules;
    const rebatableTax = rebateExcludesSpecialRateTax ? slabCalc.slabTax : totalTaxBeforeRebate;
    if (totalTaxableIncome <= rebateIncomeLimit) {
      rebate87A = Math.min(rebatableTax, rebateMax);
    } else {
      // Marginal relief: tax may not exceed the income earned above the rebate limit.
      const excessIncome = totalTaxableIncome - rebateIncomeLimit;
      rebate87A = Math.max(0, rebatableTax - excessIncome);
    }
  } else if (totalTaxableIncome <= 500000) {
    rebate87A = Math.min(totalTaxBeforeRebate, 12500);
  }
  const taxAfterRebate = Math.max(0, totalTaxBeforeRebate - rebate87A);
  const surcharge = calculateSurcharge(taxAfterRebate, grossTotalIncome, regime);
  const cess = Math.round((taxAfterRebate + surcharge) * 0.04);
  const totalTaxPayable = Math.round(taxAfterRebate + surcharge + cess);
  const effectiveTaxRate = grossTotalIncome > 0 ? (totalTaxPayable / grossTotalIncome) * 100 : 0;
  return {
    regime,
    grossTotalIncome: Math.round(grossTotalIncome),
    totalDeductions: Math.round(totalDeductions),
    taxableIncome: Math.round(totalTaxableIncome),
    normalTaxableIncome: Math.round(normalTaxableIncome),
    slabTax: Math.round(slabCalc.slabTax),
    slabs: slabCalc.slabs,
    stcgTax: Math.round(stcgTax),
    ltcgTax: Math.round(ltcgTax),
    rebate87A: Math.round(rebate87A),
    taxAfterRebate: Math.round(taxAfterRebate),
    surcharge: Math.round(surcharge),
    cess,
    totalTaxPayable,
    effectiveTaxRate: Number(effectiveTaxRate.toFixed(2)),
    standardDeduction: Math.round(standardDeduction),
    hraExemption: Math.round(hraExemption),
    housePropertyLossDeduction: Math.round(housePropertyLossDeduction),
  };
}
