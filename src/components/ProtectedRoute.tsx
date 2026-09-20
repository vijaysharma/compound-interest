'use client';
import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import LoadingFallback from './LoadingFallback';
import SubscriptionPromptBanner from './SubscriptionPromptBanner';
import { AdminFallback } from './protected-route/AdminFallback';
import { AuthRequiredFallback } from './protected-route/AuthRequiredFallback';
import { PaidRequiredFallback } from './protected-route/PaidRequiredFallback';
import { QuotaExpiredFallback } from './protected-route/QuotaExpiredFallback';
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
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<number>(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setNow(Date.now());
  }, []);
  // Initialize first_used_at on the first visit to any protected tool for authenticated users
  useEffect(() => {
    if (mounted && isAuthenticated && !user?.first_used_at && !isAdmin) {
      void trackUsage(true);
    }
  }, [mounted, isAuthenticated, user?.first_used_at, isAdmin, trackUsage]);
  if (requireAdmin || requirePaid) {
    if (!mounted || loading) return <LoadingFallback />;
  }
  if (!mounted) return <>{children}</>;
  // 1. Admin-only Route Check
  if (requireAdmin) {
    const adminFallback = (
      <AdminFallback
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
        user={user}
      />
    );
    if (!isAuthenticated || !isAdmin) return adminFallback;
  }
  // 2. Authentication Check: Require login for all protected tools
  if (!isAuthenticated) {
    return <AuthRequiredFallback />;
  }
  // 3. Paid-Only Route Check (e.g. Quick Notes)
  const isPaid = Boolean(
    isAdmin ||
    (user?.subscription_status === 'active' &&
      (!user?.subscription_expires_at || new Date(user.subscription_expires_at).getTime() > now))
  );
  if (requirePaid && !isPaid) {
    return <PaidRequiredFallback user={user} />;
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
      <QuotaExpiredFallback
        isQuotaExceeded={isQuotaExceeded}
        limit={limit}
        user={user}
      />
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
