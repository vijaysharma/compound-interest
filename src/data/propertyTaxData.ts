/**
 * Official Cost Inflation Index (CII) Table notified by CBDT (Central Board of Direct Taxes, India).
 * Base Year: 2001-02 = 100
 */
export const COST_INFLATION_INDEX: Record<string, number> = {
  '2001-02': 100,
  '2002-03': 105,
  '2003-04': 109,
  '2004-05': 113,
  '2005-06': 117,
  '2006-07': 122,
  '2007-08': 129,
  '2008-09': 137,
  '2009-10': 148,
  '2010-11': 167,
  '2011-12': 184,
  '2012-13': 200,
  '2013-14': 220,
  '2014-15': 240,
  '2015-16': 254,
  '2016-17': 264,
  '2017-18': 272,
  '2018-19': 280,
  '2019-20': 289,
  '2020-21': 301,
  '2021-22': 317,
  '2022-23': 331,
  '2023-24': 348,
  '2024-25': 363,
  '2025-26': 377,
};
export const CII_YEARS = Object.keys(COST_INFLATION_INDEX);
/**
 * Determine Indian Financial Year (1 April - 31 March) from an ISO Date string (YYYY-MM-DD).
 */
export function getFinancialYear(dateStr: string): string {
  if (!dateStr) return '2024-25';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '2024-25';
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-indexed (Jan=1, Dec=12)
  let startYear = year;
  if (month < 4) {
    startYear = year - 1;
  }
  const endYearShort = String((startYear + 1) % 100).padStart(2, '0');
  const fy = `${startYear}-${endYearShort}`;
  if (COST_INFLATION_INDEX[fy]) {
    return fy;
  }
  if (startYear < 2001) {
    return '2001-02';
  }
  return '2025-26';
}
export interface PropertyTaxInputs {
  purchaseDate: string; // YYYY-MM-DD
  purchasePrice: number;
  saleDate: string; // YYYY-MM-DD
  salePrice: number;
  improvementCost: number;
  improvementYear?: string;
  transferExpenses: number;
  sec54Exemption: number; // Residential property reinvestment (Cap ₹10 Cr)
  sec54ecExemption: number; // Capital Gains Bonds (Cap ₹50 Lakh)
  stcgSlabRate: number; // For STCG if held <= 24 months (default 30%)
}
export interface PropertyTaxComparison {
  holdingDays: number;
  holdingMonths: number;
  isLongTerm: boolean;
  isGrandfathered: boolean; // Purchased before 23-July-2024
  purchaseFY: string;
  saleFY: string;
  purchaseCII: number;
  saleCII: number;
  improvementCII: number;
  netSaleConsideration: number;
  // Old Regime (20% with indexation)
  oldRegime: {
    applicable: boolean;
    indexedAcquisitionCost: number;
    indexedImprovementCost: number;
    totalIndexedCost: number;
    grossGain: number;
    exemptions: number;
    taxableGain: number;
    baseTax: number;
    cess: number;
    totalTax: number;
    netInHand: number;
    effectiveRate: number;
  };
  // New Regime (12.5% without indexation)
  newRegime: {
    actualCost: number;
    grossGain: number;
    exemptions: number;
    taxableGain: number;
    baseTax: number;
    cess: number;
    totalTax: number;
    netInHand: number;
    effectiveRate: number;
  };
  // STCG if holding <= 24 months
  stcg: {
    applicable: boolean;
    actualCost: number;
    taxableGain: number;
    slabRate: number;
    totalTax: number;
    netInHand: number;
  };
  recommendedOption: 'old' | 'new' | 'stcg';
  taxSavings: number;
  summaryNote: string;
}
export function calculatePropertyCapitalGains(
  inputs: PropertyTaxInputs
): PropertyTaxComparison {
  const pDate = new Date(inputs.purchaseDate || '2018-05-15');
  const sDate = new Date(inputs.saleDate || '2024-09-10');
  const diffTime = Math.max(0, sDate.getTime() - pDate.getTime());
  const holdingDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const holdingMonths = Number((holdingDays / 30.4375).toFixed(1));
  // Immovable property holding threshold is 24 months
  const isLongTerm = holdingMonths > 24;
  // Finance Act 2024 cut-off: 23 July 2024
  const cutOffDate = new Date('2024-07-23').getTime();
  const isGrandfathered = pDate.getTime() < cutOffDate;
  const purchaseFY = getFinancialYear(inputs.purchaseDate);
  const saleFY = getFinancialYear(inputs.saleDate);
  const improvementFY = inputs.improvementYear || purchaseFY;
  const purchaseCII = COST_INFLATION_INDEX[purchaseFY] || 100;
  const saleCII = COST_INFLATION_INDEX[saleFY] || 363;
  const improvementCII = COST_INFLATION_INDEX[improvementFY] || purchaseCII;
  const netSaleConsideration = Math.max(0, inputs.salePrice - (inputs.transferExpenses || 0));
  // 1. Old Regime (20% with Indexation + 4% Cess = 20.8%)
  const indexedAcquisitionCost = Math.round(
    inputs.purchasePrice * (saleCII / purchaseCII)
  );
  const indexedImprovementCost = Math.round(
    (inputs.improvementCost || 0) * (saleCII / improvementCII)
  );
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
  // 2. New Regime (12.5% without Indexation + 4% Cess = 13.0%)
  const actualCost = inputs.purchasePrice + (inputs.improvementCost || 0);
  const newGrossGain = Math.max(0, netSaleConsideration - actualCost);
  const newTaxableGain = Math.max(0, newGrossGain - totalExemptions);
  const newBaseTax = newTaxableGain * 0.125;
  const newCess = newBaseTax * 0.04;
  const newTotalTax = Math.round(newBaseTax + newCess);
  const newNetInHand = Math.round(netSaleConsideration - newTotalTax);
  // 3. STCG (if held <= 24 months)
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
  } else {
    // Both options allowed under Grandfathering clause for properties acquired before 23-July-2024
    if (oldTotalTax <= newTotalTax) {
      recommendedOption = 'old';
      taxSavings = newTotalTax - oldTotalTax;
      summaryNote = `Old Rule (20% with Indexation) is more beneficial! It saves ₹${taxSavings.toLocaleString('en-IN')} in tax because indexation increased your cost from ₹${inputs.purchasePrice.toLocaleString('en-IN')} to ₹${indexedAcquisitionCost.toLocaleString('en-IN')}.`;
    } else {
      recommendedOption = 'new';
      taxSavings = oldTotalTax - newTotalTax;
      summaryNote = `New Rule (12.5% without Indexation) is more beneficial! It saves ₹${taxSavings.toLocaleString('en-IN')} in tax due to the lower 12.5% tax rate.`;
    }
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
