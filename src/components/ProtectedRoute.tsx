import { ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiClock, FiLock, FiZap } from 'react-icons/fi';
import { useAuth } from '../context/useAuth';
import LoadingFallback from './LoadingFallback';
import GoogleSignInButton from './GoogleSignInButton';
import SubscriptionPromptBanner from './SubscriptionPromptBanner';
import styles from './ProtectedRoute.module.scss';
interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireApiQuota?: boolean;
  requireAuth?: boolean;
  requirePaid?: boolean;
}
const ProtectedRoute = ({
  children,
  requireAdmin = false,
  requireApiQuota = false,
  requirePaid = false,
}: ProtectedRouteProps) => {
  const { user, loading, isAuthenticated, isAdmin, trackUsage } = useAuth();
  const [now] = useState(() => Date.now());
  // Initialize first_used_at on the first visit to any protected tool for authenticated users
  useEffect(() => {
    if (isAuthenticated && !user?.first_used_at && !isAdmin) {
      void trackUsage(true);
    }
  }, [isAuthenticated, user?.first_used_at, isAdmin, trackUsage]);
  if (loading) {
    return <LoadingFallback />;
  }
  // 1. Admin-only Route Check
  if (requireAdmin) {
    if (!isAuthenticated) {
      return (
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.iconWrapper}>
              <FiLock className={styles.icon} />
            </div>
            <h2 className={styles.title}>Admin Authentication Required</h2>
            <p className={styles.description}>
              Please sign in with your administrator Google account to access data administration.
            </p>
            <GoogleSignInButton className={styles.signInWrapper} />
            <div className={styles.backRow}>
              <Link
                to="/"
                state={{ stayOnHome: true }}
                onClick={() => {
                  try {
                    sessionStorage.setItem('stay_on_home', 'true');
                    localStorage.setItem('last_visited_route', '/');
                  } catch {
                    // ignore
                  }
                }}
                className={styles.backLink}
              >
                &larr; Back to Home
              </Link>
            </div>
          </div>
        </div>
      );
    }
    if (!isAdmin) {
      return (
        <div className={styles.container}>
          <div className={`${styles.card} ${styles.cardError}`}>
            <div className={`${styles.iconWrapper} ${styles.iconWrapperError}`}>
              <FiAlertTriangle className={styles.icon} />
            </div>
            <h2 className={`${styles.title} ${styles.titleError}`}>Admin Access Required</h2>
            <p className={styles.subtitle}>
              You are signed in as <span className={styles.userHighlight}>{user?.email}</span> (role:{' '}
              {user?.role}).
            </p>
            <p className={styles.description}>
              This administration portal is restricted to accounts with administrator privileges.
            </p>
            <Link
              to="/"
              state={{ stayOnHome: true }}
              onClick={() => {
                try {
                  sessionStorage.setItem('stay_on_home', 'true');
                  localStorage.setItem('last_visited_route', '/');
                } catch {
                  // ignore
                }
              }}
              className={styles.primaryBtn}
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      );
    }
  }
  // 2. Authentication Check: Require login for all protected tools
  if (!isAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.iconWrapper}>
            <FiLock className={styles.icon} />
          </div>
          <h2 className={styles.title}>Authentication Required</h2>
          <p className={styles.description}>
            Please sign in with your Google account to access all features.
          </p>
          <GoogleSignInButton className={styles.signInWrapper} />
          <div className={styles.backRow}>
            <Link
              to="/"
              state={{ stayOnHome: true }}
              onClick={() => {
                try {
                  sessionStorage.setItem('stay_on_home', 'true');
                  localStorage.setItem('last_visited_route', '/');
                } catch {
                  // ignore
                }
              }}
              className={styles.backLink}
            >
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }
  // 3. Paid-Only Route Check (e.g. Quick Notes)
  const isPaid = Boolean(
    isAdmin ||
    (user?.subscription_status === 'active' &&
      (!user?.subscription_expires_at || new Date(user.subscription_expires_at).getTime() > now))
  );
  if (requirePaid) {
    if (!isPaid) {
      return (
        <div className={styles.container}>
          <div className={`${styles.card} ${styles.cardPrimary}`}>
            <div className={styles.iconWrapper}>
              <FiZap className={styles.icon} />
            </div>
            <h2 className={styles.title}>Pro Feature Required</h2>
            <p className={styles.subtitle}>
              Quick Notes is available exclusively for active Pro members. Signed in as{' '}
              <span className={styles.userHighlight}>{user?.email}</span>.
            </p>
            <p className={styles.description}>
              Upgrade to Pro for just ₹54/month to get unlimited rich-text Quick Notes with auto-sync, folders, tags, search, password protection, and cloud backups.
            </p>
            <div className={styles.actionStack}>
              <Link
                to="/upgrade"
                className={styles.primaryBtn}
              >
                <FiZap className={styles.iconSm} />
                <span>Unlock Pro for ₹54 / Month &rarr;</span>
              </Link>
              <Link
                to="/"
                state={{ stayOnHome: true }}
                onClick={() => {
                  try {
                    sessionStorage.setItem('stay_on_home', 'true');
                    localStorage.setItem('last_visited_route', '/');
                  } catch {
                    // ignore
                  }
                }}
                className={styles.ghostBtn}
              >
                &larr; Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return <>{children}</>;
  }
  // 4. For Authenticated Users: Check Trial Expiration & Quota
  const isTimeExpired = Boolean(
    isAuthenticated &&
    user?.trial_expires_at &&
    new Date(user.trial_expires_at).getTime() < now &&
    !isAdmin &&
    user?.subscription_status !== 'active'
  );
  const limit = user?.freeLimit || 15;
  const isQuotaExceeded = Boolean(
    isAuthenticated &&
    (user?.api_usage_count ?? 0) >= limit &&
    !isAdmin &&
    user?.subscription_status !== 'active'
  );
  // Live calculation tools (Mutual Funds, Inflation, PPP): Trial expires whichever earlier (15 runs or 48h)
  if (requireApiQuota && (isQuotaExceeded || isTimeExpired)) {
    return (
      <div className={styles.container}>
        <div className={`${styles.card} ${styles.cardWarning}`}>
          <div className={`${styles.iconWrapper} ${styles.iconWrapperWarning}`}>
            {isQuotaExceeded ? <FiZap className={styles.icon} /> : <FiClock className={styles.icon} />}
          </div>
          <h2 className={styles.title}>
            {isQuotaExceeded ? 'Calculation Limit Reached' : '48-Hour Free Trial Expired'}
          </h2>
          <p className={styles.subtitle}>
            {isQuotaExceeded
              ? `You have used all ${limit} free live Mutual Fund, Inflation & PPP calculation runs for `
              : 'Your 48-hour free trial period for live financial analytics has ended for '}
            <span className={styles.userHighlight}>{user?.email}</span>.
          </p>
          <p className={styles.description}>
            Unlock unlimited live calculations across all financial tools for just ₹54/month. Core
            calculators (FD, RD, EMI, SIP, SWP, Utilities) remain free.
          </p>
          <div className={styles.actionStack}>
            <Link
              to="/upgrade"
              className={styles.primaryBtn}
            >
              <FiZap className={styles.iconSm} />
              <span>Unlock Pro for ₹54 / Month &rarr;</span>
            </Link>
            <Link to="/fd-calculator" className={styles.ghostBtn}>
              Continue with Free Calculators Suite &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }
  // Calculators Suite tools: remain free, but show SubscriptionPromptBanner post-48 hours
  return (
    <>
      <SubscriptionPromptBanner />
      {children}
    </>
  );
};
export default ProtectedRoute;
