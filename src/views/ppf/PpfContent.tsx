import React from 'react';
import CalculatorContentSection from '../../components/CalculatorContentSection';
import { ppfComparisonTable, ppfFaqs } from '../../data/seo/ppfData';
export function PpfContent() {
  return (
    <CalculatorContentSection
      title="Understanding the Public Provident Fund (PPF) Rules &amp; Compounding"
      subtitle="Launched in 1968 by the National Savings Institute of the Ministry of Finance, PPF is one of India's most secure and tax-efficient wealth accumulation instruments backed by sovereign guarantee."
      comparisonTable={ppfComparisonTable}
      faqs={ppfFaqs}
    />
  );
}
