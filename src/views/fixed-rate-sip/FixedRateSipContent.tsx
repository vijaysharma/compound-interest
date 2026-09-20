import React from 'react';
import CalculatorContentSection from '../../components/CalculatorContentSection';
import {
  sipComparisonTable,
  sipKeyBenefits,
  sipFaqs,
} from '../../data/seo/fixedRateSipData';
export const FixedRateSipContent: React.FC = () => {
  return (
    <CalculatorContentSection
      title="The Compounding Science of Systematic Investment Plans (SIP)"
      subtitle="A Systematic Investment Plan (SIP) enables disciplined retail investors to invest fixed sums regularly into equity and hybrid mutual funds. By combining compounding returns with rupee cost averaging, SIPs are India's premier vehicle for long-term wealth creation."
      comparisonTable={sipComparisonTable}
      keyBenefits={sipKeyBenefits}
      faqs={sipFaqs}
    />
  );
};
