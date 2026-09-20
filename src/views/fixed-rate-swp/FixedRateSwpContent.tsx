import React from 'react';
import CalculatorContentSection from '../../components/CalculatorContentSection';
import {
  swpComparisonTable,
  swpKeyBenefits,
  swpFaqs,
} from '../../data/seo/fixedRateSwpData';
export const FixedRateSwpContent: React.FC = () => {
  return (
    <CalculatorContentSection
      title="Mastering Sustainable Retirement Cashflows with SWP"
      subtitle="A Systematic Withdrawal Plan (SWP) is a modern financial strategy that allows retirees and wealth planners to generate regular monthly income from an accumulated mutual fund corpus while keeping remaining capital invested in compounding assets."
      comparisonTable={swpComparisonTable}
      keyBenefits={swpKeyBenefits}
      faqs={swpFaqs}
    />
  );
};
