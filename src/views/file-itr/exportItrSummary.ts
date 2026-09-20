import { Form16ExtractedData } from './types';
import { RegimeTaxResult, TaxComparisonResult } from '../../utilities/incomeTaxCalculations';
export interface ExportItrSummaryParams {
  formData: Form16ExtractedData;
  taxComparison: TaxComparisonResult;
  recommendedResult: RegimeTaxResult;
  refundDifference: number;
  isRefundDue: boolean;
  isBalanceTaxPayable: boolean;
}
export function downloadItrSummary({
  formData,
  taxComparison,
  recommendedResult,
  refundDifference,
  isRefundDue,
  isBalanceTaxPayable,
}: ExportItrSummaryParams): void {
  const exportData = {
    title: 'Income Tax Return (ITR-1) Computation Summary',
    generatedOn: new Date().toLocaleDateString('en-IN'),
    assessmentYear: formData.assessmentYear,
    employer: {
      name: formData.employerName,
      tan: formData.employerTan,
    },
    employee: {
      pan: formData.employeePan,
    },
    salarySummary: {
      grossSalary: formData.grossSalary,
      exemptionsSec10: formData.exemptAllowances + recommendedResult.hraExemption,
      standardDeduction: recommendedResult.standardDeduction,
      professionalTax: formData.professionalTax,
      netSalary: recommendedResult.grossTotalIncome,
    },
    deductionsClaimed: {
      section80C: formData.section80C,
      section80CCD1B: formData.section80Ccd1b,
      section80D: formData.section80D,
      section80TTA: formData.section80Tta,
      totalDeductions: recommendedResult.totalDeductions,
    },
    taxComputation: {
      recommendedRegime: taxComparison.recommendedRegime.toUpperCase() + ' TAX REGIME',
      totalTaxableIncome: recommendedResult.taxableIncome,
      taxPayable: recommendedResult.totalTaxPayable,
      tdsDeductedByEmployer: formData.tdsDeducted,
      netOutcome: isRefundDue
        ? `REFUND DUE: ₹${Math.abs(refundDifference).toLocaleString('en-IN')}`
        : isBalanceTaxPayable
          ? `BALANCE TAX PAYABLE: ₹${Math.abs(refundDifference).toLocaleString('en-IN')}`
          : 'ZERO TAX / NIL BALANCE',
    },
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ITR_Computation_${formData.employeePan}_${formData.assessmentYear}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
