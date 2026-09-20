import type { PropertyTaxInputs, PropertyTaxComparison } from './propertyTaxTypes';
import { COST_INFLATION_INDEX, getFinancialYear } from './propertyTaxCii';
export type { PropertyTaxInputs, PropertyTaxComparison } from './propertyTaxTypes';
export { COST_INFLATION_INDEX, CII_YEARS, getFinancialYear } from './propertyTaxCii';
export function calculatePropertyCapitalGains(
  inputs: PropertyTaxInputs
): PropertyTaxComparison {
  const pDate = new Date(inputs.purchaseDate || '2018-05-15');
  const sDate = new Date(inputs.saleDate || '2024-09-10');
  const diffTime = Math.max(0, sDate.getTime() - pDate.getTime());
  const holdingDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const holdingMonths = Number((holdingDays / 30.4375).toFixed(1));
  const isLongTerm = holdingMonths > 24;
  const cutOffDate = new Date('2024-07-23').getTime();
  const isGrandfathered = pDate.getTime() < cutOffDate;
  const purchaseFY = getFinancialYear(inputs.purchaseDate);
  const saleFY = getFinancialYear(inputs.saleDate);
  const improvementFY = inputs.improvementYear || purchaseFY;
  const purchaseCII = COST_INFLATION_INDEX[purchaseFY] || 100;
  const saleCII = COST_INFLATION_INDEX[saleFY] || 363;
  const improvementCII = COST_INFLATION_INDEX[improvementFY] || purchaseCII;
  const netSaleConsideration = Math.max(0, inputs.salePrice - (inputs.transferExpenses || 0));
  const indexedAcquisitionCost = Math.round(inputs.purchasePrice * (saleCII / purchaseCII));
  const indexedImprovementCost = Math.round((inputs.improvementCost || 0) * (saleCII / improvementCII));
  const totalIndexedCost = indexedAcquisitionCost + indexedImprovementCost;
  const oldGrossGain = Math.max(0, netSaleConsideration - totalIndexedCost);
  const totalExemptions =
    Math.min(100000000, inputs.sec54Exemption || 0) +
    Math.min(5000000, inputs.sec54ecExemption || 0);
  const oldTaxableGain = Math.max(0, oldGrossGain - totalExemptions);
  const oldBaseTax = oldTaxableGain * 0.20;
  const oldCess = oldBaseTax * 0.04;
  const oldTotalTax = Math.round(oldBaseTax + oldCess);
  const oldNetInHand = Math.round(netSaleConsideration - oldTotalTax);
  const actualCost = inputs.purchasePrice + (inputs.improvementCost || 0);
  const newGrossGain = Math.max(0, netSaleConsideration - actualCost);
  const newTaxableGain = Math.max(0, newGrossGain - totalExemptions);
  const newBaseTax = newTaxableGain * 0.125;
  const newCess = newBaseTax * 0.04;
  const newTotalTax = Math.round(newBaseTax + newCess);
  const newNetInHand = Math.round(netSaleConsideration - newTotalTax);
  const stcgTaxable = Math.max(0, netSaleConsideration - actualCost - totalExemptions);
  const stcgRate = (inputs.stcgSlabRate || 30) / 100;
  const stcgTax = Math.round(stcgTaxable * stcgRate * 1.04);
  const stcgNetInHand = Math.round(netSaleConsideration - stcgTax);
  let recommendedOption: 'old' | 'new' | 'stcg' = 'new';
  let taxSavings = 0;
  let summaryNote = '';
  if (!isLongTerm) {
    recommendedOption = 'stcg';
    taxSavings = 0;
    summaryNote = `Property held for ${holdingMonths} months (≤ 24 months). Classified as Short-Term Capital Asset. Gains are taxed at your applicable income tax slab rate (${inputs.stcgSlabRate || 30}% + 4% cess).`;
  } else if (!isGrandfathered) {
    recommendedOption = 'new';
    taxSavings = 0;
    summaryNote =
      'Property purchased on or after 23 July 2024. As per Finance Act 2024, indexation benefit is not available. Flat 12.5% LTCG (+ 4% cess = 13.0%) applies.';
  } else if (oldTotalTax <= newTotalTax) {
    recommendedOption = 'old';
    taxSavings = newTotalTax - oldTotalTax;
    summaryNote = `Old Rule (20% with Indexation) is more beneficial! It saves ₹${taxSavings.toLocaleString('en-IN')} in tax because indexation increased your cost from ₹${inputs.purchasePrice.toLocaleString('en-IN')} to ₹${indexedAcquisitionCost.toLocaleString('en-IN')}.`;
  } else {
    recommendedOption = 'new';
    taxSavings = oldTotalTax - newTotalTax;
    summaryNote = `New Rule (12.5% without Indexation) is more beneficial! It saves ₹${taxSavings.toLocaleString('en-IN')} in tax due to the lower 12.5% tax rate.`;
  }
  return {
    holdingDays,
    holdingMonths,
    isLongTerm,
    isGrandfathered,
    purchaseFY,
    saleFY,
    purchaseCII,
    saleCII,
    improvementCII,
    netSaleConsideration,
    oldRegime: {
      applicable: isLongTerm && isGrandfathered,
      indexedAcquisitionCost,
      indexedImprovementCost,
      totalIndexedCost,
      grossGain: oldGrossGain,
      exemptions: totalExemptions,
      taxableGain: oldTaxableGain,
      baseTax: oldBaseTax,
      cess: oldCess,
      totalTax: oldTotalTax,
      netInHand: oldNetInHand,
      effectiveRate: 20.8,
    },
    newRegime: {
      actualCost,
      grossGain: newGrossGain,
      exemptions: totalExemptions,
      taxableGain: newTaxableGain,
      baseTax: newBaseTax,
      cess: newCess,
      totalTax: newTotalTax,
      netInHand: newNetInHand,
      effectiveRate: 13.0,
    },
    stcg: {
      applicable: !isLongTerm,
      actualCost,
      taxableGain: stcgTaxable,
      slabRate: (inputs.stcgSlabRate || 30) * 1.04,
      totalTax: stcgTax,
      netInHand: stcgNetInHand,
    },
    recommendedOption,
    taxSavings,
    summaryNote,
  };
}
