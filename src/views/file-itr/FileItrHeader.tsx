import React from 'react';
import { FiShield } from 'react-icons/fi';
import styles from '../FileItr.module.scss';
export const FileItrHeader: React.FC = () => {
  return (
    <header className={styles.header}>
      <div className={styles.badge}>
        <FiShield /> Form 16 Auto-Reader &bull; ITR-1 Return Preparation
      </div>
      <h1 className={styles.title}>Upload Form 16 &amp; Prepare Tax Return</h1>
      <p className={styles.subtitle}>
        Extract details from your employer&apos;s Form 16, compare Old vs New Tax Regime, verify
        your TDS credit, and prepare all schedules needed to file your return on the income tax
        portal.
      </p>
    </header>
  );
};
