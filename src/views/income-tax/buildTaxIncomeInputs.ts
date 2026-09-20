import {
  AgeCategory,
  CityCategory,
  FinancialYear,
  TaxIncomeInputs,
} from '../../utilities/incomeTaxCalculations';
import { sanitizeAmount, useIncomeTaxDeductions } from './useIncomeTaxDeductions';
export interface TaxInputParams {
  financialYear: FinancialYear;
  ageCategory: AgeCategory;
  isSalaried: boolean;
  grossSalary: string;
  basicSalary: string;
  hraReceived: string;
  rentPaid: string;
  cityCategory: CityCategory;
  professionalTax: string;
  exemptAllowances: string;
  useCustomStdDeduction: boolean;
  customStdDeduction: string;
  businessIncome: string;
  isSelfOccupied: boolean;
  rentalIncome: string;
  municipalTaxes: string;
  homeLoanInterestProperty: string;
  equityStcg: string;
  equityLtcg: string;
  otherCapitalGains: string;
  savingsInterest: string;
  fdInterest: string;
  ppfInterest: string;
  otherIncome: string;
  deductions: ReturnType<typeof useIncomeTaxDeductions>;
}
export function buildTaxIncomeInputs(p: TaxInputParams): TaxIncomeInputs {
  return {
    financialYear: p.financialYear,
    ageCategory: p.ageCategory,
    isSalaried: p.isSalaried,
    grossSalary: p.isSalaried ? sanitizeAmount(p.grossSalary) : 0,
    basicSalary: p.isSalaried ? sanitizeAmount(p.basicSalary) : 0,
    hraReceived: p.isSalaried ? sanitizeAmount(p.hraReceived) : 0,
    rentPaid: p.isSalaried ? sanitizeAmount(p.rentPaid) : 0,
    cityCategory: p.cityCategory,
    professionalTax: p.isSalaried ? sanitizeAmount(p.professionalTax) : 0,
    exemptAllowances: p.isSalaried ? sanitizeAmount(p.exemptAllowances) : 0,
    customStandardDeduction: p.useCustomStdDeduction ? sanitizeAmount(p.customStdDeduction) : null,
    businessIncome: sanitizeAmount(p.businessIncome),
    isSelfOccupied: p.isSelfOccupied,
    rentalIncome: sanitizeAmount(p.rentalIncome),
    municipalTaxes: sanitizeAmount(p.municipalTaxes),
    homeLoanInterestProperty: sanitizeAmount(p.homeLoanInterestProperty),
    equityStcg: sanitizeAmount(p.equityStcg),
    equityLtcg: sanitizeAmount(p.equityLtcg),
    otherCapitalGains: sanitizeAmount(p.otherCapitalGains),
    savingsInterest: sanitizeAmount(p.savingsInterest),
    fdInterest: sanitizeAmount(p.fdInterest),
    ppfInterest: sanitizeAmount(p.ppfInterest),
    otherIncome: sanitizeAmount(p.otherIncome),
    section80C: p.deductions.effective80CAmount,
    section80Ccd1b: sanitizeAmount(p.deductions.section80Ccd1b),
    section80Ccd2: sanitizeAmount(p.deductions.section80Ccd2),
    section80D_self: sanitizeAmount(p.deductions.section80DSelf),
    selfSeniorCitizen: p.deductions.seniorSelf80D,
    section80D_parents: sanitizeAmount(p.deductions.section80DParents),
    parentsSeniorCitizen: p.deductions.seniorParents80D,
    section80E: sanitizeAmount(p.deductions.section80E),
    section80G: sanitizeAmount(p.deductions.section80G),
    section80Tta: sanitizeAmount(p.deductions.section80Tta),
    section80Gg: sanitizeAmount(p.deductions.section80Gg),
    section80Ddb: sanitizeAmount(p.deductions.section80Ddb),
    section80U: sanitizeAmount(p.deductions.section80U),
    section80Eea: sanitizeAmount(p.deductions.section80Eea),
    section80Eeb: sanitizeAmount(p.deductions.section80Eeb),
    section80Dd: sanitizeAmount(p.deductions.section80Dd),
    section80Ggc: sanitizeAmount(p.deductions.section80Ggc),
    customDeductions: p.deductions.customDeductionsList.map((item) => ({
      id: item.id,
      name: item.name,
      amount: sanitizeAmount(item.amount),
    })),
    otherDeductions: sanitizeAmount(p.deductions.otherDeductions),
  };
}
