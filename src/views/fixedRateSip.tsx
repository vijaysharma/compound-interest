'use client';
import React from 'react';
import SEOHead from '../components/SEOHead';
import { sipSchema } from '../data/seo/fixedRateSipData';
import { useFixedRateSip } from './fixed-rate-sip/useFixedRateSip';
import { FixedRateSipInputs } from './fixed-rate-sip/FixedRateSipInputs';
import { FixedRateSipResults } from './fixed-rate-sip/FixedRateSipResults';
import { FixedRateSipContent } from './fixed-rate-sip/FixedRateSipContent';
import styles from './CalculatorPage.module.scss';
interface FixedRateSIPProps {
  className?: string;
  title?: string;
}
const FixedRateSIP: React.FC<FixedRateSIPProps> = ({ className, title }) => {
  const {
    pa,
    setPa,
    rt,
    setRt,
    invType,
    setInvType,
    payoutAmount,
    totalInvested,
    estimatedReturns,
    investedPercent,
  } = useFixedRateSip();
  return (
    <main className={`${styles.container} ${styles.containerWide} ${className || ''}`}>
      <SEOHead
        title="SIP Calculator — Free Mutual Fund SIP Return Calculator India 2026"
        description="Calculate SIP returns with step-up SIP & target corpus planning. Estimate mutual fund growth for ₹500–₹1 Lakh monthly SIP over 1–35 years. 100% free & private."
        keywords="SIP calculator, systematic investment plan calculator, mutual fund return calculator, step up SIP calculator, best SIP calculator India, SIP maturity calculator, mutual fund calculator, investment calculator, future value calculator, CAGR calculator, MF calculator, how to calculate SIP returns, SIP vs lump sum"
        canonicalPath="/sip-calculator"
        schema={sipSchema}
      />
      <header className={styles.header}>
        <div className={styles.badge}>Compounding Engine &bull; Wealth Accumulation</div>
        <h1 className={styles.title}>
          Mutual Fund SIP Calculator India (Systematic Investment Plan)
        </h1>
        <p className={styles.subtitle}>
          Simulate compound growth, total maturity corpus, and required monthly investment targets.
        </p>
      </header>
      <div className={styles.calculatorGrid}>
        <FixedRateSipInputs
          title={title}
          pa={pa}
          setPa={setPa}
          rt={rt}
          setRt={setRt}
          invType={invType}
          setInvType={setInvType}
        />
        <FixedRateSipResults
          payoutAmount={payoutAmount}
          invType={invType}
          rt={rt}
          totalInvested={totalInvested}
          estimatedReturns={estimatedReturns}
          investedPercent={investedPercent}
        />
      </div>
      <FixedRateSipContent />
    </main>
  );
};
export default FixedRateSIP;
