import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { PaymentSettings } from '../types/auth';
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}
const PaywallModal = () => {
  const { user, showPaywall, setShowPaywall, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showQrFallback, setShowQrFallback] = useState(false);
  const [copied, setCopied] = useState(false);
  const [now] = useState(() => Date.now());
  useEffect(() => {
    if (!showPaywall) return;
    // Load Razorpay script if not already present
    if (!document.getElementById('razorpay-checkout-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
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
  const handleCopyUpi = () => {
    if (!settings?.upi_id) return;
    void navigator.clipboard.writeText(settings.upi_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleCloseOrLater = () => {
    setShowPaywall(false);
    if (user?.isBlocked) {
      navigate('/upgrade');
    }
  };
  const amount = settings?.amount ?? 29;
  const upiId = settings?.upi_id || 'rupeecalculator@upi';
  const qrCodeUrl = settings?.upi_qr_code_url || '';
  const isTrialActive = user && !user.isBlocked && user.subscription_status !== 'active';
  const remainingCalculations = Math.max(0, (user?.freeLimit || 10) - (user?.api_usage_count || 0));
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
      if (!window.Razorpay) {
        throw new Error('Razorpay gateway is initializing. Please try again in a moment.');
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
              navigate('/investment-details', { replace: true });
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
        text: err instanceof Error ? err.message : 'Payment failed. Please try again.',
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
          ✕
        </button>
        <div className="text-center mb-6">
          {isTrialActive ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-info/15 text-info font-bold text-xs uppercase tracking-wider mb-2">
              <span>⏱️</span> Free Trial Active
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning/15 text-warning font-bold text-xs uppercase tracking-wider mb-2">
              <span>⚡</span> Free Trial Expired
            </div>
          )}
          <h2 id="paywall-title" className="text-2xl font-extrabold">
            {isTrialActive ? 'Get 30 Days Unlimited Pro' : 'Unlock 30 Days Pro Access'}
          </h2>
          <p className="mt-2 text-xs sm:text-sm opacity-80 leading-relaxed">
            {isTrialActive ? (
              <>
                You have <span className="font-bold text-primary">{remainingCalculations} of {user?.freeLimit || 10}</span> free calculations remaining
                {remainingTimeStr ? ` (${remainingTimeStr} left in your 24h trial)` : ''}.
                Support this independent project for just ₹{amount}/month for unlimited access.
              </>
            ) : (
              <>
                Your free trial (10 calculations / 24 hours) has ended for{' '}
                <span className="font-semibold">{user?.email}</span>. Support the independent development of Rupee Calculator for just ₹{amount}/month.
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
              <span>⚡ Pay ₹{amount} &amp; Unlock 30 Days</span>
            )}
          </button>
          <p className="text-center text-[11px] opacity-60">
            Secure checkout via Razorpay • UPI (GPay, PhonePe, Paytm), Cards &amp; NetBanking
          </p>
        </div>
        {/* Optional QR Code Fallback */}
        <div className="mt-6 pt-4 border-t border-base-200 text-center">
          <button
            type="button"
            onClick={() => setShowQrFallback(!showQrFallback)}
            className="text-xs opacity-70 hover:opacity-100 underline mb-2"
          >
            {showQrFallback ? 'Hide manual UPI QR' : 'Need manual UPI QR fallback?'}
          </button>
          {showQrFallback && (
            <div className="bg-base-200 p-3 rounded-lg border border-base-300 mt-2 space-y-2">
              {qrCodeUrl && (
                <img
                  src={qrCodeUrl}
                  alt="UPI QR"
                  className="h-32 w-32 mx-auto object-contain bg-white p-1.5 rounded border border-base-300"
                />
              )}
              <div className="flex items-center justify-between bg-base-100 p-2 rounded text-xs">
                <span className="font-mono font-bold text-primary truncate">{upiId}</span>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="btn btn-outline btn-xs shrink-0"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleCloseOrLater}
            className="text-xs opacity-60 hover:opacity-100 underline"
          >
            {isTrialActive ? 'Continue with Free Trial &rarr;' : "I'll do this later \u2192"}
          </button>
        </div>
      </div>
    </div>
  );
};
export default PaywallModal;
