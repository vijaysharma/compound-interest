import React from 'react';
import CalculatorContentSection from '../../components/CalculatorContentSection';
import { npsFaqs, npsComparisonTable } from '../../data/seo/npsData';
export function NpsContent() {
  return (
    <CalculatorContentSection
      title="Comprehensive National Pension System (NPS) Guide"
      subtitle="Instituted by the Pension Fund Regulatory and Development Authority (PFRDA), NPS is an ultra-low-cost, government-regulated defined-contribution pension scheme created to secure the post-retirement lives of Indian citizens."
      comparisonTable={npsComparisonTable}
      faqs={npsFaqs}
    />
  );
}
