import React from 'react';
import { FiActivity, FiFileText, FiZap } from 'react-icons/fi';
import styles from './ErrorPage.module.scss';
export type ErrorTabKey = 'recovery' | 'diagnostics' | 'details';
interface ErrorTabsNavProps {
  activeTab: ErrorTabKey;
  onTabChange: (tab: ErrorTabKey) => void;
}
export const ErrorTabsNav: React.FC<ErrorTabsNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className={styles.tabsBar}>
      <button
        type="button"
        onClick={() => onTabChange('recovery')}
        className={`${styles.tabBtn} ${activeTab === 'recovery' ? styles.tabActive : ''}`}
      >
        <FiZap aria-hidden="true" /> Quick Recovery
      </button>
      <button
        type="button"
        onClick={() => onTabChange('diagnostics')}
        className={`${styles.tabBtn} ${activeTab === 'diagnostics' ? styles.tabActive : ''}`}
      >
        <FiActivity aria-hidden="true" /> Live Diagnostics
      </button>
      <button
        type="button"
        onClick={() => onTabChange('details')}
        className={`${styles.tabBtn} ${activeTab === 'details' ? styles.tabActive : ''}`}
      >
        <FiFileText aria-hidden="true" /> Technical Details
      </button>
    </div>
  );
};
