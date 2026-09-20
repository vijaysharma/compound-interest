'use client';
import React from 'react';
import { useNavigate } from '@/navigation';
import { useAuth } from '../context/useAuth';
import { FiShield } from 'react-icons/fi';
import SEOHead from '../components/SEOHead';
import { getAssessmentYear } from '../utilities/incomeTaxCalculations';
import { getCurrencySymbol } from '../utilities/currency';
import { taxSchema } from '../data/seo/incomeTaxData';
import { useIncomeTaxInputs } from './income-tax/useIncomeTaxInputs';
import { useIncomeTaxStrategy } from './income-tax/useIncomeTaxStrategy';
import { TaxInputsCol } from './income-tax/TaxInputsCol';
import { TaxResultsCol } from './income-tax/TaxResultsCol';
import { IncomeTaxContent } from './income-tax/IncomeTaxContent';
import styles from './IncomeTaxCalculator.module.scss';
const IncomeTaxCalculator: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const currencySymbol = getCurrencySymbol('en-IN', 'INR');
  const hasTaxPro = Boolean(
    user?.role === 'admin' ||
    user?.subscription_plan === 'tax_monthly' ||
    user?.subscription_plan === 'tax_yearly'
  );
  const taxInputs = useIncomeTaxInputs();
  const { inputs, comparison } = taxInputs;
  const strategy = useIncomeTaxStrategy({
    hasTaxPro,
    token,
    inputs,
    comparison,
  });
  return (
    <main className={styles.container}>
      <SEOHead
        title={`Income Tax Calculator FY ${taxInputs.financialYear} (${getAssessmentYear(taxInputs.financialYear)}) — Old vs New Tax Regime | Rupee Calculator`}
        description={`Calculate & compare income tax under Old vs New Tax Regime for FY ${taxInputs.financialYear} (${getAssessmentYear(taxInputs.financialYear)}) with latest slabs, capital gains rules, PPF exemption, breakeven deductions, and Tax Strategy Advisory.`}
        keywords="income tax calculator, old vs new tax regime, tax calculator, Section 87A rebate, standard deduction, capital gains tax calculator, tax strategy advisory India, income tax slab"
        canonicalPath="/income-tax-calculator"
        schema={taxSchema}
      />
      <header className={styles.header}>
        <div className={styles.badge}>
          <FiShield className={styles.shieldIcon} />
          Income Tax Department of India &bull; Budget Updates &bull; Strategy Engine
        </div>
        <h1 className={styles.title}>Income Tax Calculator &amp; Optimizer</h1>
        <p className={styles.subtitle}>
          Compare Old vs New Tax Regime for FY {taxInputs.financialYear} ({getAssessmentYear(taxInputs.financialYear)}), model multiple income sources
          (Salary, Business, Rental, Capital Gains, PPF), and discover the best way to optimize your
          taxes.
        </p>
      </header>
      <div className={styles.taxMainGrid}>
        <TaxResultsCol
          comparison={comparison}
          isSalaried={taxInputs.isSalaried}
          currencySymbol={currencySymbol}
          hasTaxPro={hasTaxPro}
          strategyLoading={strategy.strategyLoading}
          strategyAdvice={strategy.strategyAdvice}
          strategyQuestion={strategy.strategyQuestion}
          setStrategyQuestion={strategy.setStrategyQuestion}
          showUpgradeGate={strategy.showUpgradeGate}
          onGenerateAdvice={strategy.handleGenerateStrategyAdvice}
          onUpgrade={() => navigate('/upgrade?plan=tax_monthly')}
        />
        <TaxInputsCol
          taxState={taxInputs}
          currencySymbol={currencySymbol}
          onNavigateFileItr={() => navigate('/file-itr')}
        />
      </div>
      <IncomeTaxContent />
    </main>
  );
};
export default IncomeTaxCalculator;
