'use client';
import { useState } from 'react';
import DisplayCard from '../components/DisplayCard';
import type { RT } from '../types/types';
import SEOHead from '../components/SEOHead';
import { rdSchema } from '../data/seo/rdData';
import { useRdCalculations } from './rd/useRdCalculations';
import { RdInputs } from './rd/RdInputs';
import { RdSummaryCard } from './rd/RdSummaryCard';
import { RdTaxCard } from './rd/RdTaxCard';
import { RdContent } from './rd/RdContent';
import styles from './CalculatorPage.module.scss';
interface RdProps {
  className?: string;
  title?: string;
}
const RD = ({ className, title }: RdProps) => {
  const [pa, setPa] = useState('10000');
  const [rt, setRt] = useState<RT>({ roi: '7.1', tenure: '5', tenureFormat: 'y' });
  const [invType, setInvType] = useState('my');
  const [taxSlab, setTaxSlab] = useState<number>(30);
  const [isSeniorCitizen, setIsSeniorCitizen] = useState<boolean>(false);
  const {
    payoutAmount, totalDeposited, totalInterestEarned, depositPercent, taxAnalysis,
  } = useRdCalculations(pa, rt, invType, taxSlab, isSeniorCitizen);
  return (
    <main className={`${styles.container} ${styles.containerWide} ${className || ''}`}>
      <SEOHead
        title="RD Calculator — Recurring Deposit Maturity & Interest Calculator India 2026"
        description="Free recurring deposit calculator for Indian banks & Post Office RD. Calculate RD maturity amount with quarterly compounding. Compare RD vs FD vs SIP returns."
        keywords="RD calculator, recurring deposit calculator, post office RD calculator, bank RD interest rate, monthly deposit calculator India, compound interest calculator RD, post office RD interest rate, RD vs FD, how to calculate RD maturity"
        canonicalPath="/rd-calculator"
        schema={rdSchema}
      />
      <header className={styles.header}>
        <div className={styles.badge}>Disciplined Savings &bull; Guaranteed Returns</div>
        <h1 className={styles.title}>Recurring Deposit (RD) Calculator India</h1>
        <p className={styles.subtitle}>
          Calculate maturity values, total interest yield, and compound returns on monthly recurring deposits.
        </p>
      </header>
      <div className={styles.calculatorGrid}>
        <RdInputs
          title={title}
          pa={pa}
          setPa={setPa}
          rt={rt}
          setRt={setRt}
          invType={invType}
          setInvType={setInvType}
        />
        <div className={styles.resultsCol}>
          <DisplayCard
            primaryAmount={payoutAmount}
            title={invType === 'tgt' ? 'Monthly investment required' : 'Maturity amount'}
          />
          <RdSummaryCard
            rt={rt}
            totalDeposited={totalDeposited}
            totalInterestEarned={totalInterestEarned}
            depositPercent={depositPercent}
          />
        </div>
      </div>
      <RdTaxCard
        isSeniorCitizen={isSeniorCitizen}
        setIsSeniorCitizen={setIsSeniorCitizen}
        taxSlab={taxSlab}
        setTaxSlab={setTaxSlab}
        taxAnalysis={taxAnalysis}
      />
      <RdContent />
    </main>
  );
};
export default RD;
