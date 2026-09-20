'use client';
import React from 'react';
import SEOHead from '../components/SEOHead';
import { emiSchema } from '../data/seo/emiData';
import { useEmiState } from './emi/useEmiState';
import { EmiInputs } from './emi/EmiInputs';
import { EmiLoanAnalytics } from './emi/EmiLoanAnalytics';
import { EmiPartPaymentsCard } from './emi/EmiPartPaymentsCard';
import { EmiRateChangesCard } from './emi/EmiRateChangesCard';
import { EmiScheduleSection } from './emi/EmiScheduleSection';
import { EmiContent } from './emi/EmiContent';
import styles from './EmiCalculator.module.scss';
const EmiCalculator: React.FC = () => {
  const {
    loanAmount,
    setLoanAmount,
    rt,
    setRt,
    disbursementDate,
    emiDate,
    setEmiDate,
    partPayments,
    rateChanges,
    includePrincipalInFirstEmi,
    setIncludePrincipalInFirstEmi,
    principalAmount,
    tenureMonths,
    baseMonthlyEmi,
    scheduleResult,
    totalInterest,
    totalPayable,
    principalPercent,
    interestPercent,
    pieSlices,
    isAddPartPaymentDisabled,
    addPartPayment,
    removePartPayment,
    updatePartPayment,
    isAddRateChangeDisabled,
    addRateChange,
    removeRateChange,
    updateRateChange,
    handleDisbursementDateChange,
  } = useEmiState();
  return (
    <main className={styles.container}>
      <SEOHead
        title="EMI Calculator — Home Loan, Car & Personal Loan EMI Calculator India 2026"
        description="Free online EMI calculator for home loan, car loan & personal loan. Full amortization schedule with part-payment modeling & floating rate simulation. 100% private."
        keywords="EMI calculator, home loan EMI calculator, loan amortization schedule India, prepayment EMI calculator, part payment home loan calculator, personal loan EMI, car loan EMI calculator, education loan calculator, loan calculator, amortization calculator, EMI calculation formula, how to calculate EMI"
        canonicalPath="/emi-calculator"
        schema={emiSchema}
      />
      <header className={styles.header}>
        <div className={styles.badge}>Loan Intelligence &bull; Amortization Engine</div>
        <h1 className={styles.title}>Home &amp; Personal Loan EMI Calculator India</h1>
        <p className={styles.subtitle}>
          Calculate equated monthly installments, model lump-sum prepayments, and simulate floating
          rate adjustments.
        </p>
      </header>
      <div className={styles.calculatorGrid}>
        <EmiInputs
          loanAmount={loanAmount}
          setLoanAmount={setLoanAmount}
          rt={rt}
          setRt={setRt}
          disbursementDate={disbursementDate}
          onDisbursementDateChange={handleDisbursementDateChange}
          emiDate={emiDate}
          setEmiDate={setEmiDate}
          includePrincipalInFirstEmi={includePrincipalInFirstEmi}
          setIncludePrincipalInFirstEmi={setIncludePrincipalInFirstEmi}
        />
        <EmiLoanAnalytics
          principalAmount={principalAmount}
          totalInterest={totalInterest}
          totalPayable={totalPayable}
          principalPercent={principalPercent}
          interestPercent={interestPercent}
          tenureMonths={tenureMonths}
          regularEmisCount={scheduleResult.regularEmisCount}
          partPaymentsCount={scheduleResult.partPaymentsCount}
          totalPaymentsCount={scheduleResult.totalPaymentsCount}
          pieSlices={pieSlices}
          scheduleLength={scheduleResult.rows.length}
          hasEmiAdjustment={scheduleResult.hasEmiAdjustment}
          currentEmi={scheduleResult.currentEmi}
          baseMonthlyEmi={baseMonthlyEmi}
        />
      </div>
      <div className={styles.modifiersGrid}>
        <EmiPartPaymentsCard
          partPayments={partPayments}
          onAddPartPayment={addPartPayment}
          isAddPartPaymentDisabled={isAddPartPaymentDisabled}
          onRemovePartPayment={removePartPayment}
          onUpdatePartPayment={updatePartPayment}
          disbursementDate={disbursementDate}
        />
        <EmiRateChangesCard
          rateChanges={rateChanges}
          onAddRateChange={addRateChange}
          isAddRateChangeDisabled={isAddRateChangeDisabled}
          onRemoveRateChange={removeRateChange}
          onUpdateRateChange={updateRateChange}
          disbursementDate={disbursementDate}
        />
      </div>
      <EmiScheduleSection schedule={scheduleResult.rows} />
      <EmiContent />
    </main>
  );
};
export default EmiCalculator;
