import {
  getAssessmentYear,
  getLatestRunningFinancialYear,
} from '../../utilities/incomeTaxCalculations';
export interface Form16ExtractedData {
  employerName: string;
  employerTan: string;
  employeePan: string;
  assessmentYear: string;
  grossSalary: number;
  basicSalary: number;
  hraReceived: number;
  rentPaid: number;
  exemptAllowances: number;
  standardDeduction: number;
  professionalTax: number;
  section80C: number;
  section80Ccd1b: number;
  section80D: number;
  section80E: number;
  section80G: number;
  section80Tta: number;
  otherDeductions: number;
  otherIncome: number;
  tdsDeducted: number;
}
export const DEFAULT_SAMPLE_FORM16: Form16ExtractedData = {
  employerName: 'Tata Consultancy Services Ltd.',
  employerTan: 'MUMB12345E',
  employeePan: 'ABCDE1234F',
  assessmentYear: getAssessmentYear(getLatestRunningFinancialYear()),
  grossSalary: 1650000,
  basicSalary: 825000,
  hraReceived: 330000,
  rentPaid: 240000,
  exemptAllowances: 25000,
  standardDeduction: 75000,
  professionalTax: 2400,
  section80C: 150000,
  section80Ccd1b: 50000,
  section80D: 25000,
  section80E: 0,
  section80G: 10000,
  section80Tta: 8500,
  otherDeductions: 0,
  otherIncome: 25000,
  tdsDeducted: 145000,
};
export const EMPTY_FORM16_DATA: Form16ExtractedData = {
  employerName: '',
  employerTan: '',
  employeePan: '',
  assessmentYear: getAssessmentYear(getLatestRunningFinancialYear()),
  grossSalary: 0,
  basicSalary: 0,
  hraReceived: 0,
  rentPaid: 0,
  exemptAllowances: 0,
  standardDeduction: 75000,
  professionalTax: 0,
  section80C: 0,
  section80Ccd1b: 0,
  section80D: 0,
  section80E: 0,
  section80G: 0,
  section80Tta: 0,
  otherDeductions: 0,
  otherIncome: 0,
  tdsDeducted: 0,
};
