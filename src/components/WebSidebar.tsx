'use client';
import React, { useEffect, useState } from 'react';
import { useLocation } from '@/navigation';
import Link from './PrefetchLink';
import { useSidebar } from '@/context/SidebarContext';
import { useAuth } from '@/context/useAuth';
import { NAVIGATION_SECTIONS, ADMIN_SECTION, NavigationItem } from '@/data/navigation';
import styles from './WebSidebar.module.scss';
const WebSidebar: React.FC = () => {
  const { isCollapsed } = useSidebar();
  const { pathname } = useLocation();
  const { isAdmin } = useAuth();
  // AuthContext seeds the user from localStorage, so isAdmin is false during
  // SSR but true on the first client render. Gate the admin section behind
  // mount to keep the hydrated tree identical to the server one.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPendingPath(null);
  }, [pathname]);
  const isItemActive = (item: NavigationItem) => {
    if (pathname === item.href) return true;
    if (item.aliases?.includes(pathname)) return true;
    return false;
  };
  const allSections = mounted && isAdmin ? [...NAVIGATION_SECTIONS, ADMIN_SECTION] : NAVIGATION_SECTIONS;
  return (
    <aside
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : styles.expanded}`}
      aria-label="Sidebar Navigation"
    >
      <nav className={styles.navBody}>
        {allSections.map((section, sIdx) => (
          <div key={section.title} className={styles.section}>
            {isCollapsed ? (
              sIdx > 0 && <div className={styles.sectionDivider} />
            ) : (
              <div className={styles.sectionHeader}>{section.title}</div>
            )}
            {section.items.map((item) => {
              const active = isItemActive(item);
              const isPending = pendingPath === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`${styles.navItem} ${active ? styles.active : ''} ${
                    isPending ? styles.pending : ''
                  } ${
                    isCollapsed ? styles.navItemCollapsed : styles.navItemExpanded
                  }`}
                  onClick={() => {
                    if (pathname !== item.href) setPendingPath(item.href);
                  }}
                  title={item.name}
                  aria-label={item.name}
                >
                  <Icon className={styles.itemIcon} size={isCollapsed ? 20 : 18} />
                  {!isCollapsed && <span className={styles.itemText}>{item.name}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
};
export default WebSidebar;
