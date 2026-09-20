'use client';
import React, { useState } from 'react';
import DisplayCard from '../components/DisplayCard';
import ValuePicker from '../components/ValuePicker';
import JoinedButtonGroup from '../components/JoinedButtonGroup';
import type { RT } from '../types/types';
import { FREQUENCY_DATA, PA, PAYOUT_MODE_DATA, RATE_TENURE } from '../data/default_data';
import SEOHead from '../components/SEOHead';
import { fdSchema } from '../data/seo/fdData';
import { useFdCalculations } from './fd/useFdCalculations';
import { FdInputs } from './fd/FdInputs';
import { FdSummaryCard } from './fd/FdSummaryCard';
import { FdTaxCard } from './fd/FdTaxCard';
import { FdContent } from './fd/FdContent';
import styles from './CalculatorPage.module.scss';
const FD: React.FC = () => {
  const [pa, setPa] = useState(PA);
  const [rt, setRt] = useState<RT>(RATE_TENURE);
  const [mode, setMode] = useState('1');
  const [frequency, setFrequency] = useState('4');
  const [invType, setInvType] = useState('inv');
  const [taxSlab, setTaxSlab] = useState<number>(30);
  const [isSeniorCitizen, setIsSeniorCitizen] = useState<boolean>(false);
  const {
    payoutAmount,
    principalDeposit,
    totalInterestEarned,
    principalPercent,
    taxAnalysis,
    selectedPayoutTitle,
  } = useFdCalculations(pa, rt, mode, frequency, invType, taxSlab, isSeniorCitizen);
  return (
    <main className={styles.container}>
      <SEOHead
        title="Compound Interest Calculator & FD Calculator — Fixed Deposit India 2026"
        description="Free compound interest calculator for Indian fixed deposits. Calculate FD maturity with daily, monthly & quarterly compounding. Compare cumulative vs non-cumulative FD returns."
        keywords="compound interest calculator India, FD calculator, fixed deposit calculator, quarterly compounding calculator, bank FD interest rate, FD maturity calculator, daily compound interest calculator, monthly compound interest calculator, maturity calculator, interest rate calculator savings, compound interest formula, savings calculator"
        canonicalPath="/fd-calculator"
        schema={fdSchema}
      />
      <header className={styles.header}>
        <div className={styles.badge}>Fixed Income &bull; Guaranteed Returns</div>
        <h1 className={styles.title}>
          Compound Interest Calculator &amp; Fixed Deposit (FD) Calculator India
        </h1>
        <p className={styles.subtitle}>
          Simulate cumulative maturity amounts, periodic payout yields, and compound growth with
          institutional precision.
        </p>
      </header>
      <div className={styles.calculatorGrid}>
        <FdInputs
          pa={pa}
          setPa={setPa}
          rt={rt}
          setRt={setRt}
          invType={invType}
          setInvType={setInvType}
        />
        <div className={styles.resultsCol}>
          <ValuePicker
            variant="paired"
            sourceBadgeText="Compounded"
            targetBadgeText="Payment Mode"
            sourceSlot={
              <JoinedButtonGroup
                className={styles.field}
                data={FREQUENCY_DATA}
                sizePrefix="xs"
                selectedValue={frequency}
                updateSelectedValue={setFrequency}
              />
            }
            targetSlot={
              invType === 'inv' && (
                <JoinedButtonGroup
                  className={styles.fieldLast}
                  data={PAYOUT_MODE_DATA}
                  sizePrefix="xs"
                  selectedValue={mode}
                  updateSelectedValue={setMode}
                />
              )
            }
          />
          <DisplayCard
            primaryAmount={payoutAmount}
            title={invType === 'tgt' ? 'Lumpsum amount required' : `${selectedPayoutTitle} Payout`}
          />
          <FdSummaryCard
            mode={mode}
            selectedPayoutTitle={selectedPayoutTitle}
            rt={rt}
            principalDeposit={principalDeposit}
            totalInterestEarned={totalInterestEarned}
            principalPercent={principalPercent}
          />
        </div>
      </div>
      <FdTaxCard
        mode={mode}
        selectedPayoutTitle={selectedPayoutTitle}
        isSeniorCitizen={isSeniorCitizen}
        setIsSeniorCitizen={setIsSeniorCitizen}
        taxSlab={taxSlab}
        setTaxSlab={setTaxSlab}
        invType={invType}
        taxAnalysis={taxAnalysis}
        payoutAmount={payoutAmount}
        totalInterestEarned={totalInterestEarned}
      />
      <FdContent />
    </main>
  );
};
export default FD;
