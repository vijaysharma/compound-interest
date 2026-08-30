import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
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
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-bold">Authentication Required</h2>
          <p className="mb-6 text-sm opacity-70">
            Please sign in with your Google account to access the Calculators Suite.
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
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
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
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warning/15 text-warning text-2xl">
            ⚡
          </div>
          <h2 className="mb-2 text-xl font-bold">Live Analytics Trial Expired</h2>
          <p className="mb-2 text-xs sm:text-sm opacity-75">
            Your 24-hour / 10-calculation trial for live Mutual Funds &amp; PPP analytics has ended for{' '}
            <span className="font-semibold">{user.email}</span>.
          </p>
          <p className="mb-6 text-xs opacity-60">
            Support the creator for just ₹29/mo to unlock unlimited live AMFI data &amp; PPP sync. Standard calculators in the suite remain completely free &amp; unlimited.
          </p>
          <div className="space-y-2">
            <Link to="/upgrade" className="btn btn-primary w-full font-bold shadow-md">
              ⚡ Upgrade for ₹29 / Month &rarr;
            </Link>
            <Link to="/investment-details" className="btn btn-ghost btn-xs w-full opacity-80">
              📊 Back to Calculators Suite
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};
export default ProtectedRoute;
