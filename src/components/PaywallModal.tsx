import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiLock, FiX, FiZap } from 'react-icons/fi';
import { useAuth } from '../context/useAuth';
import { PaymentSettings } from '../types/auth';
import { loadRazorpayScript } from '../utils/razorpay';
import styles from './PaywallModal.module.scss';
const PaywallModal = () => {
  const { user, showPaywall, setShowPaywall, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [now] = useState(() => Date.now());
  useEffect(() => {
    if (!showPaywall) return;
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/payments/settings');
        if (res.ok) {
          const data = (await res.json()) as { settings: PaymentSettings };
          setSettings(data.settings);
        }
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
  const amount = settings?.amount ?? 54;
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
  const handleRazorpayPayment = async () => {
    setIsProcessing(true);
    setMessage(null);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        throw new Error('Could not load payment gateway. Please check your internet connection.');
      }
      const storedToken = localStorage.getItem('auth_token');
      const orderRes = await fetch('/api/payments/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify({ amount }),
      });
      const orderData = (await orderRes.json()) as {
        orderId?: string;
        keyId?: string;
        amount?: number;
        currency?: string;
        error?: string;
      };
      if (!orderRes.ok || !orderData.orderId || !orderData.keyId) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Rupee Calculator Pro',
        description: '30-Day Pro Subscription',
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
            const verifyRes = await fetch('/api/payments/razorpay/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${storedToken}`,
              },
              body: JSON.stringify(response),
            });
            const verifyData = (await verifyRes.json()) as { message?: string; error?: string };
            if (!verifyRes.ok) {
              throw new Error(verifyData.error || 'Payment verification failed');
            }
            setMessage({
              type: 'success',
              text: 'Payment successful! 30-day Pro access is now active.',
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
    <div className={styles.dialogOverlay}>
      <div
        className={styles.modalCard}
        role="dialog"
        aria-modal="true"
        aria-labelledby="paywall-title"
      >
        <button
          type="button"
          className={styles.closeBtn}
          onClick={handleCloseOrLater}
          aria-label="Close paywall"
        >
          <FiX style={{ width: '1rem', height: '1rem' }} />
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
                tools in the Calculators Suite (FD, RD, EMI, SIP, SWP, Utilities) are 100% free for
                48 hours from first usage. Unlock unlimited access for just ₹{amount}/month.
              </>
            ) : (
              <>
                Your free trial / {user?.freeLimit || 15}-run limit for live AMFI Mutual Funds,
                Inflation &amp; PPP analytics has ended for{' '}
                <span className={styles.highlightSemibold}>{user?.email}</span>. Calculators Suite tools remain
                free to use. Unlock unlimited access for just ₹{amount}/month.
              </>
            )}
          </p>
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
                <span>Pay ₹{amount} &amp; Unlock Pro Access</span>
              </>
            )}
          </button>
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
