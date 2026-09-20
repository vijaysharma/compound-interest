import React from 'react';
import CalculatorContentSection from '../../components/CalculatorContentSection';
import {
  emiComparisonTable,
  emiKeyBenefits,
  emiFaqs,
} from '../../data/seo/emiData';
export const EmiContent: React.FC = () => {
  return (
    <CalculatorContentSection
      title="Understanding Loan Amortization & Smart Prepayment Strategies"
      subtitle="An Equated Monthly Installment (EMI) consists of two components: the interest on the outstanding loan balance and the principal repayment. In the initial years of a loan, up to 75% of your EMI goes toward interest rather than principal reduction."
      comparisonTable={emiComparisonTable}
      keyBenefits={emiKeyBenefits}
      faqs={emiFaqs}
    />
  );
};
