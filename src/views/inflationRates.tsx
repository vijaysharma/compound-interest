'use client';
import React from 'react';
import SEOHead from '../components/SEOHead';
import CalculatorContentSection from '../components/CalculatorContentSection';
import { inflationSchema } from '../data/seo/inflationSchema';
import {
  inflationComparisonTable,
  inflationFaqs,
  inflationKeyBenefits,
} from '../data/seo/inflationData';
import { useInflationState } from './inflation/useInflationState';
import { InflationHeader } from './inflation/InflationHeader';
import { InflationInputsCol } from './inflation/InflationInputsCol';
import { InflationResultsCol } from './inflation/InflationResultsCol';
import styles from './CalculatorPage.module.scss';
interface InflationRatesProps {
  className?: string;
  title?: string;
}
const InflationRates: React.FC<InflationRatesProps> = ({ className, title }) => {
  const {
    inflationLoading,
    inflationError,
    place,
    setPlace,
    principal,
    setPrincipal,
    startYear,
    setStartYear,
    endYear,
    setEndYear,
    endYearIsEstimate,
    inflatedAmount,
    deflatedAmount,
    currencySymbol,
    locale,
    startYearOptions,
    endYearOptions,
  } = useInflationState();
  if (inflationLoading) {
    return (
      <div className={`${styles.container} ${styles.containerWide} ${className || ''}`}>
        {title && <h5 className={styles.sectionTitle}>{title}</h5>}
        <p className={styles.infoMessage}>Loading verified inflation datasets...</p>
      </div>
    );
  }
  if (inflationError) {
    return (
      <div className={`${styles.container} ${styles.containerWide} ${className || ''}`}>
        {title && <h5 className={styles.sectionTitle}>{title}</h5>}
        <p className={styles.errorMessage}>{inflationError}</p>
      </div>
    );
  }
  return (
    <main className={`${styles.container} ${styles.containerWide} ${className || ''}`}>
      <SEOHead
        title="Inflation Calculator India — Future Value of Money & Purchasing Power 2026"
        description="Free inflation calculator with IMF historical CPI data. See how ₹1 Lakh today compares to future purchasing power. Plan retirement with real inflation projections."
        keywords="inflation calculator India, future value of money calculator, historical inflation calculator India, IMF inflation forecast, purchasing power calculator India, CPI calculator, cost of living calculator, salary purchasing power, inflation rate calculator, historical inflation calculator"
        canonicalPath="/inflation-calculator"
        schema={inflationSchema}
      />
      <InflationHeader />
      <div className={styles.calculatorGrid}>
        <InflationInputsCol
          title={title}
          principal={principal}
          setPrincipal={setPrincipal}
          place={place}
          setPlace={setPlace}
          locale={locale}
          currencySymbol={currencySymbol}
          startYear={startYear}
          endYear={endYear}
          setStartYear={setStartYear}
          setEndYear={setEndYear}
          startYearOptions={startYearOptions}
          endYearOptions={endYearOptions}
        />
        <InflationResultsCol
          place={place}
          startYear={startYear}
          endYear={endYear}
          currencySymbol={currencySymbol}
          principal={principal}
          inflatedAmount={inflatedAmount}
          deflatedAmount={deflatedAmount}
          endYearIsEstimate={endYearIsEstimate}
        />
      </div>
      <CalculatorContentSection
        title="The Hidden Wealth Destroyer: Compounding Inflation Explained"
        subtitle="Inflation represents the steady increase in the general price level of goods and services over time. Left unaddressed in fixed-cash accounts, inflation quietly erodes real wealth and retirement readiness."
        comparisonTable={inflationComparisonTable}
        keyBenefits={inflationKeyBenefits}
        faqs={inflationFaqs}
      />
    </main>
  );
};
export default InflationRates;
