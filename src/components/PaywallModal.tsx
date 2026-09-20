'use client';
import { useState } from 'react';
import { useNavigate } from '@/navigation';
import { FiX } from 'react-icons/fi';
import { useScrollLock } from '../utilities/useScrollLock';
import { usePaywallPayment } from './paywall/usePaywallPayment';
import { PaywallHeader } from './paywall/PaywallHeader';
import { PaywallActions } from './paywall/PaywallActions';
import styles from './PaywallModal.module.scss';
const PaywallModal = () => {
  const {
    user,
    showPaywall,
    setShowPaywall,
    isProcessing,
    message,
    billingInterval,
    setBillingInterval,
    proMonthlyAmount,
    planAmount,
    handleRazorpayPayment,
  } = usePaywallPayment();
  useScrollLock(showPaywall);
  const navigate = useNavigate();
  const [now] = useState(() => Date.now());
  if (!showPaywall) return null;
  const handleCloseOrLater = () => {
    setShowPaywall(false);
    if (user?.isBlocked) {
      navigate('/upgrade');
    }
  };
  const isTrialActive = Boolean(user && !user.isBlocked && user.subscription_status !== 'active');
  const remainingCalculations = Math.max(0, (user?.freeLimit || 15) - (user?.api_usage_count || 0));
  const getRemainingHours = () => {
    if (!user?.trial_expires_at) return null;
    const diff = new Date(user.trial_expires_at).getTime() - now;
    if (diff <= 0) return '0m';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };
  return (
    <div className={styles.dialogOverlay} role="dialog" aria-modal="true" aria-labelledby="paywall-title">
      <div className={styles.modalCard}>
        <button
          type="button"
          onClick={handleCloseOrLater}
          className={styles.closeBtn}
          aria-label="Close modal"
        >
          <FiX className={styles.iconLarge} />
        </button>
        <PaywallHeader
          user={user}
          isTrialActive={isTrialActive}
          remainingCalculations={remainingCalculations}
          remainingTimeStr={getRemainingHours()}
          billingInterval={billingInterval}
          setBillingInterval={setBillingInterval}
          proMonthlyAmount={proMonthlyAmount}
        />
        {message && (
          <div
            className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}
          >
            <span>{message.text}</span>
          </div>
        )}
        <PaywallActions
          isProcessing={isProcessing}
          planAmount={planAmount}
          handleRazorpayPayment={handleRazorpayPayment}
          onTaxProClick={() => {
            setShowPaywall(false);
            navigate('/upgrade');
          }}
        />
        <div className={styles.footerNote}>
          <button
            type="button"
            onClick={handleCloseOrLater}
            className={styles.dismissLink}
          >
            {isTrialActive ? 'Continue with Free Trial' : 'Continue with Free Calculators Suite'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default PaywallModal;
