import type { RegimeTaxResult, TaxIncomeInputs, TaxOptimizationTip } from './types';
export function generateTaxOptimizationTips(
  inputs: TaxIncomeInputs,
  oldResult: RegimeTaxResult,
  newResult: RegimeTaxResult
): TaxOptimizationTip[] {
  const tips: TaxOptimizationTip[] = [];
  const marginalRate =
    oldResult.taxableIncome > 1000000 ? 0.312 : oldResult.taxableIncome > 500000 ? 0.208 : 0.052;
  const isPreJuly2024 = inputs.financialYear === '2023-24';
  const newStdDeductionText = isPreJuly2024 ? '₹50,000' : '₹75,000';
  const ltcgExemption = isPreJuly2024 ? 100000 : 125000;
  const ltcgRate = isPreJuly2024 ? 0.10 : 0.125;
  if (newResult.totalTaxPayable < oldResult.totalTaxPayable) {
    const diff = oldResult.totalTaxPayable - newResult.totalTaxPayable;
    tips.push({
      category: 'Regime Switch',
      title: `Switch to New Tax Regime to instantly save ₹${diff.toLocaleString('en-IN')}`,
      description:
        `The New Tax Regime for FY ${inputs.financialYear} provides lower slab rates and a ${newStdDeductionText} standard deduction, saving you money without locking capital into 80C investments.`,
      potentialTaxSavings: diff,
      actionable: true,
      codeSection: 'Section 115BAC',
    });
  }
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
  if (inputs.equityLtcg > 0 && inputs.equityLtcg < ltcgExemption) {
    const remainingExemption = ltcgExemption - inputs.equityLtcg;
    tips.push({
      category: 'Capital Gains',
      codeSection: 'Section 112A',
      title: `Harvest ₹${remainingExemption.toLocaleString('en-IN')} LTCG Tax-Free`,
      description: `For FY ${inputs.financialYear}, equity LTCG up to ₹${ltcgExemption.toLocaleString('en-IN')} is 100% tax-free. You have ₹${remainingExemption.toLocaleString('en-IN')} of unused tax-free gains this year. Consider booking gains and reinvesting.`,
      potentialTaxSavings: Math.round(remainingExemption * ltcgRate),
      actionable: true,
    });
  }
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
