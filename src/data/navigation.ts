import React from 'react';
import {
  FiAward,
  FiBarChart2,
  FiBox,
  FiBriefcase,
  FiCalendar,
  FiClock,
  FiCompass,
  FiCpu,
  FiDatabase,
  FiDollarSign,
  FiEdit3,
  FiFileText,
  FiGlobe,
  FiGrid,
  FiHome,
  FiInfo,
  FiLayers,
  FiPercent,
  FiPieChart,
  FiPlayCircle,
  FiRepeat,
  FiServer,
  FiShield,
  FiTrendingUp,
  FiTruck,
  FiUploadCloud,
  FiUsers,
  FiZap,
} from 'react-icons/fi';
import { LuBomb } from 'react-icons/lu';
export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  aliases?: string[];
  isPro?: boolean;
}
export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}
export const NAVIGATION_SECTIONS: NavigationSection[] = [
  {
    title: 'Mutual Funds',
    items: [
      { name: 'Lumpsum Returns', href: '/mutual-funds/lumpsum', icon: FiPieChart },
      { name: 'MF SIP Explorer', href: '/mutual-funds/sip', icon: FiTrendingUp },
      { name: 'MF SWP Explorer', href: '/mutual-funds/swp', icon: FiBarChart2 },
      { name: 'Strategy Builder', href: '/strategy-calculator', icon: FiRepeat, aliases: ['/mutual-funds/strategy'] },
    ],
  },
  {
    title: 'Banking & Loans',
    items: [
      { name: 'EMI Calculator', href: '/emi-calculator', icon: FiPercent, aliases: ['/emi'] },
      { name: 'Fixed Deposits (FD)', href: '/fd-calculator', icon: FiBriefcase, aliases: ['/deposits/fd'] },
      { name: 'Recurring Deposits (RD)', href: '/rd-calculator', icon: FiRepeat, aliases: ['/deposits/rd'] },
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
      { name: 'Property Tax (Indexation)', href: '/property-tax-calculator', icon: FiHome, aliases: ['/property-tax', '/tax/property-tax', '/capital-gains-property'] },
      { name: 'Upload Form 16 & File ITR', href: '/file-itr', icon: FiUploadCloud, aliases: ['/file-income-tax-return'] },
    ],
  },
  {
    title: 'Economics & Currency',
    items: [
      { name: 'Currency Converter', href: '/currency-converter', icon: FiGlobe, aliases: ['/utilities/currency-converter', '/economics/currency-converter'] },
      { name: 'PPP Exchange Rate', href: '/ppp-calculator', icon: FiCompass, aliases: ['/economics/ppp-exchange-rate'] },
      { name: 'Inflation Rates', href: '/inflation-calculator', icon: FiZap, aliases: ['/economics/inflation-rates'] },
      { name: 'FII / DII Tracker', href: '/fii-dii', icon: FiBarChart2, aliases: ['/economics/fii-dii', '/fii-dii-tracker'] },
    ],
  },
  {
    title: 'Utilities',
    items: [
      { name: 'Calculator', href: '/calculator', icon: FiCpu, aliases: ['/utilities/calculator'] },
      { name: 'Unit Converter', href: '/utilities/unit-converter', icon: FiGrid },
      { name: 'Date Calculator', href: '/date-calculator', icon: FiClock, aliases: ['/utilities/date-calculator'] },
      { name: 'Quick Notes', href: '/utilities/quick-notes', icon: FiEdit3, aliases: ['/admin/quick-notes', '/admin/notes', '/notes'], isPro: true },
    ],
  },
  {
    title: 'Games',
    items: [
      { name: 'All Games', href: '/games', icon: FiPlayCircle },
      { name: 'Word Path', href: '/games/word-path', icon: FiCompass, aliases: ['/word-path'] },
      { name: 'Sudoku', href: '/games/sudoku', icon: FiGrid, aliases: ['/sudoku'] },
      { name: 'Minesweeper', href: '/games/minesweeper', icon: LuBomb, aliases: ['/minesweeper'] },
      { name: 'Slide Puzzle', href: '/games/slide-puzzle', icon: FiBox, aliases: ['/slide-puzzle'] },
      { name: 'Hitori', href: '/games/hitori', icon: FiGrid, aliases: ['/hitori'] },
      { name: 'Tango', href: '/games/tango', icon: FiGrid, aliases: ['/tango', '/binairo'] },
      { name: 'Queens', href: '/games/queens', icon: FiAward, aliases: ['/queens'] },
    ],
  },
  {
    title: 'Info & Legal',
    items: [
      { name: 'About Us', href: '/about', icon: FiInfo },
      { name: 'Privacy Policy', href: '/privacy', icon: FiShield },
      { name: 'Disclaimer', href: '/disclaimer', icon: FiFileText },
    ],
  },
];
export const ADMIN_SECTION: NavigationSection = {
  title: 'Admin',
  items: [
    { name: 'Data administration', href: '/admin', icon: FiDatabase },
    { name: 'Shiprocket Manager', href: '/admin/shiprocket', icon: FiTruck, aliases: ['/admin/shiprocket-manager'] },
    { name: 'Shiprocket Accounts', href: '/admin/shiprocket-accounts', icon: FiServer },
    { name: 'Shiprocket Customers', href: '/admin/shiprocket-customers', icon: FiUsers },
    { name: 'Shiprocket Rates', href: '/admin/shiprocket-rates', icon: FiTruck },
    { name: 'Volumetric Weight', href: '/admin/volumetric-weight', icon: FiBox },
    { name: 'Wood Calculator', href: '/admin/wood-calculator', icon: FiLayers },
  ],
};
