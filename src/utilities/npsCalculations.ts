export interface NPSCalculationInput {
  currentAge: number;          // e.g. 28
  retirementAge: number;       // e.g. 60
  monthlyContribution: number; // Self monthly contribution
  employerContribution?: number; // Optional employer monthly contribution
  expectedRoi: number;         // Expected annual return rate (CAGR, e.g. 10%)
  annuityPercent: number;      // % of corpus to invest in annuity (min 40%, max 100%)
  annuityRate: number;         // Expected annual annuity return rate (e.g. 6%)
}
export interface NPSYearDetail {
  yearNumber: number;
  age: number;
  annualContribution: number;
  cumulativeInvested: number;
  interestEarned: number;
  closingCorpus: number;
}
export interface NPSCalculationResult {
  tenureYears: number;
  totalInvested: number;
  selfInvested: number;
  employerInvested: number;
  interestEarned: number;
  totalCorpus: number;
  lumpSumAmount: number;
  lumpSumPercent: number;
  annuityCorpus: number;
  annuityPercent: number;
  monthlyPension: number;
  annualPension: number;
  yearlyBreakdown: NPSYearDetail[];
}
export function calculateNPS(input: NPSCalculationInput): NPSCalculationResult {
  const {
    currentAge,
    retirementAge,
    monthlyContribution,
    employerContribution = 0,
    expectedRoi,
    annuityPercent,
    annuityRate,
  } = input;
  const tenureYears = Math.max(1, retirementAge - currentAge);
  const totalMonthlyInvestment = Math.max(0, monthlyContribution + employerContribution);
  const monthlyRate = expectedRoi / 100 / 12;
  let runningCorpus = 0;
  let cumulativeInvested = 0;
  let selfInvested = 0;
  let employerInvested = 0;
  const yearlyBreakdown: NPSYearDetail[] = [];
  for (let y = 1; y <= tenureYears; y++) {
    const startCorpus = runningCorpus;
    let yearContribution = 0;
    for (let m = 0; m < 12; m++) {
      // Compounded monthly
      runningCorpus = (runningCorpus + totalMonthlyInvestment) * (1 + monthlyRate);
      yearContribution += totalMonthlyInvestment;
      cumulativeInvested += totalMonthlyInvestment;
      selfInvested += monthlyContribution;
      employerInvested += employerContribution;
    }
    const yearInterest = runningCorpus - (startCorpus + yearContribution);
    yearlyBreakdown.push({
      yearNumber: y,
      age: currentAge + y,
      annualContribution: Math.round(yearContribution),
      cumulativeInvested: Math.round(cumulativeInvested),
      interestEarned: Math.round(Math.max(0, yearInterest)),
      closingCorpus: Math.round(runningCorpus),
    });
  }
  const totalCorpus = Math.round(runningCorpus);
  const totalInvestedRounded = Math.round(cumulativeInvested);
  const interestEarnedRounded = Math.max(0, totalCorpus - totalInvestedRounded);
  const safeAnnuityPercent = Math.max(40, Math.min(100, annuityPercent));
  const lumpSumPercent = 100 - safeAnnuityPercent;
  const annuityCorpus = Math.round((totalCorpus * safeAnnuityPercent) / 100);
  const lumpSumAmount = Math.round((totalCorpus * lumpSumPercent) / 100);
  const annualPension = Math.round((annuityCorpus * annuityRate) / 100);
  const monthlyPension = Math.round(annualPension / 12);
  return {
    tenureYears,
    totalInvested: totalInvestedRounded,
    selfInvested: Math.round(selfInvested),
    employerInvested: Math.round(employerInvested),
    interestEarned: interestEarnedRounded,
    totalCorpus,
    lumpSumAmount,
    lumpSumPercent,
    annuityCorpus,
    annuityPercent: safeAnnuityPercent,
    monthlyPension,
    annualPension,
    yearlyBreakdown,
  };
}
