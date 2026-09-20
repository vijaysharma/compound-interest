'use client';
import React, { useState } from 'react';
import Link from '@/navigation';
import { ERROR_CALCULATORS } from './errorData';
import styles from './ErrorPage.module.scss';
interface ErrorRecoveryTabProps {
  isRetrying: boolean;
  onRetry: () => void;
}
export const ErrorRecoveryTab: React.FC<ErrorRecoveryTabProps> = ({ isRetrying, onRetry }) => {
  const [calculatorCategory, setCalculatorCategory] = useState<'all' | 'invest' | 'loans' | 'tax'>('all');
  const filteredCalcs =
    calculatorCategory === 'all'
      ? ERROR_CALCULATORS
      : ERROR_CALCULATORS.filter((c) => c.cat === calculatorCategory);
  return (
    <div>
      <div className={styles.actionRow}>
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className={styles.retryBtn}
        >
          {isRetrying ? 'Refreshing Calculation...' : '🔄 Resume & Try Again'}
        </button>
        <Link href="/" className={styles.homeLink}>
          Explore All Calculators
        </Link>
      </div>
      <div>
        <div className={styles.directoryHeader}>
          <span className={styles.directoryLabel}>Direct Access to Ready Calculators</span>
          <div className={styles.chips}>
            {(['all', 'invest', 'loans', 'tax'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCalculatorCategory(cat)}
                className={`${styles.chip} ${calculatorCategory === cat ? styles.chipActive : ''}`}
              >
                {cat === 'all' ? 'All' : cat === 'invest' ? 'Investing' : cat === 'loans' ? 'Loans' : 'Taxes'}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.calcsGrid}>
          {filteredCalcs.map((calc) => (
            <Link key={calc.href} href={calc.href} className={styles.calcCard}>
              <span className={styles.calcIcon}>{calc.icon}</span>
              <div>
                <div className={styles.calcTitle}>{calc.title}</div>
                <div className={styles.calcDesc}>{calc.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
