export type TaxRegime = 'new' | 'old';
export type AgeCategory = 'general' | 'senior' | 'super_senior'; // <60, 60-79, 80+
export type CityCategory = 'metro' | 'non_metro';
export interface TaxIncomeInputs {
  financialYear: '2024-25' | '2025-26';
  ageCategory: AgeCategory;
  isSalaried: boolean;
  // Salary
  grossSalary: number;
  basicSalary: number;
  hraReceived: number;
  rentPaid: number;
  cityCategory: CityCategory;
  professionalTax?: number; // Sec 16(iii)
  exemptAllowances?: number; // LTA, uniform, conveyance allowances under Sec 10
  customStandardDeduction?: number | null; // Override standard deduction
  // Business / Profession
  businessIncome: number;
  // House Property
  isSelfOccupied: boolean;
  rentalIncome: number;
  municipalTaxes: number;
  homeLoanInterestProperty: number; // Sec 24(b)
  // Capital Gains
  equityStcg: number; // Short term equity capital gains (taxed at 20%)
  equityLtcg: number; // Long term equity capital gains (taxed at 12.5% above 1.25L)
  otherCapitalGains: number; // Slab-rate or debt capital gains
  // Other Sources
  savingsInterest: number;
  fdInterest: number;
  ppfInterest: number; // 100% Tax-Exempt under EEE (Sec 10)
  otherIncome: number;
  // Deductions (Old Regime)
  section80C: number;        // Max 1.5L (EPF, PPF, ELSS, Life Insurance)
  section80Ccd1b: number;    // Max 50k (NPS additional self-contribution)
  section80Ccd2: number;     // Employer NPS contribution (allowed in both regimes)
  section80D_self: number;   // Health insurance self & family (max 25k/50k)
  selfSeniorCitizen?: boolean; // Self/Family senior citizen (80D max 50k)
  section80D_parents: number;// Health insurance parents (max 25k/50k)
  parentsSeniorCitizen?: boolean; // Parents senior citizen (80D max 50k)
  section80E: number;        // Education loan interest (no limit)
  section80G: number;        // Charitable donations
  section80Tta: number;      // Savings bank interest deduction (max 10k or 50k for senior)
  section80Gg?: number;      // Rent paid when no HRA received (Sec 80GG, max 60k)
  section80Ddb?: number;     // Medical treatment of specified disease (Sec 80DDB, max 40k/100k)
  section80U?: number;       // Person with disability (Sec 80U, 75k/125k)
  section80Eea?: number;     // Additional affordable housing interest (Sec 80EEA, max 1.5L)
  customDeductions?: Array<{ id: string; name: string; amount: number }>;
  otherDeductions: number;   // Other eligible deductions
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
export interface TaxComparisonResult {
  newRegime: RegimeTaxResult;
  oldRegime: RegimeTaxResult;
  recommendedRegime: TaxRegime;
  taxSavings: number; // Savings by choosing recommended regime
  breakevenDeductions: number; // Deductions required in Old Regime to beat New Regime
  currentDeductionsClaimed: number;
  additionalDeductionsNeeded: number;
  optimizationTips: TaxOptimizationTip[];
}
export interface TaxOptimizationTip {
  category: string;
  title: string;
  description: string;
  potentialTaxSavings: number;
  actionable: boolean;
  codeSection?: string;
}
/**
 * Calculates Section 10(13A) HRA Exemption
 */
export function calculateHRAExemption(
  hraReceived: number,
  rentPaid: number,
  basicSalary: number,
  cityCategory: CityCategory
): number {
  if (!hraReceived || !rentPaid || rentPaid <= 0.1 * basicSalary) {
    return 0;
  }
  const rentMinus10Percent = Math.max(0, rentPaid - 0.1 * basicSalary);
  const cityPercentageCap = cityCategory === 'metro' ? 0.5 * basicSalary : 0.4 * basicSalary;
  return Math.round(Math.min(hraReceived, rentMinus10Percent, cityPercentageCap));
}
/**
 * Calculates Income or Loss from House Property
 */
export function calculateHousePropertyIncome(
  isSelfOccupied: boolean,
  rentalIncome: number,
  municipalTaxes: number,
  homeLoanInterest: number
): { incomeOrLoss: number; lossForSetOff: number } {
  if (isSelfOccupied) {
    // Max 2 Lakh interest deduction for self-occupied
    const loss = Math.min(200000, homeLoanInterest);
    return {
      incomeOrLoss: -loss,
      lossForSetOff: loss,
    };
  }
  // Let out property
  const netAnnualValue = Math.max(0, rentalIncome - municipalTaxes);
  const standardDeduction30 = 0.3 * netAnnualValue;
  const netIncome = netAnnualValue - standardDeduction30 - homeLoanInterest;
  if (netIncome < 0) {
    // Loss set-off is capped at 2 Lakh against other income heads
    const setOffLoss = Math.min(200000, Math.abs(netIncome));
    return {
      incomeOrLoss: netIncome,
      lossForSetOff: setOffLoss,
    };
  }
  return {
    incomeOrLoss: netIncome,
    lossForSetOff: 0,
  };
}
/**
 * Slabs for New Tax Regime (Section 115BAC, FY 2024-25 / FY 2025-26 Budget 2024 update)
 */
function calculateNewRegimeSlabTax(taxableIncome: number): { slabTax: number; slabs: TaxSlabBreakdown[] } {
  const slabs: TaxSlabBreakdown[] = [];
  let tax = 0;
  const thresholds = [
    { limit: 300000, rate: 0, label: 'Up to ₹3,00,000' },
    { limit: 700000, rate: 5, label: '₹3,00,001 to ₹7,00,000' },
    { limit: 1000000, rate: 10, label: '₹7,00,001 to ₹10,00,000' },
    { limit: 1200000, rate: 15, label: '₹10,00,001 to ₹12,00,000' },
    { limit: 1500000, rate: 20, label: '₹12,00,001 to ₹15,00,000' },
    { limit: Infinity, rate: 30, label: 'Above ₹15,00,000' },
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
/**
 * Slabs for Old Tax Regime
 */
function calculateOldRegimeSlabTax(
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
/**
 * Calculates Surcharge based on total income
 */
function calculateSurcharge(
  taxAmount: number,
  totalIncome: number,
  regime: TaxRegime
): number {
  if (totalIncome <= 5000000) return 0;
  let rate = 0;
  if (totalIncome <= 10000000) {
    rate = 0.10; // 10%
  } else if (totalIncome <= 20000000) {
    rate = 0.15; // 15%
  } else if (totalIncome <= 50000000) {
    rate = 0.25; // 25%
  } else {
    // Above 5 Cr: 25% in New Regime, 37% in Old Regime
    rate = regime === 'new' ? 0.25 : 0.37;
  }
  return taxAmount * rate;
}
export function computeTaxForRegime(
  inputs: TaxIncomeInputs,
  regime: TaxRegime
): RegimeTaxResult {
  const {
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
    section80C,
    section80Ccd1b,
    section80Ccd2,
    section80D_self,
    selfSeniorCitizen = false,
    section80D_parents,
    parentsSeniorCitizen = false,
    section80E,
    section80G,
    section80Tta,
    section80Gg = 0,
    section80Ddb = 0,
    section80U = 0,
    section80Eea = 0,
    customDeductions = [],
    otherDeductions,
    ageCategory,
  } = inputs;
  // House Property
  const hpResult = calculateHousePropertyIncome(
    isSelfOccupied,
    rentalIncome,
    municipalTaxes,
    homeLoanInterestProperty
  );
  // Standard deduction
  let standardDeduction = 0;
  if (isSalaried && grossSalary > 0) {
    if (customStandardDeduction !== undefined && customStandardDeduction !== null) {
      standardDeduction = Math.min(grossSalary, Math.max(0, customStandardDeduction));
    } else if (regime === 'new') {
      // Enhanced to ₹75,000 in Budget 2024 for FY 2024-25 / 2025-26
      standardDeduction = Math.min(grossSalary, 75000);
    } else {
      standardDeduction = Math.min(grossSalary, 50000);
    }
  }
  // HRA Exemption (Old Regime only)
  const hraExemption =
    regime === 'old' && isSalaried
      ? calculateHRAExemption(hraReceived, rentPaid, basicSalary, cityCategory)
      : 0;
  const pTaxDeduction = regime === 'old' && isSalaried ? Math.max(0, professionalTax) : 0;
  const allowancesDeduction = regime === 'old' && isSalaried ? Math.max(0, exemptAllowances) : 0;
  // Net salary after salary-specific deductions
  const netSalary = Math.max(0, grossSalary - standardDeduction - hraExemption - pTaxDeduction - allowancesDeduction);
  // House Property loss offset
  const housePropertyNet = hpResult.incomeOrLoss;
  const housePropertyLossDeduction = hpResult.lossForSetOff;
  // Gross Total Income (GTI)
  // Note: PPF Interest is 100% EXEMPT under Section 10(11) / EEE and is excluded from GTI!
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
  // Deductions calculation
  let totalDeductions = 0;
  if (regime === 'new') {
    // New regime allows 80CCD(2) employer NPS contribution up to 10% of basic (or 14% govt)
    totalDeductions += Math.min(section80Ccd2, basicSalary * 0.14);
  } else {
    // Old regime Chapter VI-A deductions
    const capped80C = Math.min(150000, Math.max(0, section80C));
    const capped80CCD1B = Math.min(50000, Math.max(0, section80Ccd1b));
    const capped80CCD2 = Math.min(section80Ccd2, basicSalary * 0.14);
    const maxSelf80D = selfSeniorCitizen || ageCategory === 'senior' || ageCategory === 'super_senior' ? 50000 : 25000;
    const capped80D_self = Math.min(maxSelf80D, Math.max(0, section80D_self));
    const maxParents80D = parentsSeniorCitizen ? 50000 : 25000;
    const capped80D_parents = Math.min(maxParents80D, Math.max(0, section80D_parents));
    const max80TTA = ageCategory === 'senior' || ageCategory === 'super_senior' ? 50000 : 10000;
    const capped80TTA = Math.min(max80TTA, Math.max(0, section80Tta, savingsInterest));
    const capped80GG = Math.min(60000, Math.max(0, section80Gg));
    const max80DDB = parentsSeniorCitizen || selfSeniorCitizen || ageCategory !== 'general' ? 100000 : 40000;
    const capped80DDB = Math.min(max80DDB, Math.max(0, section80Ddb));
    const capped80U = Math.min(125000, Math.max(0, section80U));
    const capped80EEA = Math.min(150000, Math.max(0, section80Eea));
    const customSum = (customDeductions || []).reduce(
      (sum, item) => sum + Math.max(0, Number(item.amount) || 0),
      0
    );
    totalDeductions =
      capped80C +
      capped80CCD1B +
      capped80CCD2 +
      capped80D_self +
      capped80D_parents +
      Math.max(0, section80E) +
      Math.max(0, section80G) +
      capped80TTA +
      capped80GG +
      capped80DDB +
      capped80U +
      capped80EEA +
      customSum +
      Math.max(0, otherDeductions);
  }
  // Deductions are set off against normal income first (cannot be set off against special rate equity gains)
  const normalTaxableIncome = Math.max(0, normalIncomeSources - totalDeductions);
  const totalTaxableIncome = normalTaxableIncome + totalSpecialGains;
  // Calculate slab tax on normal taxable income
  const slabCalc =
    regime === 'new'
      ? calculateNewRegimeSlabTax(normalTaxableIncome)
      : calculateOldRegimeSlabTax(normalTaxableIncome, ageCategory);
  // Special Rate Taxes:
  // 1. Equity STCG: 20% (Budget 2024)
  const stcgTax = Math.max(0, equityStcg) * 0.20;
  // 2. Equity LTCG: 12.5% on gains exceeding 1.25 Lakh (Budget 2024)
  const taxableLtcg = Math.max(0, equityLtcg - 125000);
  const ltcgTax = taxableLtcg * 0.125;
  const totalTaxBeforeRebate = slabCalc.slabTax + stcgTax + ltcgTax;
  // Section 87A Rebate
  let rebate87A = 0;
  if (regime === 'new') {
    // New regime: Full rebate up to ₹25,000 if taxable income <= 7,00,000
    if (totalTaxableIncome <= 700000) {
      rebate87A = Math.min(totalTaxBeforeRebate, 25000);
    } else if (totalTaxableIncome > 700000 && totalTaxableIncome <= 727777) {
      // Marginal relief under Section 87A: tax payable cannot exceed income exceeding ₹7,00,000
      const excessIncome = totalTaxableIncome - 700000;
      if (totalTaxBeforeRebate > excessIncome) {
        rebate87A = totalTaxBeforeRebate - excessIncome;
      }
    }
  } else {
    // Old regime: Full rebate up to ₹12,500 if taxable income <= 5,00,000
    if (totalTaxableIncome <= 500000) {
      rebate87A = Math.min(totalTaxBeforeRebate, 12500);
    }
  }
  const taxAfterRebate = Math.max(0, totalTaxBeforeRebate - rebate87A);
  // Surcharge & Cess
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
/**
 * Calculates breakeven deductions needed in Old Regime to match New Regime tax
 */
export function calculateBreakevenDeduction(inputs: TaxIncomeInputs): number {
  const newResult = computeTaxForRegime(inputs, 'new');
  const targetTax = newResult.totalTaxPayable;
  let low = 0;
  let high = Math.max(2000000, inputs.grossSalary + inputs.businessIncome);
  let bestDeduction = 0;
  // Binary search for exact deduction required
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
/**
 * Generates rule-based tax optimization recommendations based on financial inputs
 */
export function generateTaxOptimizationTips(
  inputs: TaxIncomeInputs,
  oldResult: RegimeTaxResult,
  newResult: RegimeTaxResult
): TaxOptimizationTip[] {
  const tips: TaxOptimizationTip[] = [];
  const marginalRate =
    oldResult.taxableIncome > 1000000 ? 0.312 : oldResult.taxableIncome > 500000 ? 0.208 : 0.052;
  if (newResult.totalTaxPayable < oldResult.totalTaxPayable) {
    const diff = oldResult.totalTaxPayable - newResult.totalTaxPayable;
    tips.push({
      category: 'Regime Switch',
      title: `Switch to New Tax Regime to instantly save ₹${diff.toLocaleString('en-IN')}`,
      description:
        'The New Tax Regime provides lower slab rates and an enhanced ₹75,000 standard deduction, saving you money without locking capital into 80C investments.',
      potentialTaxSavings: diff,
      actionable: true,
      codeSection: 'Section 115BAC',
    });
  }
  // 1. Unused 80C
  const remaining80C = Math.max(0, 150000 - inputs.section80C);
  if (remaining80C > 0) {
    const potentialSavings = Math.round(remaining80C * marginalRate);
    tips.push({
      category: 'Section 80C',
      codeSection: 'Section 80C',
      title: `Invest ₹${remaining80C.toLocaleString('en-IN')} more in PPF, EPF, or ELSS`,
      description: `You have not maximized your ₹1,50,000 limit under Section 80C. Depositing in PPF or tax-saving ELSS mutual funds can save you up to ₹${potentialSavings.toLocaleString('en-IN')} in taxes under the Old Regime.`,
      potentialTaxSavings: potentialSavings,
      actionable: true,
    });
  }
  // 2. Unused 80CCD(1B) NPS Tier 1
  const remainingNPS = Math.max(0, 50000 - inputs.section80Ccd1b);
  if (remainingNPS > 0) {
    const potentialSavings = Math.round(remainingNPS * 0.312);
    tips.push({
      category: 'Retirement (NPS)',
      codeSection: 'Section 80CCD(1B)',
      title: `Claim ₹${remainingNPS.toLocaleString('en-IN')} exclusive NPS deduction`,
      description: `NPS Tier 1 offers an exclusive ₹50,000 deduction over and above the ₹1.5 Lakh 80C limit. Investing in NPS can directly save up to ₹${potentialSavings.toLocaleString('en-IN')}.`,
      potentialTaxSavings: potentialSavings,
      actionable: true,
    });
  }
  // 3. Section 80CCD(2) Employer NPS Contribution (Works in BOTH Old and New Regimes!)
  if (inputs.isSalaried && inputs.basicSalary > 0 && inputs.section80Ccd2 === 0) {
    const maxEmployerNps = Math.round(inputs.basicSalary * 0.10);
    const potentialSavings = Math.round(maxEmployerNps * 0.312);
    tips.push({
      category: 'Corporate Benefit',
      codeSection: 'Section 80CCD(2)',
      title: `Opt for Employer NPS Contribution (Up to ₹${maxEmployerNps.toLocaleString('en-IN')})`,
      description: `Ask your employer to restructure up to 10% of your Basic salary into NPS under Section 80CCD(2). This is fully tax-deductible under BOTH Old and New Tax Regimes with no ₹1.5L cap!`,
      potentialTaxSavings: potentialSavings,
      actionable: true,
    });
  }
  // 4. Section 80D Health Insurance
  const unused80DSelf = Math.max(0, 25000 - inputs.section80D_self);
  const unused80DParents = Math.max(0, 50000 - inputs.section80D_parents);
  if (unused80DSelf > 0 || unused80DParents > 0) {
    const potentialSavings = Math.round((unused80DSelf + unused80DParents) * 0.312);
    tips.push({
      category: 'Health & Protection',
      codeSection: 'Section 80D',
      title: 'Health Insurance for Self and Senior Parents',
      description: `Premiums paid for health insurance policies (up to ₹25,000 for self/family and up to ₹50,000 for senior citizen parents) qualify for Section 80D deductions under Old Regime.`,
      potentialTaxSavings: potentialSavings,
      actionable: true,
    });
  }
  // 5. Equity LTCG Tax Harvesting
  if (inputs.equityLtcg > 0 && inputs.equityLtcg < 125000) {
    const remainingExemption = 125000 - inputs.equityLtcg;
    tips.push({
      category: 'Capital Gains',
      codeSection: 'Section 112A',
      title: `Harvest ₹${remainingExemption.toLocaleString('en-IN')} LTCG Tax-Free`,
      description: `Under Budget 2024, equity LTCG up to ₹1,25,000 per financial year is 100% tax-free. You have ₹${remainingExemption.toLocaleString('en-IN')} of unused tax-free gains this year. Consider booking gains and reinvesting.`,
      potentialTaxSavings: Math.round(remainingExemption * 0.125),
      actionable: true,
    });
  }
  // 6. PPF EEE Advantage
  if (inputs.ppfInterest > 0) {
    tips.push({
      category: 'Tax-Free Wealth',
      codeSection: 'Section 10(11) (EEE)',
      title: `Your ₹${inputs.ppfInterest.toLocaleString('en-IN')} PPF interest is 100% Tax-Exempt`,
      description: `Public Provident Fund enjoys EEE (Exempt-Exempt-Exempt) tax status. Unlike FD interest which is taxed at slab rates up to 30%, PPF interest is completely exempt from income tax in both regimes.`,
      potentialTaxSavings: Math.round(inputs.ppfInterest * 0.312),
      actionable: false,
    });
  }
  return tips;
}
/**
 * Full Income Tax Comparison Engine
 */
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
