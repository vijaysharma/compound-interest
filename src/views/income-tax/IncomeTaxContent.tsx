import React from 'react';
import CalculatorContentSection from '../../components/CalculatorContentSection';
import { taxComparisonTable, taxFaqs } from '../../data/seo/incomeTaxData';
export const IncomeTaxContent: React.FC = () => {
  return (
    <CalculatorContentSection
      title="Old vs New Tax Regime: Key Differences &amp; Budget 2024 Changes"
      subtitle="The Finance Act 2024 introduced major structural adjustments to the New Tax Regime, enhancing standard deduction and expanding tax slabs to offer greater relief to Indian taxpayers."
      comparisonTable={taxComparisonTable}
      faqs={taxFaqs}
    />
  );
};
