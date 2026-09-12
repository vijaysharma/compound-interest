'use client';
import React, { useEffect, useState } from 'react';
import { useLocation } from '@/navigation';
import Link from './PrefetchLink';
import { useSidebar } from '@/context/SidebarContext';
import { useAuth } from '@/context/useAuth';
import {
  FiActivity,
  FiAward,
  FiBarChart2,
  FiBox,
  FiBriefcase,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiCompass,
  FiCpu,
  FiDatabase,
  FiDollarSign,
  FiEdit3,
  FiFileText,
  FiGlobe,
  FiGrid,
  FiLayers,
  FiPercent,
  FiPieChart,
  FiRepeat,
  FiShield,
  FiTrendingUp,
  FiTruck,
  FiZap,
} from 'react-icons/fi';
import styles from './WebSidebar.module.scss';
interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  aliases?: string[];
}
interface SidebarSection {
  title: string;
  items: SidebarItem[];
}
const SECTIONS: SidebarSection[] = [
  {
    title: 'Mutual Funds',
    items: [
      { name: 'Lumpsum Returns', href: '/mutual-funds/lumpsum', icon: FiPieChart },
      { name: 'MF SIP Explorer', href: '/mutual-funds/sip', icon: FiTrendingUp },
      { name: 'MF SWP Explorer', href: '/mutual-funds/swp', icon: FiBarChart2 },
    ],
  },
  {
    title: 'Banking & Loans',
    items: [
      { name: 'EMI Calculator', href: '/emi-calculator', icon: FiPercent, aliases: ['/emi'] },
      { name: 'Fixed Deposits (FD)', href: '/fd-calculator', icon: FiBriefcase, aliases: ['/deposits/fd'] },
      { name: 'Recurring Deposits (RD)', href: '/rd-calculator', icon: FiRepeat, aliases: ['/deposits/rd'] },
      { name: 'Compound Interest', href: '/compound-interest-calculator', icon: FiActivity },
    ],
  },
  {
    title: 'Fixed Plans',
    items: [
      { name: 'SIP Calculator', href: '/sip-calculator', icon: FiCalendar, aliases: ['/fixed-plans/fixed-rate-sip'] },
      { name: 'SWP Calculator', href: '/swp-calculator', icon: FiDollarSign, aliases: ['/fixed-plans/fixed-rate-swp'] },
      { name: 'PPF Calculator', href: '/ppf-calculator', icon: FiShield, aliases: ['/deposits/ppf', '/fixed-plans/ppf'] },
      { name: 'NPS Calculator', href: '/nps-calculator', icon: FiAward, aliases: ['/fixed-plans/nps'] },
    ],
  },
  {
    title: 'Taxes & Strategy',
    items: [
      { name: 'Income Tax Calculator', href: '/income-tax-calculator', icon: FiFileText, aliases: ['/tax-calculator', '/tax/income-tax'] },
    ],
  },
  {
    title: 'Economics & Currency',
    items: [
      { name: 'Currency Converter', href: '/currency-converter', icon: FiGlobe, aliases: ['/utilities/currency-converter', '/economics/currency-converter'] },
      { name: 'PPP Exchange Rate', href: '/ppp-calculator', icon: FiCompass, aliases: ['/economics/ppp-exchange-rate'] },
      { name: 'Inflation Rates', href: '/inflation-calculator', icon: FiZap, aliases: ['/economics/inflation-rates'] },
    ],
  },
  {
    title: 'Utilities',
    items: [
      { name: 'Calculator', href: '/calculator', icon: FiCpu, aliases: ['/utilities/calculator'] },
      { name: 'Unit Converter', href: '/utilities/unit-converter', icon: FiGrid },
      { name: 'Date Calculator', href: '/date-calculator', icon: FiClock, aliases: ['/utilities/date-calculator'] },
      { name: 'Quick Notes', href: '/utilities/quick-notes', icon: FiEdit3, aliases: ['/admin/quick-notes', '/admin/notes', '/notes'] },
    ],
  },
];
const ADMIN_SECTION: SidebarSection = {
  title: 'Admin',
  items: [
    { name: 'Data administration', href: '/admin', icon: FiDatabase },
    { name: 'Shiprocket Rates', href: '/admin/shiprocket-rates', icon: FiTruck },
    { name: 'Volumetric Weight', href: '/admin/volumetric-weight', icon: FiBox },
    { name: 'Wood Calculator', href: '/admin/wood-calculator', icon: FiLayers },
  ],
};
const WebSidebar: React.FC = () => {
  const { isCollapsed, toggleSidebar } = useSidebar();
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
  const isItemActive = (item: SidebarItem) => {
    if (pathname === item.href) return true;
    if (item.aliases?.includes(pathname)) return true;
    return false;
  };
  const allSections = mounted && isAdmin ? [...SECTIONS, ADMIN_SECTION] : SECTIONS;
  return (
    <aside
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : styles.expanded}`}
      aria-label="Sidebar Navigation"
    >
      <div className={`${styles.sidebarHeader} ${isCollapsed ? styles.sidebarHeaderCollapsed : ''}`}>
        {!isCollapsed && <span className={styles.headerTitle}>Calculators</span>}
        <button
          type="button"
          onClick={toggleSidebar}
          className={styles.toggleBtn}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
        </button>
      </div>
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
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`${styles.navItem} ${active ? styles.active : ''} ${
                    isCollapsed ? styles.navItemCollapsed : styles.navItemExpanded
                  }`}
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
