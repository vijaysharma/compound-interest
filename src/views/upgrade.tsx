'use client';
import React from 'react';
import SEOHead from '../components/SEOHead';
import { useUpgradePayment } from './upgrade/useUpgradePayment';
import { UpgradeHeader } from './upgrade/UpgradeHeader';
import { TrialBanner } from './upgrade/TrialBanner';
import { DeveloperLetterCard } from './upgrade/DeveloperLetterCard';
import { PricingPlansGrid } from './upgrade/PricingPlansGrid';
import styles from './Upgrade.module.scss';
const Upgrade = () => {
  const {
    user,
    isProcessing,
    activeProcessingPlan,
    message,
    billingInterval,
    setBillingInterval,
    isTrialActive,
    remainingCalculations,
    remainingTimeStr,
    proPlan,
    taxPlan,
    handleRazorpayPayment,
  } = useUpgradePayment();
  return (
    <main className={styles.container}>
      <SEOHead
        title="Upgrade to Pro | Rupee Calculator"
        description="Unlock unlimited live AMFI mutual fund syncing, institutional-grade calculation limits, and World Bank PPP economic modeling."
        canonicalPath="/upgrade"
        noIndex={true}
      />
      <UpgradeHeader />
      {isTrialActive && (
        <TrialBanner
          remainingCalculations={remainingCalculations}
          freeLimit={user?.freeLimit}
          remainingTimeStr={remainingTimeStr}
        />
      )}
      {message && (
        <div
          className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}
        >
          <span>{message.text}</span>
        </div>
      )}
      <div className={styles.billingToggleRow}>
        <div className={styles.billingToggleWrapper}>
          <button
            type="button"
            className={`${styles.billingToggleBtn} ${billingInterval === 'monthly' ? styles.active : ''}`}
            onClick={() => setBillingInterval('monthly')}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            className={`${styles.billingToggleBtn} ${billingInterval === 'yearly' ? styles.active : ''}`}
            onClick={() => setBillingInterval('yearly')}
          >
            Yearly Billing
          </button>
        </div>
        <span className={styles.saveBadge}>Save up to 35% Yearly</span>
      </div>
      <DeveloperLetterCard />
      <PricingPlansGrid
        proPlan={proPlan}
        taxPlan={taxPlan}
        userEmail={user?.email}
        isProcessing={isProcessing}
        activeProcessingPlan={activeProcessingPlan}
        onSelectPlan={(planId) => void handleRazorpayPayment(planId)}
      />
    </main>
  );
};
export default Upgrade;
