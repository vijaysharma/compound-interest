import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Link from './PrefetchLink';
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
import styles from './TopBar.module.scss';
const getNavTitle = (pathname: string) => {
  const titles: Record<string, string> = {
    '/': 'Rupee Calculator',
    '/temp-value-picker': 'ValuePicker Preview',
    '/demo/value-picker': 'ValuePicker Preview',
    '/login': 'Sign In',
    '/admin': 'Data administration',
    '/admin/shiprocket-rates': 'Shiprocket Rates',
    '/admin/volumetric-weight': 'Volumetric Weight',
    '/admin/wood-calculator': 'Wood Calculator',
    '/admin/quick-notes': 'Quick Notes',
    '/utilities/quick-notes': 'Quick Notes',
    '/admin/notes': 'Quick Notes',
    '/notes': 'Quick Notes',
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
    '/currency-converter': 'Currency Converter',
    '/utilities/currency-converter': 'Currency Converter',
    '/economics/currency-converter': 'Currency Converter',
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
    try {
      localStorage.removeItem('last_visited_route');
      sessionStorage.setItem('stay_on_home', 'true');
    } catch {
      // ignore
    }
    await logout();
    navigate('/', { replace: true, state: { stayOnHome: true } });
  };
  return (
    <>
      <header className={`${styles.header} ${className || ''}`.trim()}>
        <div className={styles.leftSection}>
          <button
            type="button"
            className={styles.menuBtn}
            aria-label="Open navigation menu"
            aria-expanded={isMenuOpen}
            aria-controls="navigation-drawer"
            onClick={() => setIsMenuOpen(true)}
          >
            <FiMenu className={styles.menuIcon} aria-hidden="true" />
          </button>
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
            className={styles.logoLink}
          >
            <Logo /> <span className={styles.title}>{navTitle}</span>
          </Link>
        </div>
        <div className={styles.rightSection}>
          {isAuthenticated && user ? (
            <div className={styles.userContainer}>
              {isAdmin ? (
                <span className={styles.badgeAdmin}>
                  <FiShield className={styles.badgeIcon} />
                  Admin
                </span>
              ) : user.subscription_status === 'active' ? (
                <span className={styles.badgePro}>
                  <FiAward className={styles.badgeIcon} />
                  Pro Active
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPaywall(true)}
                  className={`${styles.paywallBtn} ${user.isBlocked ? styles.warningPulse : ''}`.trim()}
                  title={`${user.api_usage_count ?? 0}/${user.freeLimit ?? 15} live calculations used in 48h trial. Other calculators are free for 48 hours.`}
                >
                  <FiZap className={styles.badgeIcon} />
                  <span>
                    {user.api_usage_count ?? 0}/{user.freeLimit ?? 15} Live
                  </span>
                  <span className={styles.proPrice}>₹54 Pro</span>
                </button>
              )}
              <div className={styles.userEmailCol}>
                <span className={styles.userNameText}>
                  {user.name || user.email}
                </span>
              </div>
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name || user.email}
                  className={styles.userAvatar}
                />
              ) : (
                <div className={styles.userInitial}>
                  {(user.name || user.email).charAt(0)}
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className={styles.signInBtn}
            >
              Sign in
            </Link>
          )}
        </div>
      </header>
      {isMenuOpen && (
        <div className={styles.drawerModal} role="presentation">
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Close navigation menu"
            onClick={() => setIsMenuOpen(false)}
          />
          <aside
            id="navigation-drawer"
            className={styles.drawerAside}
            aria-label="Navigation menu"
          >
            <div>
              <div className={styles.drawerHeader}>
                <h2 className={styles.drawerTitle}>Rupee Calculator</h2>
                <button
                  type="button"
                  className={styles.drawerCloseBtn}
                  aria-label="Close navigation menu"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiX className={styles.menuIcon} aria-hidden="true" />
                </button>
              </div>
              <nav
                aria-label="Calculator pages"
                className={styles.navGroup}
              >
                {isAdmin && (
                  <div className={styles.navSection}>
                    <h3 className={styles.navCategoryTitle}>
                      <FiShield className={styles.navCategoryIcon} />
                      <span>Admin</span>
                    </h3>
                    <Link
                      to="/admin"
                      className={styles.navLink}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Data administration
                    </Link>
                    <Link
                      to="/admin/shiprocket-rates"
                      className={styles.navLink}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Shiprocket Rates
                    </Link>
                    <Link
                      to="/admin/volumetric-weight"
                      className={styles.navLink}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Volumetric Weight
                    </Link>
                    <Link
                      to="/admin/wood-calculator"
                      className={styles.navLink}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Wood Calculator
                    </Link>
                  </div>
                )}
                <div className={styles.navSection}>
                  <h3 className={styles.navCategoryTitle}>
                    <FiPercent className={styles.navCategoryIcon} />
                    <span>Loans</span>
                  </h3>
                  <Link
                    to="/emi-calculator"
                    className={styles.navLink}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    EMI Calculator
                  </Link>
                </div>
                <div className={styles.navSection}>
                  <h3 className={styles.navCategoryTitle}>
                    <FiLayers className={styles.navCategoryIcon} />
                    <span>Deposits</span>
                  </h3>
                  <Link
                    to="/fd-calculator"
                    className={styles.navLink}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Fixed Deposits
                  </Link>
                  <Link
                    to="/rd-calculator"
                    className={styles.navLink}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Recurring Deposits
                  </Link>
                </div>
                <div className={styles.navSection}>
                  <h3 className={styles.navCategoryTitle}>
                    <FiGlobe className={styles.navCategoryIcon} />
                    <span>Economics</span>
                  </h3>
                  <Link
                    to="/inflation-calculator"
                    className={styles.navLink}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Inflation Rates
                  </Link>
                  <Link
                    to="/ppp-calculator"
                    className={styles.navLink}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    PPP Exchange Rate
                  </Link>
                  <Link
                    to="/currency-converter"
                    className={styles.navLink}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Currency Converter
                  </Link>
                </div>
                <div className={styles.navSection}>
                  <h3 className={styles.navCategoryTitle}>
                    <FiClock className={styles.navCategoryIcon} />
                    <span>Fixed Plans</span>
                  </h3>
                  <Link
                    to="/sip-calculator"
                    className={styles.navLink}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    SIP Calculator
                  </Link>
                  <Link
                    to="/swp-calculator"
                    className={styles.navLink}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    SWP Calculator
                  </Link>
                </div>
                <div className={styles.navSection}>
                  <h3 className={styles.navCategoryTitle}>
                    <FiTrendingUp className={styles.navCategoryIcon} />
                    <span>Mutual Funds</span>
                  </h3>
                  <Link
                    to="/mutual-funds/lumpsum"
                    className={styles.navLink}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Lumpsum
                  </Link>
                  <Link
                    to="/mutual-funds/sip"
                    className={styles.navLink}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    SIP
                  </Link>
                  <Link
                    to="/mutual-funds/swp"
                    className={styles.navLink}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    SWP
                  </Link>
                </div>
                <div className={styles.navSection}>
                  <h3 className={styles.navCategoryTitle}>
                    <FiTool className={styles.navCategoryIcon} />
                    <span>Utilities</span>
                  </h3>
                  <Link
                    to="/calculator"
                    className={styles.navLink}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Calculator (Basic &amp; Scientific)
                  </Link>
                  <Link
                    to="/date-calculator"
                    className={styles.navLink}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Date Calculator
                  </Link>
                  <Link
                    to="/utilities/unit-converter"
                    className={styles.navLink}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Unit Converter
                  </Link>
                  <Link
                    to="/utilities/quick-notes"
                    className={`${styles.navLink} ${styles.between}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span>Quick Notes</span>
                    <span className={styles.proPill}>
                      Pro
                    </span>
                  </Link>
                </div>
                <div className={`${styles.navSection} ${styles.dividerTop}`}>
                  <h3 className={styles.navCategoryTitle}>
                    <FiInfo className={styles.navCategoryIcon} />
                    <span>Info &amp; Legal</span>
                  </h3>
                  <Link
                    to="/about"
                    className={styles.navLink}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    About Us
                  </Link>
                  <Link
                    to="/privacy"
                    className={styles.navLink}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    to="/disclaimer"
                    className={styles.navLink}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Disclaimer
                  </Link>
                </div>
              </nav>
            </div>
            {isAuthenticated && user && (
              <div className={styles.drawerFooter}>
                <p className={styles.userEmailText}>{user.email}</p>
                {user.subscription_status !== 'active' && user.role !== 'admin' && (
                  <Link
                    to="/upgrade"
                    className={styles.unlockProBtn}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FiZap style={{ width: '0.875rem', height: '0.875rem' }} />
                    <span>Unlock Pro (₹54/mo)</span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    void handleLogout();
                  }}
                  className={styles.signOutBtn}
                >
                  <FiLogOut style={{ width: '0.875rem', height: '0.875rem' }} />
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
