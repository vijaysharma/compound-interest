import React from 'react';
import CalculatorContentSection from '../../components/CalculatorContentSection';
import { PROPERTY_TAX_FAQS } from '../../data/seo/propertyTaxData';
const keyBenefits = [
  {
    title: 'Finance Act 2024 Grandfathering',
    description: 'Resident taxpayers who purchased property before 23 July 2024 can compute tax under both 20% with indexation and 12.5% without indexation, legally paying whichever is lower.',
  },
  {
    title: 'Official CII Cost Indexation',
    description: 'Adjust your acquisition and improvement costs for inflation using the official CBDT Cost Inflation Index table dating back to 2001-02 (Base: 100).',
  },
  {
    title: 'Section 54 & 54EC Optimisation',
    description: 'Save up to 100% of your capital gains tax by reinvesting in a residential property (up to ₹10 Cr) or Section 54EC capital gains bonds (up to ₹50 Lakhs).',
  },
  {
    title: '100% Private & Client-Side',
    description: 'All calculations run entirely in your browser. Your property purchase price, sale deed numbers, and tax figures are never saved or sent to any server.',
  },
];
export function PropertyTaxContent() {
  return (
    <CalculatorContentSection
      title="Comprehensive Real Estate Capital Gains Tax Guide"
      subtitle="Master the Budget 2024 property tax rules, CII indexation mechanism, and Section 54 reinvestment strategies."
      keyBenefits={keyBenefits}
      faqs={PROPERTY_TAX_FAQS}
    />
  );
}
