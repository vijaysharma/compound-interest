import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiLock, FiX, FiZap } from 'react-icons/fi';
import { useAuth } from '../context/useAuth';
import { PaymentSettings } from '../types/auth';
import { loadRazorpayScript } from '../utils/razorpay';
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
        amount?: number;
        currency?: string;
        keyId?: string;
        error?: string;
        user?: { name?: string; email?: string };
      };
      if (!orderRes.ok || !orderData.orderId || !orderData.keyId) {
        throw new Error(orderData.error || 'Failed to initialize payment');
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
              throw new Error(verifyData.error || 'Payment verification failed');
            }
            setMessage({
              type: 'success',
              text: 'Payment successful! 30-day Pro access is now active.',
            });
            await refreshUser();
            setTimeout(() => {
              setShowPaywall(false);
              navigate('/', { replace: true });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs overflow-y-auto">
      <div
        className="card bg-base-100 border border-base-300 w-full max-w-md p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="paywall-title"
      >
        <button
          type="button"
          className="btn btn-ghost btn-xs btn-square absolute right-4 top-4 opacity-70 hover:opacity-100"
          onClick={handleCloseOrLater}
          aria-label="Close paywall"
        >
          <FiX className="h-4 w-4" />
        </button>
        <div className="text-center mb-6">
          {isTrialActive ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-info/15 text-info font-bold text-xs uppercase tracking-wider mb-2">
              <FiClock className="h-3.5 w-3.5" />
              <span>Trial Active</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning/15 text-warning font-bold text-xs uppercase tracking-wider mb-2">
              <FiZap className="h-3.5 w-3.5" />
              <span>Trial Expired</span>
            </div>
          )}
          <h2 id="paywall-title" className="text-2xl font-extrabold">
            {isTrialActive ? 'Unlock Unlimited Financial Analytics' : 'Unlock Pro Access'}
          </h2>
          <p className="mt-2 text-xs sm:text-sm opacity-80 leading-relaxed">
            {isTrialActive ? (
              <>
                You have{' '}
                <span className="font-bold text-primary">
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
                <span className="font-semibold">{user?.email}</span>. Calculators Suite tools remain
                free to use. Unlock unlimited access for just ₹{amount}/month.
              </>
            )}
          </p>
        </div>
        {message && (
          <div
            className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} text-xs py-2.5 px-4 mb-4 rounded-lg shadow-sm`}
          >
            <span>{message.text}</span>
          </div>
        )}
        <div className="space-y-4">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => void handleRazorpayPayment()}
            className="btn btn-primary btn-lg w-full shadow-lg font-bold text-sm sm:text-base flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <FiLock className="h-4 w-4" />
                <span>Pay ₹{amount} &amp; Unlock Pro Access</span>
              </>
            )}
          </button>
          <p className="text-center text-[11px] opacity-60">
            Secure checkout via Razorpay • UPI (GPay, PhonePe, Paytm), Cards &amp; NetBanking
          </p>
        </div>
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleCloseOrLater}
            className="text-xs opacity-60 hover:opacity-100 underline"
          >
            {isTrialActive ? 'Continue with Free Trial' : 'Continue with Free Calculators Suite'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default PaywallModal;
