'use client';
import { useState } from 'react';
import { Link } from '@/navigation';
import { FiHeart, FiLock, FiX } from 'react-icons/fi';
import { useAuth } from '../context/useAuth';
import styles from './SubscriptionPromptBanner.module.scss';
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
      className={`${styles.banner} ${className || ''}`}
      role="region"
      aria-label="Subscription reminder"
    >
      <button
        type="button"
        onClick={handleDismiss}
        className={styles.dismissBtn}
        aria-label="Dismiss reminder"
      >
        <FiX style={{ width: '0.875rem', height: '0.875rem' }} />
      </button>
      <div className={styles.bodyRow}>
        <div className={styles.textCol}>
          <div className={styles.titleRow}>
            <FiHeart className={styles.heartIcon} />
            <span>Support Independent, 100% Private Financial Calculators</span>
          </div>
          <p className={styles.description}>
            This tool remains free for you to use. Subscribing for just{' '}
            <strong className={styles.priceHighlight}>₹54/month</strong> directly funds our ad-free
            servers, edge databases, and daily AMFI/IMF sync, while unlocking 15+ live Mutual Fund
            &amp; PPP analytics.
          </p>
        </div>
        <div className={styles.actions}>
          <Link
            to="/upgrade"
            className={styles.ctaBtn}
          >
            <FiLock style={{ width: '0.75rem', height: '0.75rem' }} />
            <span>Unlock Pro (₹54/mo)</span>
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            className={styles.remindLaterBtn}
          >
            Remind later
          </button>
        </div>
      </div>
    </div>
  );
};
export default SubscriptionPromptBanner;
