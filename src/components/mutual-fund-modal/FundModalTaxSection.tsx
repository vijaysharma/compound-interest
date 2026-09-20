import React from 'react';
import type { TaxCalculations, TaxMode, PerformanceMetrics } from './types';
import { formatINR } from './utils';
import styles from '../MutualFundDetailModal.module.scss';
export interface FundModalTaxSectionProps {
  taxMode: TaxMode;
  setTaxMode: (mode: TaxMode) => void;
  taxCalculations: TaxCalculations;
  performance: PerformanceMetrics;
  holdingDays: number;
  holdingYears: number;
  fundCategory: string;
  isLongTerm: boolean;
}
export const FundModalTaxSection: React.FC<FundModalTaxSectionProps> = React.memo(
  ({
    taxMode,
    setTaxMode,
    taxCalculations,
    performance,
    holdingDays,
    holdingYears,
    fundCategory,
    isLongTerm,
  }) => (
    <div className={styles.taxSection}>
      <div className={styles.taxHeader}>
        <h3 className={styles.taxTitle}>
          <span>🇮🇳 Actual Post-Tax In-Hand Returns (Finance Act 2024)</span>
        </h3>
        <div className={styles.taxToggles}>
          <button
            type="button"
            className={`${styles.taxToggleBtn} ${taxMode === 'auto' ? styles.activeToggle : ''}`}
            onClick={() => setTaxMode('auto')}
            title="Auto-detect based on fund category and holding period"
          >
            Auto ({taxCalculations.categoryBadge})
          </button>
          <button
            type="button"
            className={`${styles.taxToggleBtn} ${taxMode === 'ltcg' ? styles.activeToggle : ''}`}
            onClick={() => setTaxMode('ltcg')}
          >
            LTCG (12.5%)
          </button>
          <button
            type="button"
            className={`${styles.taxToggleBtn} ${taxMode === 'stcg' ? styles.activeToggle : ''}`}
            onClick={() => setTaxMode('stcg')}
          >
            STCG (20%)
          </button>
          <button
            type="button"
            className={`${styles.taxToggleBtn} ${taxMode === 'slab30' ? styles.activeToggle : ''}`}
            onClick={() => setTaxMode('slab30')}
          >
            Debt/Slab (30%)
          </button>
        </div>
      </div>
      <div className={styles.taxCardsGrid}>
        <div className={styles.taxCard}>
          <span className={styles.taxCardLabel}>Holding &amp; Tax Classification</span>
          <span className={`${styles.taxCardValue} ${styles.taxCardValPrimary}`}>
            {holdingDays} Days ({holdingYears} Yrs)
          </span>
          <span className={styles.taxCardSubtextMuted}>
            Asset: <strong>{fundCategory.toUpperCase()}</strong> ({isLongTerm ? 'Long Term' : 'Short Term'})
          </span>
        </div>
        <div className={styles.taxCard}>
          <span className={styles.taxCardLabel}>Estimated Tax Deducted</span>
          <span className={`${styles.taxCardValue} ${styles.taxCardValError}`}>
            {formatINR(taxCalculations.taxAmount)}
          </span>
          <span className={styles.taxCardSubtextMuted}>Rate: {taxCalculations.rateLabel}</span>
        </div>
        <div className={`${styles.taxCard} ${styles.taxCardHighlight}`}>
          <span className={styles.taxCardLabel}>Actual Post-Tax In-Hand</span>
          <span className={`${styles.taxCardValue} ${styles.taxCardValSuccess}`}>
            {formatINR(taxCalculations.postTaxMaturity)}
          </span>
          <span className={styles.taxCardSubtextSuccessBold}>
            Net Gain: +{formatINR(taxCalculations.postTaxProfit)}
          </span>
        </div>
        <div className={`${styles.taxCard} ${styles.taxCardHighlight}`}>
          <span className={styles.taxCardLabel}>Post-Tax Net Return</span>
          <span className={`${styles.taxCardValue} ${styles.taxCardValSuccess}`}>
            {taxCalculations.postTaxCagr.toFixed(2)}%
          </span>
          <span className={styles.taxCardSubtextSuccess}>
            Gross Return: {performance.cagr.toFixed(2)}%
          </span>
        </div>
      </div>
      <p className={styles.taxDisclaimer}>
        * Tax calculation follows Indian Budget 2024 provisions (Sections 112A &amp; 111A).
        Long-Term Capital Gains on Equity are exempt up to ₹1,25,000 per financial year across
        all equity holdings, with the remainder taxed at 12.5% + 4% Health &amp; Education Cess
        (effective 13.0%). Short-Term Capital Gains are taxed at 20% + 4% cess (effective
        20.8%). Pure Debt funds are taxed at the investor&apos;s applicable slab rate.
      </p>
    </div>
  )
);
FundModalTaxSection.displayName = 'FundModalTaxSection';
