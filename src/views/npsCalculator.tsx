'use client';
import React from 'react';
import { FiShield } from 'react-icons/fi';
import SEOHead from '../components/SEOHead';
import { npsSchema } from '../data/seo/npsData';
import { useNpsState } from './nps/useNpsState';
import { NpsInputs } from './nps/NpsInputs';
import { NpsSummaryCol } from './nps/NpsSummaryCol';
import { NpsScheduleTable } from './nps/NpsScheduleTable';
import { NpsContent } from './nps/NpsContent';
import styles from './NpsCalculator.module.scss';
const NpsCalculator: React.FC = () => {
  const {
    currentAge, setCurrentAge,
    retirementAge, setRetirementAge,
    monthlyContribution, setMonthlyContribution,
    hasEmployerContribution, setHasEmployerContribution,
    employerMonthly, setEmployerMonthly,
    expectedRoi, setExpectedRoi,
    setAnnuityPercent,
    annuityRate, setAnnuityRate,
    npsResult, wealthMultiple,
  } = useNpsState();
  return (
    <main className={styles.container}>
      <SEOHead
        title="NPS Calculator India — Retirement Pension & Corpus Planner | Rupee Calculator"
        description="Calculate your National Pension System (NPS) Tier-1 retirement corpus, 40% mandatory annuity, 60% tax-free lump sum withdrawal, and monthly pension payout."
        keywords="NPS calculator, national pension system calculator, retirement calculator India, pension calculator India, 80CCD 1B calculator, annuity calculator, lump sum withdrawal NPS, PFRDA pension"
        canonicalPath="/nps-calculator"
        schema={npsSchema}
      />
      <header className={styles.header}>
        <div className={styles.badge}>
          <FiShield className={styles.badgeIcon} />
          PFRDA Regulated &bull; Section 80CCD &bull; Retirement Security
        </div>
        <h1 className={styles.title}>NPS Calculator (National Pension System)</h1>
        <p className={styles.subtitle}>
          Model your long-term retirement wealth accumulation, mandatory 40% annuity purchase, 60%
          tax-free lump sum withdrawal, and estimated monthly pension.
        </p>
      </header>
      <div className={styles.formGrid}>
        <NpsInputs
          currentAge={currentAge}
          setCurrentAge={setCurrentAge}
          retirementAge={retirementAge}
          setRetirementAge={setRetirementAge}
          monthlyContribution={monthlyContribution}
          setMonthlyContribution={setMonthlyContribution}
          hasEmployerContribution={hasEmployerContribution}
          setHasEmployerContribution={setHasEmployerContribution}
          employerMonthly={employerMonthly}
          setEmployerMonthly={setEmployerMonthly}
          expectedRoi={expectedRoi}
          setExpectedRoi={setExpectedRoi}
          setAnnuityPercent={setAnnuityPercent}
          annuityRate={annuityRate}
          setAnnuityRate={setAnnuityRate}
          npsResult={npsResult}
        />
        <NpsSummaryCol
          npsResult={npsResult}
          retirementAge={retirementAge}
        />
      </div>
      <NpsScheduleTable
        currentAge={currentAge}
        retirementAge={retirementAge}
        wealthMultiple={wealthMultiple}
        yearlyBreakdown={npsResult.yearlyBreakdown}
      />
      <NpsContent />
    </main>
  );
};
export default NpsCalculator;
