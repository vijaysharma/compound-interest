import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiAward,
  FiClock,
  FiGlobe,
  FiInfo,
  FiLayers,
  FiLogOut,
  FiMenu,
  FiPercent,
  FiShield,
  FiTrendingUp,
  FiX,
  FiZap,
} from 'react-icons/fi';
import Logo from './Logo';
import { useAuth } from '../context/useAuth';

const getNavTitle = (pathname: string) => {
  const titles: Record<string, string> = {
    '/': 'Rupee Calculator',
    '/login': 'Sign In',
    '/admin': 'Data administration',
    '/about': 'About',
    '/privacy': 'Privacy Policy',
    '/disclaimer': 'Disclaimer',
    '/emi': 'EMI Calculator',
    '/emi-calculator': 'EMI Calculator',
    '/deposits/fd': 'Fixed Deposits',
    '/fd-calculator': 'Fixed Deposits',
    '/deposits/rd': 'Recurring Deposits',
    '/rd-calculator': 'Recurring Deposits',
    '/compound-interest-calculator': 'Compound Interest',
    '/economics/inflation-rates': 'Inflation Rates',
    '/inflation-calculator': 'Inflation Rates',
    '/economics/ppp-exchange-rate': 'PPP Exchange Rate',
    '/ppp-calculator': 'PPP Exchange Rate',
    '/fixed-plans/fixed-rate-sip': 'Fixed Rate SIP',
    '/sip-calculator': 'SIP Calculator',
    '/fixed-plans/fixed-rate-swp': 'Fixed Rate SWP',
    '/swp-calculator': 'SWP Calculator',
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
            <FiMenu className="h-5 w-5" aria-hidden="true" />
          </button>
          <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Logo /> <span className="truncate">{navTitle}</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <span className="hidden sm:inline-flex badge badge-accent badge-sm font-bold uppercase text-[10px] items-center gap-1">
                  <FiShield className="h-3 w-3" />
                  Admin
                </span>
              ) : user.subscription_status === 'active' ? (
                <span className="hidden sm:inline-flex badge badge-accent badge-sm font-bold items-center gap-1 text-[10px]">
                  <FiAward className="h-3 w-3" />
                  Pro Active
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPaywall(true)}
                  className={`btn btn-xs ${user.isBlocked ? 'btn-warning animate-pulse' : 'btn-outline border-primary-content text-primary-content hover:bg-primary-content hover:text-primary'} items-center gap-1 font-normal`}
                  title={`${user.api_usage_count ?? 0}/${user.freeLimit ?? 10} Mutual Fund live calculations used in 48h trial. Other calculators are free for 48 hours.`}
                >
                  <FiZap className="h-3 w-3" />
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
                  <FiX className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <nav
                aria-label="Calculator pages"
                className="text-primary-content flex flex-col gap-1.5"
              >
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-primary-content/10 transition-colors text-accent font-semibold"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FiShield className="h-4 w-4 shrink-0" />
                    <span>Data administration</span>
                  </Link>
                )}
                <div className="mt-3">
                  <h3 className="px-3 text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-1.5 mb-1">
                    <FiPercent className="h-3.5 w-3.5" />
                    <span>Loans</span>
                  </h3>
                  <Link
                    to="/emi-calculator"
                    className="block px-3 py-1.5 rounded hover:bg-primary-content/10 transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    EMI Calculator
                  </Link>
                </div>
                <div className="mt-3">
                  <h3 className="px-3 text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-1.5 mb-1">
                    <FiLayers className="h-3.5 w-3.5" />
                    <span>Deposits</span>
                  </h3>
                  <Link
                    to="/fd-calculator"
                    className="block px-3 py-1.5 rounded hover:bg-primary-content/10 transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Fixed Deposits
                  </Link>
                  <Link
                    to="/rd-calculator"
                    className="block px-3 py-1.5 rounded hover:bg-primary-content/10 transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Recurring Deposits
                  </Link>
                </div>
                <div className="mt-3">
                  <h3 className="px-3 text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-1.5 mb-1">
                    <FiGlobe className="h-3.5 w-3.5" />
                    <span>Economics</span>
                  </h3>
                  <Link
                    to="/inflation-calculator"
                    className="block px-3 py-1.5 rounded hover:bg-primary-content/10 transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Inflation Rates
                  </Link>
                  <Link
                    to="/ppp-calculator"
                    className="block px-3 py-1.5 rounded hover:bg-primary-content/10 transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    PPP Exchange Rate
                  </Link>
                </div>
                <div className="mt-3">
                  <h3 className="px-3 text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-1.5 mb-1">
                    <FiClock className="h-3.5 w-3.5" />
                    <span>Fixed Plans</span>
                  </h3>
                  <Link
                    to="/sip-calculator"
                    className="block px-3 py-1.5 rounded hover:bg-primary-content/10 transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    SIP Calculator
                  </Link>
                  <Link
                    to="/swp-calculator"
                    className="block px-3 py-1.5 rounded hover:bg-primary-content/10 transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    SWP Calculator
                  </Link>
                </div>
                <div className="mt-3">
                  <h3 className="px-3 text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-1.5 mb-1">
                    <FiTrendingUp className="h-3.5 w-3.5" />
                    <span>Mutual Funds</span>
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
                <div className="mt-3 border-t border-primary-content/20 pt-3">
                  <h3 className="px-3 text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-1.5 mb-1">
                    <FiInfo className="h-3.5 w-3.5" />
                    <span>Info &amp; Legal</span>
                  </h3>
                  <Link
                    to="/about"
                    className="block px-3 py-1.5 rounded hover:bg-primary-content/10 transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    About Us
                  </Link>
                  <Link
                    to="/privacy"
                    className="block px-3 py-1.5 rounded hover:bg-primary-content/10 transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    to="/disclaimer"
                    className="block px-3 py-1.5 rounded hover:bg-primary-content/10 transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Disclaimer
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
                    className="btn btn-warning btn-sm w-full font-bold shadow-sm flex items-center justify-center gap-1.5"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FiZap className="h-4 w-4" />
                    <span>Unlock Pro (₹29/mo)</span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    void handleLogout();
                  }}
                  className="btn btn-outline btn-sm w-full border-primary-content text-primary-content flex items-center justify-center gap-1.5"
                >
                  <FiLogOut className="h-4 w-4" />
                  <span>Sign Out</span>
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
