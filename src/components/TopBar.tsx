import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';
const TopBar = ({ className }: { className?: string }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const title =
    pathname === '/emi'
      ? 'EMI Calculator'
      : pathname === '/mutual-funds'
        ? 'Mutual Funds'
        : 'Investment Calculator';
  const [navTitle, setNavTitle] = useState(title);
  return (
    <>
      <div
        className={`flex items-center gap-2 bg-primary text-primary-content font-semibold ${className}`}
      >
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
        <Logo /> {navTitle}
      </div>
      {isMenuOpen && (
        <div className="fixed inset-0 z-50" role="presentation">
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default"
            aria-label="Close navigation menu"
            onClick={() => setIsMenuOpen(false)}
          />
          <aside
            id="navigation-drawer"
            className="bg-primary relative h-full w-72 max-w-[85vw] p-4 text-primary-content shadow-xl"
            aria-label="Navigation menu"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Financial Calculator</h2>
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
            <nav aria-label="Calculator pages" className="text-primary-content">
              <Link
                to="/"
                onClick={() => {
                  setNavTitle('Investment Calculator');
                  setIsMenuOpen(false);
                }}
              >
                Investment Calculator
              </Link>
              <Link
                to="/admin"
                onClick={() => {
                  setNavTitle('Data administration');
                  setIsMenuOpen(false);
                }}
              >
                Data administration
              </Link>
              <Link
                to="/emi"
                onClick={() => {
                  setNavTitle('EMI Calculator');
                  setIsMenuOpen(false);
                }}
              >
                EMI Calculator
              </Link>
              <div className="mt-4">
                <h3 className="px-4 text-xs font-bold uppercase tracking-wide ">Deposits</h3>
                <Link
                  to="/deposits/fd"
                  onClick={() => {
                    setNavTitle('Fixed Deposits');
                    setIsMenuOpen(false);
                  }}
                >
                  Fixed Deposits
                </Link>
                <Link
                  to="/deposits/rd"
                  onClick={() => {
                    setNavTitle('Recurring Deposits');
                    setIsMenuOpen(false);
                  }}
                >
                  Recurring Deposits
                </Link>
              </div>
              <div className="mt-4">
                <h3 className="px-4 text-xs font-bold uppercase tracking-wide">Economics</h3>
                <Link
                  to="/economics/inflation-rates"
                  onClick={() => {
                    setNavTitle('Inflation Rates');
                    setIsMenuOpen(false);
                  }}
                >
                  Inflation Rates
                </Link>
                <Link
                  to="/economics/ppp-exchange-rate"
                  onClick={() => {
                    setNavTitle('PPP Exchange Rate');
                    setIsMenuOpen(false);
                  }}
                >
                  PPP Exchange Rate
                </Link>
              </div>
              <div className="mt-4">
                <h3 className="px-4 text-xs font-bold uppercase tracking-wide">Fixed Plans</h3>
                <Link
                  to="/fixed-plans/fixed-rate-sip"
                  onClick={() => {
                    setNavTitle('Fixed Rate SIP');
                    setIsMenuOpen(false);
                  }}
                >
                  Fixed Rate SIP
                </Link>
                <Link
                  to="/fixed-plans/fixed-rate-swp"
                  onClick={() => {
                    setNavTitle('Fixed Rate SWP');
                    setIsMenuOpen(false);
                  }}
                >
                  Fixed Rate SWP
                </Link>
              </div>
              <div className="mt-4">
                <h3 className="px-4 text-xs font-bold uppercase tracking-wide">Mutual Funds</h3>
                <Link
                  to="/mutual-funds/lumpsum"
                  onClick={() => {
                    setNavTitle('Lumpsum');
                    setIsMenuOpen(false);
                  }}
                >
                  Lumpsum
                </Link>
                <Link
                  to="/mutual-funds/sip"
                  onClick={() => {
                    setNavTitle('SIP');
                    setIsMenuOpen(false);
                  }}
                >
                  SIP
                </Link>
                <Link
                  to="/mutual-funds/swp"
                  onClick={() => {
                    setNavTitle('SWP');
                    setIsMenuOpen(false);
                  }}
                >
                  SWP
                </Link>
              </div>
            </nav>
          </aside>
        </div>
      )}
    </>
  );
};
export default TopBar;
