import React from 'react';
import { FiCpu, FiHardDrive, FiShield, FiWifi } from 'react-icons/fi';
import styles from './ErrorPage.module.scss';
export const ErrorSubsystems: React.FC = () => {
  return (
    <div className={styles.subsystemsBar}>
      <div className={styles.subsystemItem}>
        <span className={styles.subsystemIcon}>
          <FiCpu aria-hidden="true" />
        </span>
        <div>
          <div className={styles.subsystemTitle}>Math Engine</div>
          <div className={`${styles.subsystemStatus} ${styles.subsystemSuccess}`}>● Operational</div>
        </div>
      </div>
      <div className={styles.subsystemItem}>
        <span className={styles.subsystemIcon}>
          <FiHardDrive aria-hidden="true" />
        </span>
        <div>
          <div className={styles.subsystemTitle}>Local Vault</div>
          <div className={`${styles.subsystemStatus} ${styles.subsystemSuccess}`}>● Inputs Intact</div>
        </div>
      </div>
      <div className={styles.subsystemItem}>
        <span className={styles.subsystemIcon}>
          <FiWifi aria-hidden="true" />
        </span>
        <div>
          <div className={styles.subsystemTitle}>Market Feed</div>
          <div className={`${styles.subsystemStatus} ${styles.subsystemWarning}`}>● Reconnecting</div>
        </div>
      </div>
      <div className={styles.subsystemItem}>
        <span className={styles.subsystemIcon}>
          <FiShield aria-hidden="true" />
        </span>
        <div>
          <div className={styles.subsystemTitle}>Data Security</div>
          <div className={`${styles.subsystemStatus} ${styles.subsystemSuccess}`}>● 100% Private</div>
        </div>
      </div>
    </div>
  );
};
