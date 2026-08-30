import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import { PaymentSettings } from '../types/auth';
const PaywallModal = () => {
  const { user, showPaywall, setShowPaywall } = useAuth();
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [utrRef, setUtrRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
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
  const handleCopyUpi = () => {
    if (!settings?.upi_id) return;
    void navigator.clipboard.writeText(settings.upi_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleSubmitUtr = async (e: FormEvent) => {
    e.preventDefault();
    if (!utrRef.trim() || utrRef.trim().length < 4) {
      setMessage({
        type: 'error',
        text: 'Please enter a valid 12-digit UPI UTR / Transaction Reference number.',
      });
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    try {
      const storedToken = localStorage.getItem('auth_token');
      const res = await fetch('/api/payments/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify({
          utr_ref: utrRef.trim(),
          amount: settings?.amount || 19,
        }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Payment submission failed');
      }
      setMessage({
        type: 'success',
        text:
          data.message ||
          'Payment submitted successfully! Your account will be activated upon verification.',
      });
      setUtrRef('');
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Submission failed. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const amount = settings?.amount ?? 19;
  const upiId = settings?.upi_id || 'rupeecalculator@upi';
  const qrCodeUrl = settings?.upi_qr_code_url || '';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs overflow-y-auto">
      <div
        className="card bg-base-100 border border-base-300 w-full max-w-lg p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="paywall-title"
      >
        <button
          type="button"
          className="btn btn-ghost btn-xs btn-square absolute right-4 top-4 opacity-70 hover:opacity-100"
          onClick={() => setShowPaywall(false)}
          aria-label="Close paywall"
        >
          ✕
        </button>
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning/15 text-warning font-bold text-xs uppercase tracking-wider mb-2">
            <span>⚡</span> Free Trial Limit Reached
          </div>
          <h2 id="paywall-title" className="text-2xl font-extrabold">
            Unlock 1 Month Unlimited Pro
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm opacity-75">
            You have used all {user?.freeLimit || 15} free calculations for{' '}
            <span className="font-semibold">{user?.email}</span>. Pay just ₹{amount} for full access
            for 30 days.
          </p>
        </div>
        {message && (
          <div
            className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} text-xs py-2.5 px-4 mb-4 rounded-lg shadow-sm`}
          >
            <span>{message.text}</span>
          </div>
        )}
        <div className="bg-base-200/60 rounded-xl p-4 border border-base-300/80 mb-6 flex flex-col items-center">
          <div className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-2">
            Scan &amp; Pay via Any UPI App
          </div>
          {qrCodeUrl ? (
            <div className="bg-white p-2 rounded-lg shadow-inner mb-3 border border-base-300">
              <img
                src={qrCodeUrl}
                alt="UPI Payment QR Code"
                className="h-44 w-44 object-contain mx-auto rounded"
              />
            </div>
          ) : (
            <div className="h-40 w-40 flex flex-col items-center justify-center bg-base-100 rounded-lg border border-dashed border-base-300 text-center p-3 mb-3">
              <span className="text-3xl mb-1">📱</span>
              <span className="text-xs opacity-60">Scan with GPay, PhonePe, Paytm, or BHIM</span>
            </div>
          )}
          <div className="w-full flex items-center justify-between gap-2 bg-base-100 p-2.5 rounded-lg border border-base-300">
            <div className="truncate text-left">
              <div className="text-[10px] uppercase font-bold opacity-50">UPI ID</div>
              <div className="text-xs font-mono font-bold truncate text-primary">{upiId}</div>
            </div>
            <button
              type="button"
              onClick={handleCopyUpi}
              className="btn btn-outline btn-xs gap-1 shrink-0"
            >
              {copied ? (
                <>
                  <span className="text-success">✓</span>
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <span>📋</span>
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="mt-2 text-center text-xs opacity-75 font-semibold">
            Amount: <span className="text-primary font-bold text-sm">₹{amount}</span> for 30 Days Access
          </div>
        </div>
        <form onSubmit={handleSubmitUtr} className="space-y-3">
          <div>
            <label
              htmlFor="utr-ref"
              className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-80"
            >
              Step 2: Enter UPI UTR / Transaction Reference ID
            </label>
            <input
              id="utr-ref"
              type="text"
              required
              value={utrRef}
              onChange={(e) => setUtrRef(e.target.value)}
              placeholder="e.g. 423456789012 (12-digit reference number)"
              className="input input-bordered input-primary w-full text-sm font-mono focus:outline-none"
            />
            <p className="mt-1 text-[11px] opacity-60">
              Found in your UPI app payment receipt under &apos;UPI Ref ID&apos; or &apos;UTR&apos;.
            </p>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary w-full shadow-md font-semibold mt-2"
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-xs" />
                <span>Submitting Reference...</span>
              </>
            ) : (
              <span>Submit Payment for Verification &rarr;</span>
            )}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setShowPaywall(false)}
            className="text-xs opacity-60 hover:opacity-100 underline"
          >
            I&apos;ll do this later
          </button>
        </div>
      </div>
    </div>
  );
};
export default PaywallModal;
