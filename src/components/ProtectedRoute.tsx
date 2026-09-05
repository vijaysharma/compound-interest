import { ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiClock, FiLock, FiZap } from 'react-icons/fi';
import { useAuth } from '../context/useAuth';
import LoadingFallback from './LoadingFallback';
import GoogleSignInButton from './GoogleSignInButton';
import SubscriptionPromptBanner from './SubscriptionPromptBanner';
interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireApiQuota?: boolean;
  requireAuth?: boolean;
}
const ProtectedRoute = ({
  children,
  requireAdmin = false,
  requireApiQuota = false,
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
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
          <div className="card bg-base-100 border border-base-300 w-full max-w-md p-6 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FiLock className="h-7 w-7" />
            </div>
            <h2 className="mb-2 text-xl font-bold">Admin Authentication Required</h2>
            <p className="mb-6 text-sm opacity-70">
              Please sign in with your administrator Google account to access data administration.
            </p>
            <GoogleSignInButton className="w-full" />
            <div className="mt-6 border-t border-base-200 pt-4">
              <Link to="/" className="text-xs text-primary hover:underline">
                &larr; Back to Home
              </Link>
            </div>
          </div>
        </div>
      );
    }
    if (!isAdmin) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
          <div className="card bg-base-100 border border-error/30 w-full max-w-md p-6 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-error/10 text-error">
              <FiAlertTriangle className="h-7 w-7" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-error">Admin Access Required</h2>
            <p className="mb-2 text-sm opacity-70">
              You are signed in as <span className="font-semibold">{user?.email}</span> (role:{' '}
              {user?.role}).
            </p>
            <p className="mb-6 text-xs opacity-60">
              This administration portal is restricted to accounts with administrator privileges.
            </p>
            <Link to="/" className="btn btn-primary btn-sm">
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
        <div className="card bg-base-100 border border-base-300 w-full max-w-md p-6 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FiLock className="h-7 w-7" />
          </div>
          <h2 className="mb-2 text-xl font-bold">Authentication Required</h2>
          <p className="mb-6 text-sm opacity-70">
            Please sign in with your Google account to access all features.
          </p>
          <GoogleSignInButton className="w-full" />
          <div className="mt-6 border-t border-base-200 pt-4">
            <Link to="/" className="text-xs text-primary hover:underline">
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }
  // 3. For Authenticated Users: Check Trial Expiration & Quota
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
      <div className="flex min-h-[65vh] flex-col items-center justify-center p-4">
        <div className="card bg-base-100 border border-warning/40 w-full max-w-md p-6 sm:p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warning/15 text-warning">
            {isQuotaExceeded ? <FiZap className="h-7 w-7" /> : <FiClock className="h-7 w-7" />}
          </div>
          <h2 className="mb-2 text-xl font-bold">
            {isQuotaExceeded ? 'Calculation Limit Reached' : '48-Hour Free Trial Expired'}
          </h2>
          <p className="mb-2 text-xs sm:text-sm opacity-75">
            {isQuotaExceeded
              ? `You have used all ${limit} free live Mutual Fund, Inflation & PPP calculation runs for `
              : 'Your 48-hour free trial period for live financial analytics has ended for '}
            <span className="font-semibold">{user?.email}</span>.
          </p>
          <p className="mb-6 text-xs opacity-60">
            Unlock unlimited live calculations across all financial tools for just ₹54/month. Core
            calculators (FD, RD, EMI, SIP, SWP, Utilities) remain free.
          </p>
          <div className="space-y-2">
            <Link
              to="/upgrade"
              className="btn btn-primary w-full font-bold shadow-md flex items-center justify-center gap-1.5"
            >
              <FiZap className="h-4 w-4" />
              <span>Unlock Pro for ₹54 / Month &rarr;</span>
            </Link>
            <Link to="/fd-calculator" className="btn btn-ghost btn-xs w-full opacity-80">
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
