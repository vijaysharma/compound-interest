'use client';
import React from 'react';
import SEOHead from '../components/SEOHead';
import CalculatorContentSection from '../components/CalculatorContentSection';
import { pppSchema } from '../data/seo/pppSchema';
import { pppComparisonTable, pppFaqs, pppKeyBenefits } from '../data/seo/pppData';
import { usePPPState } from './ppp/usePPPState';
import { PPPHeader } from './ppp/PPPHeader';
import { PPPInputsCol } from './ppp/PPPInputsCol';
import { PPPResultsCol } from './ppp/PPPResultsCol';
import styles from './CalculatorPage.module.scss';
interface PPPExchangeRateProps {
  className?: string;
  title?: string;
}
const PPPExchangeRate: React.FC<PPPExchangeRateProps> = ({ className, title }) => {
  const {
    data,
    pppLoading,
    pppError,
    srcCountry,
    setSrcCountry,
    tgtCountry,
    setTgtCountry,
    srcAmt,
    setSrcAmt,
    derivedValues,
    handleSwapCountries,
  } = usePPPState();
  if (pppLoading && Object.keys(data).length === 0) {
    return (
      <div className={`${styles.container} ${styles.containerWide} ${className || ''}`}>
        {title && <h5 className={styles.sectionTitle}>{title}</h5>}
        <p className={styles.infoMessage}>Loading global World Bank purchasing power datasets...</p>
      </div>
    );
  }
  if (pppError && Object.keys(data).length === 0) {
    return (
      <div className={`${styles.container} ${styles.containerWide} ${className || ''}`}>
        {title && <h5 className={styles.sectionTitle}>{title}</h5>}
        <p className={styles.errorMessage}>{pppError}</p>
      </div>
    );
  }
  const tgtExAmt = derivedValues?.tgtExAmt ?? 0;
  return (
    <main className={`${styles.container} ${styles.containerWide} ${className || ''}`}>
      <SEOHead
        title="PPP Calculator — Purchasing Power Parity & Salary Comparison India 2026"
        description="Compare salaries and living costs across 150+ countries using World Bank PPP data. Convert Indian Rupee salary to real USD/EUR purchasing power equivalent. 100% free."
        keywords="purchasing power parity calculator, PPP calculator India to USA, salary comparison PPP, cost of living converter, World Bank PPP conversion, India US salary comparison, cost of living calculator, salary purchasing power, PPP conversion factor"
        canonicalPath="/ppp-calculator"
        schema={pppSchema}
      />
      <PPPHeader />
      <div className={styles.calculatorGrid}>
        <PPPInputsCol
          title={title}
          data={data}
          srcCountry={srcCountry}
          tgtCountry={tgtCountry}
          setSrcCountry={setSrcCountry}
          setTgtCountry={setTgtCountry}
          handleSwapCountries={handleSwapCountries}
          srcAmt={srcAmt}
          setSrcAmt={setSrcAmt}
          sourceLocale={derivedValues?.sourceLocale}
          sourceCurrencySymbol={derivedValues?.sourceCurrencySymbol}
        />
        <PPPResultsCol
          tgtAmt={derivedValues?.tgtAmt || '0'}
          primarySub={derivedValues?.primarySub || ''}
          targetCurrencySymbol={derivedValues?.targetCurrencySymbol || 'XYZ'}
          targetLocale={derivedValues?.targetLocale || 'en-US'}
          tgtCountry={tgtCountry}
          tgtExAmt={tgtExAmt}
        />
      </div>
      <CalculatorContentSection
        title="Why Purchasing Power Parity (PPP) Matters for Global Salaries"
        subtitle="Market exchange rates fluctuate based on capital flows and central bank policies, failing to capture true local living costs. Purchasing Power Parity (PPP) calculates the real cost of rent, healthcare, food, and daily essentials across nations."
        comparisonTable={pppComparisonTable}
        keyBenefits={pppKeyBenefits}
        faqs={pppFaqs}
      />
    </main>
  );
};
export default PPPExchangeRate;
