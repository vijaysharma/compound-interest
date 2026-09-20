import React from 'react';
import styles from '../CalculatorPage.module.scss';
export const PPPHeader: React.FC = () => {
  return (
    <header className={styles.header}>
      <div className={styles.badge}>Global Economics &bull; World Bank Verified Data</div>
      <h1 className={styles.title}>
        Purchasing Power Parity (PPP) &amp; Global Salary Calculator
      </h1>
      <p className={styles.subtitle}>
        Compare real standard of living and salary equivalents across 150+ countries.
      </p>
    </header>
  );
};
