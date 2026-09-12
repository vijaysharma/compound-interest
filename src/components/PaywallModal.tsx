'use client';
import { useEffect, useState } from 'react';
import { useNavigate } from '@/navigation';
import { FiClock, FiLock, FiX, FiZap } from 'react-icons/fi';
import { useAuth } from '../context/useAuth';
import { PaymentSettings } from '../types/auth';
import { loadRazorpayScript } from '../utils/razorpay';
import {
  createRazorpayOrderAction,
  getPaymentSettingsAction,
  verifyRazorpayPaymentAction,
} from '@/actions/payments';
import styles from './PaywallModal.module.scss';
const PaywallModal = () => {
  const { user, showPaywall, setShowPaywall, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [now] = useState(() => Date.now());
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  useEffect(() => {
    if (!showPaywall) return;
    const fetchSettings = async () => {
      try {
        const data = await getPaymentSettingsAction();
        setSettings(data.settings);
      } catch (err) {
        console.warn('Failed to load payment settings:', err);
      }
    };
    void fetchSettings();
  }, [showPaywall]);
  if (!showPaywall) return null;
  const handleCloseOrLater = () => {
    setShowPaywall(false);
    if (user?.isBlocked) {
      navigate('/upgrade');
    }
  };
  const isTrialActive = user && !user.isBlocked && user.subscription_status !== 'active';
  const remainingCalculations = Math.max(0, (user?.freeLimit || 15) - (user?.api_usage_count || 0));
  const getRemainingHours = () => {
    if (!user?.trial_expires_at) return null;
    const diff = new Date(user.trial_expires_at).getTime() - now;
    if (diff <= 0) return 0;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };
  const remainingTimeStr = getRemainingHours();
  const proMonthlyAmount = settings?.amount ?? 54;
  const planId = billingInterval === 'monthly' ? 'pro_monthly' : 'pro_yearly';
  const planAmount = billingInterval === 'monthly' ? proMonthlyAmount : 499;
  const handleRazorpayPayment = async () => {
    setIsProcessing(true);
    setMessage(null);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        throw new Error('Could not load payment gateway. Please check your internet connection.');
      }
      const storedToken = localStorage.getItem('auth_token');
      const orderData = await createRazorpayOrderAction(storedToken, planId);
      if (!orderData.orderId || !orderData.keyId) {
        throw new Error('Failed to create payment order');
      }
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Rupee Calculator Pro',
        description: orderData.planName || 'Pro Subscription',
        order_id: orderData.orderId,
        prefill: {
          email: user?.email || '',
        },
        theme: {
          color: '#6e0b75',
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            setIsProcessing(true);
            const verifyData = await verifyRazorpayPaymentAction(
              { ...response, plan_id: planId },
              storedToken
            );
            setMessage({
              type: 'success',
              text: verifyData.message || 'Payment successful! Pro access is now active.',
            });
            await refreshUser();
            setTimeout(() => {
              setShowPaywall(false);
              const saved = localStorage.getItem('last_visited_route');
              const target = saved && saved !== '/login' && saved !== '/upgrade' ? saved : '/';
              navigate(target, { replace: true });
            }, 1200);
          } catch (err) {
            setMessage({
              type: 'error',
              text: err instanceof Error ? err.message : 'Verification failed',
            });
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to process payment',
      });
      setIsProcessing(false);
    }
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
          <FiX style={{ width: '1.25rem', height: '1.25rem' }} />
        </button>
        <div className={styles.header}>
          {isTrialActive ? (
            <div className={`${styles.badgeTrial} ${styles.active}`}>
              <FiClock style={{ width: '0.875rem', height: '0.875rem' }} />
              <span>Trial Active</span>
            </div>
          ) : (
            <div className={`${styles.badgeTrial} ${styles.expired}`}>
              <FiZap style={{ width: '0.875rem', height: '0.875rem' }} />
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
          {/* Monthly / Yearly Plan Toggle */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => setBillingInterval('monthly')}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
                border: '1px solid var(--color-border, #ccc)',
                backgroundColor: billingInterval === 'monthly' ? 'var(--color-primary, #6e0b75)' : 'transparent',
                color: billingInterval === 'monthly' ? '#fff' : 'inherit',
                fontWeight: 600,
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              ₹{proMonthlyAmount} / 30 Days
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval('yearly')}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
                border: '1px solid var(--color-border, #ccc)',
                backgroundColor: billingInterval === 'yearly' ? 'var(--color-primary, #6e0b75)' : 'transparent',
                color: billingInterval === 'yearly' ? '#fff' : 'inherit',
                fontWeight: 600,
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              ₹499 / Year (Save 23%)
            </button>
          </div>
        </div>
        {message && (
          <div
            className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}
          >
            <span>{message.text}</span>
          </div>
        )}
        <div className={styles.actions}>
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => void handleRazorpayPayment()}
            className={styles.payBtn}
          >
            {isProcessing ? (
              <>
                <span className={styles.spinner} />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <FiLock style={{ width: '1rem', height: '1rem' }} />
                <span>Pay ₹{planAmount} &amp; Unlock Pro Access</span>
              </>
            )}
          </button>
          <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => {
                setShowPaywall(false);
                navigate('/upgrade');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary, #6e0b75)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Looking for Tax Advisory? View Tax Pro Plans (₹129/mo) &rarr;
            </button>
          </div>
          <p className={styles.securityInfo}>
            Secure checkout via Razorpay • UPI (GPay, PhonePe, Paytm), Cards &amp; NetBanking
          </p>
        </div>
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
