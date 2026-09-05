import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiLock, FiX } from 'react-icons/fi';
import { useAuth } from '../context/useAuth';
interface SubscriptionPromptBannerProps {
  className?: string;
}
const DISMISS_KEY = 'sub_prompt_dismissed_at';
const REMIND_INTERVAL_MS = 15 * 60 * 1000; // Remind again after 15 minutes
export const SubscriptionPromptBanner: React.FC<SubscriptionPromptBannerProps> = ({
  className,
}) => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      const stored = sessionStorage.getItem(DISMISS_KEY);
      if (!stored) return false;
      return Date.now() - parseInt(stored, 10) < REMIND_INTERVAL_MS;
    } catch {
      return false;
    }
  });
  const [now] = useState(() => Date.now());
  if (!isAuthenticated || isAdmin || user?.subscription_status === 'active') {
    return null;
  }
  const isPostTrial = Boolean(
    user?.trial_expires_at && new Date(user.trial_expires_at).getTime() < now
  );
  if (!isPostTrial || isDismissed) {
    return null;
  }
  const handleDismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {
      // ignore
    }
    setIsDismissed(true);
  };
  return (
    <div
      className={`w-full max-w-4xl mx-auto mb-4 p-4 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-base-100 to-primary/5 shadow-sm text-xs sm:text-sm relative animate-in fade-in duration-200 ${className || ''}`}
      role="region"
      aria-label="Subscription reminder"
    >
      <button
        type="button"
        onClick={handleDismiss}
        className="btn btn-ghost btn-xs btn-square absolute right-2 top-2 opacity-60 hover:opacity-100"
        aria-label="Dismiss reminder"
      >
        <FiX className="h-3.5 w-3.5" />
      </button>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pr-6">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-primary">
            <FiHeart className="h-4 w-4 fill-primary/20 text-primary" />
            <span>Support Independent, 100% Private Financial Calculators</span>
          </div>
          <p className="opacity-80 text-xs leading-relaxed max-w-2xl">
            This tool remains free for you to use. Subscribing for just{' '}
            <strong className="text-primary font-bold">₹54/month</strong> directly funds our ad-free
            servers, edge databases, and daily AMFI/IMF sync, while unlocking 15+ live Mutual Fund
            &amp; PPP analytics.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto mt-1 sm:mt-0">
          <Link
            to="/upgrade"
            className="btn btn-primary btn-xs sm:btn-sm font-bold gap-1 w-full sm:w-auto"
          >
            <FiLock className="h-3 w-3" />
            <span>Unlock Pro (₹54/mo)</span>
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            className="btn btn-ghost btn-xs text-[11px] opacity-70 hover:opacity-100"
          >
            Remind later
          </button>
        </div>
      </div>
    </div>
  );
};
export default SubscriptionPromptBanner;
