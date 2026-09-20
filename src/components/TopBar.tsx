'use client';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from '@/navigation';
import Link from './PrefetchLink';
import { FiMenu } from 'react-icons/fi';
import Logo from './Logo';
import { useAuth } from '../context/useAuth';
import { useSidebar } from '@/context/SidebarContext';
import { NAVIGATION_SECTIONS, ADMIN_SECTION } from '@/data/navigation';
import { useScrollLock, forceUnlockScroll } from '../utilities/useScrollLock';
import { getNavTitle } from './topbar/navTitles';
import { TopBarProfileDropdown } from './topbar/TopBarProfileDropdown';
import { TopBarDrawer } from './topbar/TopBarDrawer';
import styles from './TopBar.module.scss';
const TopBar = ({ className }: { className?: string }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  useScrollLock(isMenuOpen);
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
    forceUnlockScroll();
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
      if (event.key === 'Escape') setIsProfileOpen(false);
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
            <TopBarProfileDropdown
              user={user}
              isAdmin={isAdmin}
              isProfileOpen={isProfileOpen}
              setIsProfileOpen={setIsProfileOpen}
              profileRef={profileRef}
              setShowPaywall={setShowPaywall}
              onLogout={handleLogout}
            />
          ) : (
            <Link to="/login" className={styles.signInBtn}>
              Sign in
            </Link>
          )}
        </div>
      </header>
      <TopBarDrawer
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        allSections={allSections}
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={handleLogout}
      />
    </>
  );
};
export default TopBar;
