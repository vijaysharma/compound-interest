import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { useAuth } from '../context/useAuth';
const getNavTitle = (pathname: string) => {
  const titles: Record<string, string> = {
    '/': 'Rupee Calculator',
    '/login': 'Sign In',
    '/investment-details': 'Investment Suite',
    '/admin': 'Data administration',
    '/emi': 'EMI Calculator',
    '/deposits/fd': 'Fixed Deposits',
    '/deposits/rd': 'Recurring Deposits',
    '/economics/inflation-rates': 'Inflation Rates',
    '/economics/ppp-exchange-rate': 'PPP Exchange Rate',
    '/fixed-plans/fixed-rate-sip': 'Fixed Rate SIP',
    '/fixed-plans/fixed-rate-swp': 'Fixed Rate SWP',
    '/mutual-funds/lumpsum': 'Lumpsum',
    '/mutual-funds/sip': 'SIP',
    '/mutual-funds/swp': 'SWP',
  };
  return titles[pathname] ?? 'Rupee Calculator';
};
const TopBar = ({ className }: { className?: string }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout, setShowPaywall } = useAuth();
  const navTitle = getNavTitle(pathname);
  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };
  return (
    <>
      <header
        className={`flex items-center justify-between px-3 py-2 bg-primary text-primary-content font-semibold ${className}`}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-square text-primary-content"
            aria-label="Open navigation menu"
            aria-expanded={isMenuOpen}
            aria-controls="navigation-drawer"
            onClick={() => setIsMenuOpen(true)}
          >
            <span className="flex flex-col gap-1" aria-hidden="true">
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
            </span>
          </button>
          <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Logo /> <span className="truncate">{navTitle}</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <span className="hidden sm:inline-flex badge badge-accent badge-sm font-bold uppercase text-[10px]">
                  Admin
                </span>
              ) : user.subscription_status === 'active' ? (
                <span className="hidden sm:inline-flex badge badge-accent badge-sm font-bold gap-1 text-[10px]">
                  👑 Pro Active
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPaywall(true)}
                  className={`btn btn-xs ${user.isBlocked ? 'btn-warning animate-pulse' : 'btn-outline border-primary-content text-primary-content hover:bg-primary-content hover:text-primary'} gap-1 font-normal`}
                  title={`${user.api_usage_count ?? 0}/${user.freeLimit ?? 10} Mutual Fund live calculations used in 48h trial. Other calculators are free for 48 hours.`}
                >
                  <span>⚡</span>
                  <span className="hidden md:inline">
                    {user.api_usage_count ?? 0}/{user.freeLimit ?? 10} MF Runs
                  </span>
                  <span className="font-bold underline text-[10px]">₹29 Pro</span>
                </button>
              )}
              <div className="hidden sm:flex flex-col items-end text-right leading-tight">
                <span className="text-xs font-medium truncate max-w-[130px]">
                  {user.name || user.email}
                </span>
              </div>
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name || user.email}
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border border-primary-content/40 object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-primary-content/20 text-xs font-bold uppercase text-primary-content">
                  {(user.name || user.email).charAt(0)}
                </div>
              )}
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="btn btn-ghost btn-xs text-primary-content hover:bg-primary-content/10"
                title="Log out"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="btn btn-sm btn-outline border-primary-content text-primary-content hover:bg-primary-content hover:text-primary"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>
      {isMenuOpen && (
        <div className="fixed inset-0 z-50" role="presentation">
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default bg-black/40"
            aria-label="Close navigation menu"
            onClick={() => setIsMenuOpen(false)}
          />
          <aside
            id="navigation-drawer"
            className="bg-primary relative h-full w-72 max-w-[85vw] p-4 text-primary-content shadow-xl flex flex-col justify-between overflow-y-auto"
            aria-label="Navigation menu"
          >
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Rupee Calculator</h2>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-square text-primary-content"
                  aria-label="Close navigation menu"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="text-2xl leading-none" aria-hidden="true">
                    &times;
                  </span>
                </button>
              </div>
              <nav
                aria-label="Calculator pages"
                className="text-primary-content flex flex-col gap-1.5"
              >
                <Link
                  to="/"
                  className="px-3 py-2 rounded hover:bg-primary-content/10 transition-colors text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Overview &amp; Features
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="px-3 py-2 rounded hover:bg-primary-content/10 transition-colors text-accent font-semibold"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Data administration
                  </Link>
                )}
                <div className="mt-3">
                  <h3 className="px-3 text-xs font-bold uppercase tracking-wider opacity-60">
                    Loans
                  </h3>
                  <Link
                    to="/emi"
                    className="block px-3 py-1.5 rounded hover:bg-primary-content/10 transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    EMI Calculator
                  </Link>
                </div>
                <div className="mt-3">
                  <h3 className="px-3 text-xs font-bold uppercase tracking-wider opacity-60">
                    Deposits
                  </h3>
                  <Link
                    to="/deposits/fd"
                    className="block px-3 py-1.5 rounded hover:bg-primary-content/10 transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Fixed Deposits
                  </Link>
                  <Link
                    to="/deposits/rd"
                    className="block px-3 py-1.5 rounded hover:bg-primary-content/10 transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Recurring Deposits
                  </Link>
                </div>
                <div className="mt-3">
                  <h3 className="px-3 text-xs font-bold uppercase tracking-wider opacity-60">
                    Economics
                  </h3>
                  <Link
                    to="/economics/inflation-rates"
                    className="block px-3 py-1.5 rounded hover:bg-primary-content/10 transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Inflation Rates
                  </Link>
                  <Link
                    to="/economics/ppp-exchange-rate"
                    className="block px-3 py-1.5 rounded hover:bg-primary-content/10 transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    PPP Exchange Rate
                  </Link>
                </div>
                <div className="mt-3">
                  <h3 className="px-3 text-xs font-bold uppercase tracking-wider opacity-60">
                    Fixed Plans
                  </h3>
                  <Link
                    to="/fixed-plans/fixed-rate-sip"
                    className="block px-3 py-1.5 rounded hover:bg-primary-content/10 transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Fixed Rate SIP
                  </Link>
                  <Link
                    to="/fixed-plans/fixed-rate-swp"
                    className="block px-3 py-1.5 rounded hover:bg-primary-content/10 transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Fixed Rate SWP
                  </Link>
                </div>
                <div className="mt-3">
                  <h3 className="px-3 text-xs font-bold uppercase tracking-wider opacity-60">
                    Mutual Funds
                  </h3>
                  <Link
                    to="/mutual-funds/lumpsum"
                    className="block px-3 py-1.5 rounded hover:bg-primary-content/10 transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Lumpsum
                  </Link>
                  <Link
                    to="/mutual-funds/sip"
                    className="block px-3 py-1.5 rounded hover:bg-primary-content/10 transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    SIP
                  </Link>
                  <Link
                    to="/mutual-funds/swp"
                    className="block px-3 py-1.5 rounded hover:bg-primary-content/10 transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    SWP
                  </Link>
                </div>
              </nav>
            </div>
            {isAuthenticated && user && (
              <div className="border-t border-primary-content/20 pt-4 mt-6 space-y-2">
                <p className="text-xs truncate opacity-70 mb-1">{user.email}</p>
                {user.subscription_status !== 'active' && user.role !== 'admin' && (
                  <Link
                    to="/upgrade"
                    className="btn btn-warning btn-sm w-full font-bold shadow-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    ⚡ Unlock Mutual Funds Pro (₹29/mo)
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    void handleLogout();
                  }}
                  className="btn btn-outline btn-sm w-full border-primary-content text-primary-content"
                >
                  Sign Out
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
};
export default TopBar;
