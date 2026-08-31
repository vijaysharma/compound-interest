import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiCheck, FiClock, FiCoffee, FiLock } from 'react-icons/fi';
import { useAuth } from '../context/useAuth';
import Logo from '../components/Logo';
import { PaymentSettings } from '../types/auth';
import { loadRazorpayScript } from '../utils/razorpay';
const Upgrade = () => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/payments/settings');
        if (res.ok) {
          const data = (await res.json()) as { settings: PaymentSettings };
          setSettings(data.settings);
        }
      } catch (err) {
        console.warn('Failed to fetch settings:', err);
      }
    };
    void fetchSettings();
  }, []);
  const amount = settings?.amount ?? 29;
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
        amount?: number;
        currency?: string;
        keyId?: string;
        error?: string;
        user?: { name?: string; email?: string };
      };
      if (!orderRes.ok || !orderData.orderId || !orderData.keyId) {
        throw new Error(orderData.error || 'Failed to initialize payment gateway');
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
              throw new Error(verifyData.error || 'Payment signature verification failed');
            }
            setMessage({
              type: 'success',
              text: 'Payment successful! 30-day Pro Access has been activated for your account.',
            });
            await refreshUser();
            setTimeout(() => {
              navigate('/', { replace: true });
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
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-3">
          <Logo />
          <span className="text-xs uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
            Support the Creator
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Keep Calculators Suite Ad-Free &amp; Alive
        </h1>
        <p className="mt-2 text-sm sm:text-base opacity-75 max-w-xl mx-auto">
          An honest, fast, private financial suite built for everyday investors in India.
        </p>
      </div>
      {/* Active Trial Banner vs Expired Status */}
      {isTrialActive && (
        <div className="card bg-info/10 border border-info/30 p-4 mb-6 rounded-2xl shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-info uppercase tracking-wider mb-1">
                <FiClock className="h-3.5 w-3.5" />
                <span>Mutual Funds &amp; PPP Trial Active</span>
              </div>
              <p className="text-xs sm:text-sm font-medium">
                You have{' '}
                <span className="font-bold text-primary">
                  {remainingCalculations} of {user?.freeLimit || 15}
                </span>{' '}
                Mutual Fund &amp; PPP calculation runs left
                {remainingTimeStr ? ` (${remainingTimeStr} left in your 48h trial)` : ''}.
              </p>
              <p className="text-[11px] opacity-65 mt-0.5">
                All other tools (FD, RD, SWP, SIP, EMI, Inflation) are 100% free for 48 hours from
                first usage.
              </p>
            </div>
            <Link to="/mutual-funds/lumpsum" className="btn btn-outline btn-info btn-xs shrink-0">
              Return to Calculators &rarr;
            </Link>
          </div>
        </div>
      )}
      {message && (
        <div
          className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} text-sm py-3 px-4 mb-6 rounded-xl shadow-sm`}
        >
          <span>{message.text}</span>
        </div>
      )}
      {/* Human Developer Letter Card */}
      <div className="card bg-base-100 border border-base-300 p-6 sm:p-8 shadow-xl mb-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-warning/15 shrink-0">
            <FiCoffee className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h2 className="text-lg font-bold">A quick note from the developer</h2>
            <p className="text-xs opacity-60">Why ₹29/month makes a huge difference</p>
          </div>
        </div>
        <div className="text-xs sm:text-sm leading-relaxed opacity-85 space-y-3 pt-2">
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
          <p className="font-semibold text-primary">
            ₹29 a month is literally less than a cutting chai and samosa. If this platform saved you
            time or gave you clarity on your financial goals, your support directly keeps this
            project alive, ad-free, and growing.
          </p>
        </div>
      </div>
      {/* Pricing & Checkout Card */}
      <div className="card bg-gradient-to-br from-primary/10 via-base-100 to-base-200 border-2 border-primary/40 p-6 sm:p-8 shadow-2xl relative overflow-hidden mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <span className="badge badge-primary font-bold text-xs uppercase px-3 py-1 mb-2">
              Pro Access
            </span>
            <div className="flex items-baseline justify-center sm:justify-start gap-1">
              <span className="text-4xl sm:text-5xl font-extrabold text-primary">₹{amount}</span>
              <span className="text-sm opacity-70 font-medium">/ 30 Days</span>
            </div>
            <p className="mt-1.5 text-xs opacity-75">
              Instant activation for{' '}
              <span className="font-semibold">{user?.email || 'your account'}</span>
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => void handleRazorpayPayment()}
              className="btn btn-primary btn-lg w-full shadow-lg gap-2 text-sm sm:text-base font-bold flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <FiLock className="h-4 w-4" />
                  <span>Pay ₹{amount} &amp; Unlock 30 Days Pro</span>
                </>
              )}
            </button>
            <p className="mt-2 text-center text-[11px] opacity-60">
              UPI (GPay, PhonePe, Paytm, BHIM) • Cards • NetBanking
            </p>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-base-300 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs opacity-80">
          <div className="flex items-center gap-2">
            <FiCheck className="text-success font-bold h-4 w-4 shrink-0" />
            <span>Unlimited Mutual Fund Analytics</span>
          </div>
          <div className="flex items-center gap-2">
            <FiCheck className="text-success font-bold h-4 w-4 shrink-0" />
            <span>Daily AMFI Live NAV Sync</span>
          </div>
          <div className="flex items-center gap-2">
            <FiCheck className="text-success font-bold h-4 w-4 shrink-0" />
            <span>Zero Ads &amp; Complete Privacy</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Upgrade;
