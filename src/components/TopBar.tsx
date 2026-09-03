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
  FiTool,
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
    '/calculator': 'Calculator',
    '/utilities/calculator': 'Calculator',
    '/date-calculator': 'Date Calculator',
    '/utilities/date-calculator': 'Date Calculator',
    '/utilities/unit-converter': 'Unit Converter',
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
            className="bg-primary relative h-full w-64 max-w-[80vw] p-3 text-primary-content shadow-xl flex flex-col justify-between overflow-y-auto"
            aria-label="Navigation menu"
          >
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-bold">Rupee Calculator</h2>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs btn-square text-primary-content"
                  aria-label="Close navigation menu"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiX className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <nav
                aria-label="Calculator pages"
                className="text-primary-content flex flex-col gap-0.5"
              >
                {isAdmin && (
                  <div className="mt-1.5">
                    <h3 className="px-2 text-[11px] font-bold uppercase tracking-wider opacity-60 flex items-center gap-1.5 mb-0.5">
                      <FiShield className="h-3 w-3" />
                      <span>Admin</span>
                    </h3>
                    <Link
                      to="/admin"
                      className="block px-2.5 py-1 rounded hover:bg-primary-content/10 transition-colors text-xs"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Data administration
                    </Link>
                  </div>
                )}
                <div className="mt-1.5">
                  <h3 className="px-2 text-[11px] font-bold uppercase tracking-wider opacity-60 flex items-center gap-1.5 mb-0.5">
                    <FiPercent className="h-3 w-3" />
                    <span>Loans</span>
                  </h3>
                  <Link
                    to="/emi-calculator"
                    className="block px-2.5 py-1 rounded hover:bg-primary-content/10 transition-colors text-xs"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    EMI Calculator
                  </Link>
                </div>
                <div className="mt-1.5">
                  <h3 className="px-2 text-[11px] font-bold uppercase tracking-wider opacity-60 flex items-center gap-1.5 mb-0.5">
                    <FiLayers className="h-3 w-3" />
                    <span>Deposits</span>
                  </h3>
                  <Link
                    to="/fd-calculator"
                    className="block px-2.5 py-1 rounded hover:bg-primary-content/10 transition-colors text-xs"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Fixed Deposits
                  </Link>
                  <Link
                    to="/rd-calculator"
                    className="block px-2.5 py-1 rounded hover:bg-primary-content/10 transition-colors text-xs"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Recurring Deposits
                  </Link>
                </div>
                <div className="mt-1.5">
                  <h3 className="px-2 text-[11px] font-bold uppercase tracking-wider opacity-60 flex items-center gap-1.5 mb-0.5">
                    <FiGlobe className="h-3 w-3" />
                    <span>Economics</span>
                  </h3>
                  <Link
                    to="/inflation-calculator"
                    className="block px-2.5 py-1 rounded hover:bg-primary-content/10 transition-colors text-xs"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Inflation Rates
                  </Link>
                  <Link
                    to="/ppp-calculator"
                    className="block px-2.5 py-1 rounded hover:bg-primary-content/10 transition-colors text-xs"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    PPP Exchange Rate
                  </Link>
                </div>
                <div className="mt-1.5">
                  <h3 className="px-2 text-[11px] font-bold uppercase tracking-wider opacity-60 flex items-center gap-1.5 mb-0.5">
                    <FiClock className="h-3 w-3" />
                    <span>Fixed Plans</span>
                  </h3>
                  <Link
                    to="/sip-calculator"
                    className="block px-2.5 py-1 rounded hover:bg-primary-content/10 transition-colors text-xs"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    SIP Calculator
                  </Link>
                  <Link
                    to="/swp-calculator"
                    className="block px-2.5 py-1 rounded hover:bg-primary-content/10 transition-colors text-xs"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    SWP Calculator
                  </Link>
                </div>
                <div className="mt-1.5">
                  <h3 className="px-2 text-[11px] font-bold uppercase tracking-wider opacity-60 flex items-center gap-1.5 mb-0.5">
                    <FiTrendingUp className="h-3 w-3" />
                    <span>Mutual Funds</span>
                  </h3>
                  <Link
                    to="/mutual-funds/lumpsum"
                    className="block px-2.5 py-1 rounded hover:bg-primary-content/10 transition-colors text-xs"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Lumpsum
                  </Link>
                  <Link
                    to="/mutual-funds/sip"
                    className="block px-2.5 py-1 rounded hover:bg-primary-content/10 transition-colors text-xs"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    SIP
                  </Link>
                  <Link
                    to="/mutual-funds/swp"
                    className="block px-2.5 py-1 rounded hover:bg-primary-content/10 transition-colors text-xs"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    SWP
                  </Link>
                </div>
                <div className="mt-1.5">
                  <h3 className="px-2 text-[11px] font-bold uppercase tracking-wider opacity-60 flex items-center gap-1.5 mb-0.5">
                    <FiTool className="h-3 w-3" />
                    <span>Utilities</span>
                  </h3>
                  <Link
                    to="/calculator"
                    className="block px-2.5 py-1 rounded hover:bg-primary-content/10 transition-colors text-xs"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Calculator (Basic &amp; Scientific)
                  </Link>
                  <Link
                    to="/date-calculator"
                    className="block px-2.5 py-1 rounded hover:bg-primary-content/10 transition-colors text-xs"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Date Calculator
                  </Link>
                  <Link
                    to="/utilities/unit-converter"
                    className="block px-2.5 py-1 rounded hover:bg-primary-content/10 transition-colors text-xs"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Unit Converter
                  </Link>
                </div>
                <div className="mt-2 border-t border-primary-content/20 pt-2">
                  <h3 className="px-2 text-[11px] font-bold uppercase tracking-wider opacity-60 flex items-center gap-1.5 mb-0.5">
                    <FiInfo className="h-3 w-3" />
                    <span>Info &amp; Legal</span>
                  </h3>
                  <Link
                    to="/about"
                    className="block px-2.5 py-1 rounded hover:bg-primary-content/10 transition-colors text-xs"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    About Us
                  </Link>
                  <Link
                    to="/privacy"
                    className="block px-2.5 py-1 rounded hover:bg-primary-content/10 transition-colors text-xs"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    to="/disclaimer"
                    className="block px-2.5 py-1 rounded hover:bg-primary-content/10 transition-colors text-xs"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Disclaimer
                  </Link>
                </div>
              </nav>
            </div>
            {isAuthenticated && user && (
              <div className="border-t border-primary-content/20 pt-2 mt-3 space-y-1.5">
                <p className="text-xs truncate opacity-70 mb-0.5">{user.email}</p>
                {user.subscription_status !== 'active' && user.role !== 'admin' && (
                  <Link
                    to="/upgrade"
                    className="btn btn-warning btn-xs w-full font-bold shadow-sm flex items-center justify-center gap-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FiZap className="h-3.5 w-3.5" />
                    <span>Unlock Pro (₹29/mo)</span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    void handleLogout();
                  }}
                  className="btn btn-outline btn-xs w-full border-primary-content text-primary-content flex items-center justify-center gap-1"
                >
                  <FiLogOut className="h-3.5 w-3.5" />
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
