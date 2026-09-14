'use client';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from '@/navigation';
import Link from './PrefetchLink';
import {
  FiAward,
  FiLogOut,
  FiMenu,
  FiShield,
  FiX,
  FiZap,
} from 'react-icons/fi';
import Logo from './Logo';
import { useAuth } from '../context/useAuth';
import { useSidebar } from '@/context/SidebarContext';
import { NAVIGATION_SECTIONS, ADMIN_SECTION } from '@/data/navigation';
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
    '/ppf-calculator': 'PPF Calculator',
    '/deposits/ppf': 'PPF Calculator',
    '/fixed-plans/ppf': 'PPF Calculator',
    '/nps-calculator': 'NPS Calculator',
    '/fixed-plans/nps': 'NPS Calculator',
    '/income-tax-calculator': 'Income Tax Calculator',
    '/tax-calculator': 'Income Tax Calculator',
    '/tax/income-tax': 'Income Tax Calculator',
    '/file-itr': 'Upload Form 16 & File ITR',
    '/file-income-tax-return': 'Upload Form 16 & File ITR',
  };
  return titles[pathname] ?? 'Rupee Calculator';
};
const TopBar = ({ className }: { className?: string }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout, setShowPaywall } = useAuth();
  const { toggleSidebar } = useSidebar();
  const navTitle = getNavTitle(pathname);
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsMenuOpen(false);
  }
  const allSections = mounted && isAdmin ? [...NAVIGATION_SECTIONS, ADMIN_SECTION] : NAVIGATION_SECTIONS;
  useEffect(() => {
    if (!isProfileOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileOpen]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!isMenuOpen) return;
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);
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
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
            aria-controls="navigation-drawer"
            onClick={() => {
              // Matches the 768px breakpoint at which WebSidebar is shown.
              if (typeof window !== 'undefined' && window.innerWidth >= 768) {
                toggleSidebar();
              } else {
                setIsMenuOpen(true);
              }
            }}
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
          {mounted && isAuthenticated && user ? (
            <div className={styles.userContainer} ref={profileRef}>
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
              <button
                type="button"
                className={styles.profileTriggerBtn}
                onClick={() => setIsProfileOpen((prev) => !prev)}
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
                title="Account profile & options"
              >
                <div className={styles.userEmailCol}>
                  <span className={styles.userNameText}>{user.name || user.email}</span>
                </div>
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name || user.email}
                    className={styles.userAvatar}
                  />
                ) : (
                  <div className={styles.userInitial}>{(user.name || user.email).charAt(0)}</div>
                )}
              </button>
              {isProfileOpen && (
                <div className={styles.profileDropdown} role="menu">
                  <div className={styles.profileDropdownHeader}>
                    <div className={styles.profileDropdownInfo}>
                      <span className={styles.profileDropdownName}>{user.name || 'User'}</span>
                      <span className={styles.profileDropdownEmail}>{user.email}</span>
                    </div>
                    {isAdmin ? (
                      <span className={styles.badgeAdminInline}>Admin</span>
                    ) : user.subscription_status === 'active' ? (
                      <span className={styles.badgeProInline}>Pro Active</span>
                    ) : (
                      <span className={styles.badgeFreeInline}>Trial Account</span>
                    )}
                  </div>
                  <div className={styles.profileDropdownDivider} />
                  {user.subscription_status !== 'active' && !isAdmin && (
                    <button
                      type="button"
                      className={styles.profileDropdownItem}
                      onClick={() => {
                        setIsProfileOpen(false);
                        setShowPaywall(true);
                      }}
                    >
                      <FiZap className={styles.profileDropdownIcon} />
                      <span>Upgrade to Pro (₹54/mo)</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className={`${styles.profileDropdownItem} ${styles.profileDropdownLogout}`}
                    onClick={() => {
                      setIsProfileOpen(false);
                      void handleLogout();
                    }}
                  >
                    <FiLogOut className={styles.profileDropdownIcon} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className={styles.signInBtn}>
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
          <aside id="navigation-drawer" className={styles.drawerAside} aria-label="Navigation menu">
            <>
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
              <nav aria-label="Calculator pages" className={styles.navGroup}>
                {allSections.map((section) => (
                  <div
                    key={section.title}
                    className={`${styles.navSection} ${section.title === 'Info & Legal' ? styles.dividerTop : ''}`}
                  >
                    <h3 className={styles.navCategoryTitle}>
                      <span>{section.title}</span>
                    </h3>
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          className={`${styles.navLink} ${item.isPro ? styles.between : ''}`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <span className={styles.navLinkContent}>
                            <Icon className={styles.navItemIcon} size={16} />
                            <span>{item.name}</span>
                          </span>
                          {item.isPro && <span className={styles.proPill}>Pro</span>}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>
            </>
            {isAuthenticated && user && (
              <div className={styles.drawerFooter}>
                <p className={styles.userEmailText}>{user.email}</p>
                {user.subscription_status !== 'active' && user.role !== 'admin' && (
                  <Link
                    to="/upgrade"
                    className={styles.unlockProBtn}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FiZap className={styles.btnIcon} />
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
                  <FiLogOut className={styles.btnIcon} />
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
