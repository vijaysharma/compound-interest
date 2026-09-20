'use client';
import React from 'react';
import SEOHead from '../components/SEOHead';
import DisplayCard from '../components/DisplayCard';
import { PROPERTY_TAX_SCHEMA } from '../data/seo/propertyTaxData';
import { usePropertyTaxState } from './property-tax/usePropertyTaxState';
import { PropertyTaxInputs } from './property-tax/PropertyTaxInputs';
import { HoldingStatusCard } from './property-tax/HoldingStatusCard';
import { VerdictBanner } from './property-tax/VerdictBanner';
import { RegimeComparisonGrid } from './property-tax/RegimeComparisonGrid';
import { AccountingAuditTable } from './property-tax/AccountingAuditTable';
import { PropertyTaxContent } from './property-tax/PropertyTaxContent';
import calcStyles from './CalculatorPage.module.scss';
export default function PropertyTaxCalculatorView() {
  const {
    purchaseDate, handlePurchaseDateChange,
    purchasePrice, setPurchasePrice,
    saleDate, handleSaleDateChange,
    salePrice, setSalePrice,
    transferExpenses, setTransferExpenses,
    improvementCost, setImprovementCost,
    improvementYear, setImprovementYear,
    sec54Exemption, setSec54Exemption,
    sec54ecExemption, setSec54ecExemption,
    stcgSlabRate, setStcgSlabRate,
    comparison, recommendedTax,
  } = usePropertyTaxState();
  const getDisplayCardTitle = () => {
    if (!comparison.isLongTerm) return 'STCG Tax Payable';
    return comparison.recommendedOption === 'old'
      ? 'Tax Payable (Old Rule with Indexation)'
      : 'Tax Payable (New Rule 12.5% Flat)';
  };
  return (
    <main className={calcStyles.container}>
      <SEOHead
        title="Property Capital Gains Tax Calculator India 2026 — 20% vs 12.5% Old vs New Rule"
        description="Calculate real estate long-term capital gains tax under Finance Act 2024. Compare 20% with Cost Inflation Index (CII) indexation against 12.5% flat tax with Section 54 & 54EC exemptions."
        keywords="property capital gains tax calculator, real estate capital gains tax India, old vs new LTCG property, indexation calculator real estate, section 54 exemption calculator, section 54EC bonds calculator, budget 2024 property tax amendment"
        canonicalPath="/property-tax-calculator"
        schema={PROPERTY_TAX_SCHEMA}
      />
      <header className={calcStyles.header}>
        <div className={calcStyles.badge}>Finance Act 2024 Grandfathering Clause</div>
        <h1 className={calcStyles.title}>Property Capital Gains Tax Calculator</h1>
        <p className={calcStyles.subtitle}>
          Compare real estate capital gains tax under the <strong>Old Rule (20% with CII Indexation)</strong> versus{' '}
          <strong>New Rule (12.5% flat without Indexation)</strong>. Find out which regime saves you more tax under the latest Budget 2024 amendments.
        </p>
      </header>
      <div className={calcStyles.calculatorGrid}>
        <PropertyTaxInputs
          purchaseDate={purchaseDate}
          onPurchaseDateChange={handlePurchaseDateChange}
          saleDate={saleDate}
          onSaleDateChange={handleSaleDateChange}
          purchasePrice={purchasePrice}
          onPurchasePriceChange={setPurchasePrice}
          salePrice={salePrice}
          onSalePriceChange={setSalePrice}
          transferExpenses={transferExpenses}
          onTransferExpensesChange={setTransferExpenses}
          improvementCost={improvementCost}
          onImprovementCostChange={setImprovementCost}
          improvementYear={improvementYear}
          onImprovementYearChange={setImprovementYear}
          sec54Exemption={sec54Exemption}
          onSec54ExemptionChange={setSec54Exemption}
          sec54ecExemption={sec54ecExemption}
          onSec54ecExemptionChange={setSec54ecExemption}
          isLongTerm={comparison.isLongTerm}
          stcgSlabRate={stcgSlabRate}
          onStcgSlabRateChange={setStcgSlabRate}
        />
        <div className={calcStyles.resultsCol}>
          <DisplayCard
            primaryAmount={recommendedTax}
            title={getDisplayCardTitle()}
          />
          <HoldingStatusCard comparison={comparison} />
          <VerdictBanner comparison={comparison} />
          <RegimeComparisonGrid comparison={comparison} />
          <AccountingAuditTable
            salePrice={salePrice}
            transferExpenses={transferExpenses}
            purchasePrice={purchasePrice}
            improvementCost={improvementCost}
            sec54Exemption={sec54Exemption}
            sec54ecExemption={sec54ecExemption}
            comparison={comparison}
          />
        </div>
      </div>
      <PropertyTaxContent />
    </main>
  );
}
