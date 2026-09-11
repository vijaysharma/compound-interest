'use client';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from '@/navigation';
import { FiCheck, FiClock, FiCoffee, FiLock } from 'react-icons/fi';
import { useAuth } from '../context/useAuth';
import Logo from '../components/Logo';
import { PaymentSettings } from '../types/auth';
import { loadRazorpayScript } from '../utils/razorpay';
import SEOHead from '../components/SEOHead';
import {
  createRazorpayOrderAction,
  getPaymentSettingsAction,
  verifyRazorpayPaymentAction,
} from '@/actions/payments';
import styles from './Upgrade.module.scss';
const Upgrade = () => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getPaymentSettingsAction();
        setSettings(data.settings);
      } catch (err) {
        console.warn('Failed to fetch settings:', err);
      }
    };
    void fetchSettings();
  }, []);
  const amount = settings?.amount ?? 54;
  const isTrialActive =
    user && !user.isBlocked && user.role !== 'admin' && user.subscription_status !== 'active';
  const remainingCalculations = Math.max(0, (user?.freeLimit || 15) - (user?.api_usage_count || 0));
  const [now] = useState(() => Date.now());
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
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/upgrade' } } });
      return;
    }
    setIsProcessing(true);
    setMessage(null);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        throw new Error('Could not load payment gateway. Please check your internet connection.');
      }
      const storedToken = localStorage.getItem('auth_token');
      const orderData = await createRazorpayOrderAction(storedToken);
      if (!orderData.orderId || !orderData.keyId) {
        throw new Error('Failed to initialize payment gateway');
      }
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Rupee Calculator',
        description: '30 Days Unlimited Pro Access',
        order_id: orderData.orderId,
        prefill: {
          name: orderData.user?.name || user?.name || '',
          email: orderData.user?.email || user?.email || '',
        },
        theme: {
          color: '#10b981',
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            setIsProcessing(true);
            const verifyData = await verifyRazorpayPaymentAction(response, storedToken);
            setMessage({
              type: 'success',
              text: verifyData.message || 'Payment successful! 30-day Pro Access has been activated for your account.',
            });
            await refreshUser();
            setTimeout(() => {
              const saved = localStorage.getItem('last_visited_route');
              const target = saved && saved !== '/login' && saved !== '/upgrade' ? saved : '/';
              navigate(target, { replace: true });
            }, 1500);
          } catch (err) {
            setMessage({
              type: 'error',
              text: err instanceof Error ? err.message : 'Payment verification failed',
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
        text: err instanceof Error ? err.message : 'Unable to initiate payment. Please try again.',
      });
      setIsProcessing(false);
    }
  };
  return (
    <main className={styles.container}>
      <SEOHead
        title="Upgrade to Pro | Rupee Calculator"
        description="Unlock unlimited live AMFI mutual fund syncing, institutional-grade calculation limits, and World Bank PPP economic modeling for ₹54/month."
        canonicalPath="/upgrade"
        noIndex={true}
      />
      <div className={styles.header}>
        <div className={styles.badgeGroup}>
          <Logo />
          <span className={styles.supportBadge}>
            Support the Creator
          </span>
        </div>
        <h1 className={styles.title}>
          Keep Calculators Suite Ad-Free &amp; Alive
        </h1>
        <p className={styles.subtitle}>
          An honest, fast, private financial suite built for everyday investors in India.
        </p>
      </div>
      {isTrialActive && (
        <div className={styles.trialBanner}>
          <div className={styles.trialBannerContent}>
            <div>
              <div className={styles.trialEyebrow}>
                <FiClock />
                <span>Live Analytics Trial Active</span>
              </div>
              <p className={styles.trialMainText}>
                You have{' '}
                <span className={styles.highlightText}>
                  {remainingCalculations} of {user?.freeLimit || 15}
                </span>{' '}
                live Mutual Fund, Inflation &amp; PPP calculation runs left
                {remainingTimeStr ? ` (${remainingTimeStr} left in your 48h trial)` : ''}.
              </p>
              <p className={styles.trialSubText}>
                All other tools (FD, RD, SWP, SIP, EMI, Utilities) are 100% free for 48 hours from
                first usage, and remain free to use afterwards.
              </p>
            </div>
            <Link to="/mutual-funds/lumpsum" className={styles.trialReturnBtn}>
              Return to Calculators &rarr;
            </Link>
          </div>
        </div>
      )}
      {message && (
        <div
          className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}
        >
          <span>{message.text}</span>
        </div>
      )}
      <div className={styles.letterCard}>
        <div className={styles.letterHeader}>
          <div className={styles.letterIconWrapper}>
            <FiCoffee size={20} />
          </div>
          <div>
            <h2 className={styles.letterHeading}>A quick note from the developer</h2>
            <p className={styles.letterSubhead}>Why ₹54/month makes a huge difference</p>
          </div>
        </div>
        <div className={styles.letterBody}>
          <p>
            Hey there! I built this platform because I was tired of bloated financial websites
            stuffed with credit card ads, loan banners, and spammy popups asking for phone numbers.
          </p>
          <p>
            I wanted a tool that was fast, honest, and mathematically accurate. I wrote every
            calculator from scratch—hooking up daily syncs for thousands of AMFI mutual fund NAVs,
            decades of IMF inflation data, and realistic inflation-adjusted SWP and SIP formulas so
            you can plan your retirement without guesswork.
          </p>
          <p>
            I don&apos;t run spammy ads, and I never sell your data to financial telemarketers. But
            running PostgreSQL databases, serverless edge compute, and daily mutual fund data feeds
            costs money every month.
          </p>
          <p className={styles.highlightText}>
            ₹54 a month is less than ₹1.80 a day—literally less than a cutting chai. If this
            platform saved you time or gave you clarity on your financial goals, your support
            directly keeps this project alive, ad-free, and growing.
          </p>
        </div>
      </div>
      <div className={styles.pricingCard}>
        <div className={styles.pricingContent}>
          <div className={styles.pricingInfo}>
            <span className={styles.proBadge}>
              Pro Access
            </span>
            <div className={styles.priceDisplay}>
              <span className={styles.priceAmount}>₹{amount}</span>
              <span className={styles.pricePeriod}>/ 30 Days</span>
            </div>
            <p className={styles.pricingAccount}>
              Instant activation for{' '}
              <span>{user?.email || 'your account'}</span>
            </p>
          </div>
          <div className={styles.checkoutAction}>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => void handleRazorpayPayment()}
              className={styles.payButton}
            >
              {isProcessing ? (
                <>
                  <span className={styles.spinner} />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <FiLock />
                  <span>Pay ₹{amount} &amp; Unlock 30 Days Pro</span>
                </>
              )}
            </button>
            <p className={styles.payMethodsNote}>
              UPI (GPay, PhonePe, Paytm, BHIM) • Cards • NetBanking
            </p>
          </div>
        </div>
        <div className={styles.featuresGrid}>
          <div className={styles.featureItem}>
            <FiCheck className={styles.featureCheckIcon} />
            <span>Unlimited Mutual Fund Analytics</span>
          </div>
          <div className={styles.featureItem}>
            <FiCheck className={styles.featureCheckIcon} />
            <span>Daily AMFI Live NAV Sync</span>
          </div>
          <div className={styles.featureItem}>
            <FiCheck className={styles.featureCheckIcon} />
            <span>Zero Ads &amp; Complete Privacy</span>
          </div>
        </div>
      </div>
    </main>
  );
};
export default Upgrade;
