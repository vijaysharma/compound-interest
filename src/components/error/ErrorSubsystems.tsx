import React from 'react';
import styles from './ErrorPage.module.scss';
export const ErrorSubsystems: React.FC = () => {
  return (
    <div className={styles.subsystemsBar}>
      <div className={styles.subsystemItem}>
        <span className={styles.subsystemIcon}>🧮</span>
        <div>
          <div className={styles.subsystemTitle}>Math Engine</div>
          <div className={`${styles.subsystemStatus} ${styles.subsystemSuccess}`}>● Operational</div>
        </div>
      </div>
      <div className={styles.subsystemItem}>
        <span className={styles.subsystemIcon}>💾</span>
        <div>
          <div className={styles.subsystemTitle}>Local Vault</div>
          <div className={`${styles.subsystemStatus} ${styles.subsystemSuccess}`}>● Inputs Intact</div>
        </div>
      </div>
      <div className={styles.subsystemItem}>
        <span className={styles.subsystemIcon}>📡</span>
        <div>
          <div className={styles.subsystemTitle}>Market Feed</div>
          <div className={`${styles.subsystemStatus} ${styles.subsystemWarning}`}>● Reconnecting</div>
        </div>
      </div>
      <div className={styles.subsystemItem}>
        <span className={styles.subsystemIcon}>🔒</span>
        <div>
          <div className={styles.subsystemTitle}>Data Security</div>
          <div className={`${styles.subsystemStatus} ${styles.subsystemSuccess}`}>● 100% Private</div>
        </div>
      </div>
    </div>
  );
};
