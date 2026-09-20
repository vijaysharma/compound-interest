import { useState } from 'react';
import { generateTaxAIAdviceAction } from '@/actions/taxAi';
import { TaxIncomeInputs, TaxComparisonResult } from '../../utilities/incomeTaxCalculations';
interface UseIncomeTaxStrategyProps {
  hasTaxPro: boolean;
  token: string | null;
  inputs: TaxIncomeInputs;
  comparison: TaxComparisonResult;
}
export const useIncomeTaxStrategy = ({
  hasTaxPro,
  token,
  inputs,
  comparison,
}: UseIncomeTaxStrategyProps) => {
  const [strategyLoading, setStrategyLoading] = useState<boolean>(false);
  const [strategyAdvice, setStrategyAdvice] = useState<string | null>(null);
  const [strategyQuestion, setStrategyQuestion] = useState<string>('');
  const [showUpgradeGate, setShowUpgradeGate] = useState<boolean>(false);
  const handleGenerateStrategyAdvice = async (customQuestion?: string) => {
    if (!hasTaxPro) {
      setShowUpgradeGate(true);
      return;
    }
    setStrategyLoading(true);
    setStrategyAdvice(null);
    setShowUpgradeGate(false);
    try {
      const data = await generateTaxAIAdviceAction(
        {
          financialSummary: {
            financialYear: inputs.financialYear,
            isSalaried: inputs.isSalaried,
            grossTotalIncome: comparison.newRegime.grossTotalIncome,
            newRegimeTax: comparison.newRegime.totalTaxPayable,
            oldRegimeTax: comparison.oldRegime.totalTaxPayable,
            recommendedRegime: comparison.recommendedRegime,
            taxSavings: comparison.taxSavings,
            breakevenDeductions: comparison.breakevenDeductions,
            currentDeductions: comparison.currentDeductionsClaimed,
            salary: inputs.grossSalary,
            businessIncome: inputs.businessIncome,
            equityStcg: inputs.equityStcg,
            equityLtcg: inputs.equityLtcg,
            ppfInterestExempt: inputs.ppfInterest,
            section80C: inputs.section80C,
            section80CCD1B: inputs.section80Ccd1b,
            section80D: inputs.section80D_self + inputs.section80D_parents,
          },
          userQuestion: customQuestion || strategyQuestion || undefined,
        },
        token || undefined
      );
      if (data.needsUpgrade) {
        setShowUpgradeGate(true);
      } else if (data.advice) {
        setStrategyAdvice(data.advice);
      } else {
        setStrategyAdvice(
          data.message || 'Unable to generate optimization strategy at this moment.'
        );
      }
    } catch (err) {
      setStrategyAdvice(`Unable to generate strategy report: ${String(err)}`);
    } finally {
      setStrategyLoading(false);
    }
  };
  return {
    strategyLoading,
    strategyAdvice,
    strategyQuestion,
    setStrategyQuestion,
    showUpgradeGate,
    setShowUpgradeGate,
    handleGenerateStrategyAdvice,
  };
};
