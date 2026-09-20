'use client';
import React from 'react';
import { FiTruck, FiSend, FiClock, FiMapPin } from 'react-icons/fi';
import type { TabType } from './types';
import styles from '../ShiprocketDashboard.module.scss';
export interface ShiprocketTabsNavProps {
  activeTab: TabType;
  ordersCount: number;
  historyCount: number;
  onSelectTab: (tab: TabType) => void;
}
export const ShiprocketTabsNav: React.FC<ShiprocketTabsNavProps> = React.memo(
  ({ activeTab, ordersCount, historyCount, onSelectTab }) => (
    <div className={styles.tabsBar}>
      <button
        className={`${styles.tabBtn} ${activeTab === 'shipments' ? styles.tabActive : ''}`}
        onClick={() => onSelectTab('shipments')}
      >
        <FiTruck /> Shipments & Orders
        <span className={styles.tabBadge}>{ordersCount}</span>
      </button>
      <button
        className={`${styles.tabBtn} ${activeTab === 'create' ? styles.tabActive : ''}`}
        onClick={() => onSelectTab('create')}
      >
        <FiSend /> Create & Ship
      </button>
      <button
        className={`${styles.tabBtn} ${activeTab === 'history' ? styles.tabActive : ''}`}
        onClick={() => onSelectTab('history')}
      >
        <FiClock /> Wallet History
        <span className={styles.tabBadge}>{historyCount}</span>
      </button>
      <button
        className={`${styles.tabBtn} ${activeTab === 'company' ? styles.tabActive : ''}`}
        onClick={() => onSelectTab('company')}
      >
        <FiMapPin /> Company Profile
      </button>
    </div>
  )
);
ShiprocketTabsNav.displayName = 'ShiprocketTabsNav';
