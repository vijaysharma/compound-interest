'use client';
import React from 'react';
import SEOHead from '../components/SEOHead';
import { swpSchema } from '../data/seo/fixedRateSwpData';
import { useFixedRateSwp } from './fixed-rate-swp/useFixedRateSwp';
import { FixedRateSwpInputs } from './fixed-rate-swp/FixedRateSwpInputs';
import { FixedRateSwpResults } from './fixed-rate-swp/FixedRateSwpResults';
import { FixedRateSwpContent } from './fixed-rate-swp/FixedRateSwpContent';
import styles from './CalculatorPage.module.scss';
interface FixedRateSWPProps {
  className?: string;
  title?: string;
}
const FixedRateSWP: React.FC<FixedRateSWPProps> = ({ className, title }) => {
  const {
    pa,
    setPa,
    rt,
    setRt,
    irt,
    setIRt,
    t,
    setT,
    wa,
    setWa,
    inflationFreq,
    setInflationFreq,
    lwa,
    initialInvested,
    finalCorpus,
    approxWithdrawn,
  } = useFixedRateSwp();
  return (
    <main className={`${styles.container} ${styles.containerWide} ${className || ''}`}>
      <SEOHead
        title="SWP Calculator — Systematic Withdrawal Plan Calculator India 2026"
        description="Free SWP calculator to plan retirement income. Model monthly pension withdrawals, inflation-adjusted cashflows & corpus longevity from mutual funds. 100% private."
        keywords="SWP calculator, systematic withdrawal plan calculator, monthly pension calculator, retirement withdrawal calculator India, safe withdrawal rate India, retirement calculator, annuity calculator, retirement planning, safe withdrawal rate"
        canonicalPath="/swp-calculator"
        schema={swpSchema}
      />
      <header className={styles.header}>
        <div className={styles.badge}>Retirement Income &bull; Capital Longevity</div>
        <h1 className={styles.title}>Systematic Withdrawal Plan (SWP) Calculator for Retirement</h1>
        <p className={styles.subtitle}>
          Simulate monthly retirement payouts, inflation adjustments, and residual portfolio
          longevity.
        </p>
      </header>
      <div className={styles.calculatorGrid}>
        <FixedRateSwpInputs
          title={title}
          pa={pa}
          setPa={setPa}
          wa={wa}
          setWa={setWa}
          rt={rt}
          setRt={setRt}
          t={t}
          setT={setT}
          irt={irt}
          setIRt={setIRt}
          inflationFreq={inflationFreq}
          setInflationFreq={setInflationFreq}
        />
        <FixedRateSwpResults
          t={t}
          rt={rt}
          initialInvested={initialInvested}
          approxWithdrawn={approxWithdrawn}
          finalCorpus={finalCorpus}
          lwa={lwa}
        />
      </div>
      <FixedRateSwpContent />
    </main>
  );
};
export default FixedRateSWP;
