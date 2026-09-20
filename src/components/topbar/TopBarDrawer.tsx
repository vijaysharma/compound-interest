import React from 'react';
import Link from '../PrefetchLink';
import { FiLogOut, FiX, FiZap } from 'react-icons/fi';
import type { NavigationSection } from '@/data/navigation';
import type { AuthUser } from '../../types/auth';
import styles from '../TopBar.module.scss';
interface TopBarDrawerProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  allSections: NavigationSection[];
  isAuthenticated: boolean;
  user: AuthUser | null;
  onLogout: () => Promise<void>;
}
export function TopBarDrawer({
  isMenuOpen,
  setIsMenuOpen,
  allSections,
  isAuthenticated,
  user,
  onLogout,
}: TopBarDrawerProps) {
  if (!isMenuOpen) return null;
  return (
    <div className={styles.drawerModal} role="presentation">
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Close navigation menu"
        onClick={() => setIsMenuOpen(false)}
      />
      <aside id="navigation-drawer" className={styles.drawerAside} aria-label="Navigation menu">
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
                void onLogout();
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
  );
}
