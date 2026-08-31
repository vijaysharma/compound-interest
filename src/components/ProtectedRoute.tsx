import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiLock, FiZap } from 'react-icons/fi';
import { useAuth } from '../context/useAuth';
import LoadingFallback from './LoadingFallback';
import GoogleSignInButton from './GoogleSignInButton';
interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireApiQuota?: boolean;
}
const ProtectedRoute = ({
  children,
  requireAdmin = false,
  requireApiQuota = false,
}: ProtectedRouteProps) => {
  const { user, loading, isAuthenticated, isAdmin } = useAuth();
  if (loading) {
    return <LoadingFallback />;
  }
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
  if (requireAdmin && !isAdmin) {
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
  if (requireApiQuota && user?.isBlocked && !isAdmin) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center p-4">
        <div className="card bg-base-100 border border-warning/40 w-full max-w-md p-6 sm:p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warning/15 text-warning">
            <FiZap className="h-7 w-7" />
          </div>
          <h2 className="mb-2 text-xl font-bold">Mutual Funds Trial Expired</h2>
          <p className="mb-2 text-xs sm:text-sm opacity-75">
            Your 48-hour / 10-calculation trial for live AMFI Mutual Funds search &amp; NAV history
            has ended for <span className="font-semibold">{user.email}</span>.
          </p>
          <p className="mb-6 text-xs opacity-60">
            Support the creator for just ₹29/mo to unlock unlimited live AMFI Mutual Fund sync. All
            other tools (FD, RD, SWP, EMI, Inflation, PPP) are free for 48 hours.
          </p>
          <div className="space-y-2">
            <Link
              to="/upgrade"
              className="btn btn-primary w-full font-bold shadow-md flex items-center justify-center gap-1.5"
            >
              <FiZap className="h-4 w-4" />
              <span>Unlock Mutual Funds Pro for ₹29 / Month &rarr;</span>
            </Link>
            <Link to="/deposits/fd" className="btn btn-ghost btn-xs w-full opacity-80">
              Back to Free Calculators &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};
export default ProtectedRoute;
