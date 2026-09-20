import React from 'react';
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
        ⚡ Quick Recovery
      </button>
      <button
        type="button"
        onClick={() => onTabChange('diagnostics')}
        className={`${styles.tabBtn} ${activeTab === 'diagnostics' ? styles.tabActive : ''}`}
      >
        🩺 Live Diagnostics
      </button>
      <button
        type="button"
        onClick={() => onTabChange('details')}
        className={`${styles.tabBtn} ${activeTab === 'details' ? styles.tabActive : ''}`}
      >
        📋 Technical Details
      </button>
    </div>
  );
};
