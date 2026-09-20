import React from 'react';
import { FiClock, FiZap } from 'react-icons/fi';
import type { AuthUser } from '../../types/auth';
import styles from '../PaywallModal.module.scss';
interface PaywallHeaderProps {
  user: AuthUser | null;
  isTrialActive: boolean;
  remainingCalculations: number;
  remainingTimeStr: string | null;
  billingInterval: 'monthly' | 'yearly';
  setBillingInterval: (interval: 'monthly' | 'yearly') => void;
  proMonthlyAmount: number;
}
export function PaywallHeader({
  user,
  isTrialActive,
  remainingCalculations,
  remainingTimeStr,
  billingInterval,
  setBillingInterval,
  proMonthlyAmount,
}: PaywallHeaderProps) {
  return (
    <div className={styles.header}>
      {isTrialActive ? (
        <div className={`${styles.badgeTrial} ${styles.active}`}>
          <FiClock className={styles.iconSmall} />
          <span>Trial Active</span>
        </div>
      ) : (
        <div className={`${styles.badgeTrial} ${styles.expired}`}>
          <FiZap className={styles.iconSmall} />
          <span>Trial Expired</span>
        </div>
      )}
      <h2 id="paywall-title" className={styles.title}>
        {isTrialActive ? 'Unlock Unlimited Financial Analytics' : 'Unlock Pro Access'}
      </h2>
      <p className={styles.subtitle}>
        {isTrialActive ? (
          <>
            You have{' '}
            <span className={styles.highlightPrimary}>
              {remainingCalculations} of {user?.freeLimit || 15}
            </span>{' '}
            live Mutual Fund, Inflation &amp; PPP calculation runs remaining
            {remainingTimeStr ? ` (${remainingTimeStr} left in your 48h trial)` : ''}. All other
            tools in the Calculators Suite are 100% free. Unlock unlimited access today.
          </>
        ) : (
          <>
            Your free trial for live AMFI Mutual Funds, Inflation &amp; PPP analytics has ended for{' '}
            <span className={styles.highlightSemibold}>{user?.email}</span>. Calculators Suite tools remain
            free to use.
          </>
        )}
      </p>
      <div className={styles.planToggleContainer}>
        <button
          type="button"
          onClick={() => setBillingInterval('monthly')}
          className={`${styles.planToggleBtn} ${billingInterval === 'monthly' ? styles.planToggleBtnActive : ''}`}
        >
          ₹{proMonthlyAmount} / 30 Days
        </button>
        <button
          type="button"
          onClick={() => setBillingInterval('yearly')}
          className={`${styles.planToggleBtn} ${billingInterval === 'yearly' ? styles.planToggleBtnActive : ''}`}
        >
          ₹499 / Year (Save 23%)
        </button>
      </div>
    </div>
  );
}
