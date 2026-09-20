'use client';
import React from 'react';
import {
  FiSmartphone,
  FiCreditCard,
  FiUsers,
  FiRefreshCw,
  FiCpu,
} from 'react-icons/fi';
import type { TabType } from './types';
import styles from '../../../views/Admin.module.scss';
export interface AdminHeaderProps {
  userEmail?: string;
  activeTab: TabType;
  pendingCount: number;
  usersCount: number;
  onSelectTab: (tab: TabType) => void;
}
export const AdminHeader: React.FC<AdminHeaderProps> = React.memo(
  ({ userEmail, activeTab, pendingCount, usersCount, onSelectTab }) => (
    <>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Admin Portal &amp; Management</h1>
          <p className={styles.subtitle}>
            Configure UPI QR payments, approve subscriptions, manage user quotas, and sync datasets.
          </p>
        </div>
        {userEmail && (
          <div className={styles.adminBadge}>
            Admin: {userEmail}
          </div>
        )}
      </div>
      <div className={styles.tabsNav}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'payments' ? styles.tabActive : ''}`}
          onClick={() => onSelectTab('payments')}
        >
          <FiSmartphone size={16} />
          <span>UPI &amp; QR Settings</span>
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'submissions' ? styles.tabActive : ''}`}
          onClick={() => onSelectTab('submissions')}
        >
          <FiCreditCard size={16} />
          <span>
            Payment Submissions ({pendingCount})
          </span>
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'users' ? styles.tabActive : ''}`}
          onClick={() => onSelectTab('users')}
        >
          <FiUsers size={16} />
          <span>Users &amp; Quotas ({usersCount})</span>
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'sync' ? styles.tabActive : ''}`}
          onClick={() => onSelectTab('sync')}
        >
          <FiRefreshCw size={16} />
          <span>Dataset Sync</span>
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'ai' ? styles.tabActive : ''}`}
          onClick={() => onSelectTab('ai')}
        >
          <FiCpu size={16} />
          <span>AI Tax Advisor</span>
        </button>
      </div>
    </>
  )
);
AdminHeader.displayName = 'AdminHeader';
