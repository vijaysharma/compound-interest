import React from 'react';
import { FiAward, FiCheckCircle } from 'react-icons/fi';
import convertToWords, { getCurrencySymbol } from '../../utilities/currency';
import type { PPFCalculationResult } from '../../utilities/ppfCalculations';
import styles from '../PpfCalculator.module.scss';
interface PpfSummaryColProps {
  ppfResult: PPFCalculationResult;
  investedPercent: number;
  gainsPercent: number;
  wealthMultiplier: string;
}
export function PpfSummaryCol({
  ppfResult, investedPercent, gainsPercent, wealthMultiplier,
}: PpfSummaryColProps) {
  const currencySymbol = getCurrencySymbol('en-IN', 'INR');
  return (
    <div className={styles.summaryCol}>
      <div className={styles.resultHeroCard}>
        <div className={styles.resultHeroLabel}>Total Maturity Value</div>
        <div className={styles.resultHeroAmount}>
          {currencySymbol}{ppfResult.maturityAmount.toLocaleString('en-IN')}
        </div>
        <div className={styles.resultHeroWords}>
          {convertToWords(ppfResult.maturityAmount, 'en-IN')}
        </div>
      </div>
      <div className={styles.statsGrid}>
        <div className={styles.statBox}>
          <div className={styles.statLabel}>Total Invested</div>
          <div className={styles.statValue}>
            {currencySymbol}{ppfResult.totalInvested.toLocaleString('en-IN')}
          </div>
        </div>
        <div className={styles.statBox}>
          <div className={styles.statLabel}>Total Interest Earned</div>
          <div className={`${styles.statValue} ${styles.statValueGain}`}>
            +{currencySymbol}{ppfResult.totalInterest.toLocaleString('en-IN')}
          </div>
        </div>
        <div className={styles.statBox}>
          <div className={styles.statLabel}>Account Tenure</div>
          <div className={styles.statValue}>{ppfResult.tenureYears} Years</div>
        </div>
        <div className={styles.statBox}>
          <div className={styles.statLabel}>Maturity Financial Year</div>
          <div className={styles.statValue}>FY {ppfResult.maturityFyLabel}</div>
        </div>
      </div>
      <section className={styles.card}>
        <div className={styles.badgeEee}>
          <FiAward /> 100% Tax-Free (EEE Status)
        </div>
        <div className={styles.eeeList}>
          <div className={styles.eeeItem}>
            <FiCheckCircle className={styles.checkIcon} />
            <span><strong>Investment:</strong> Eligible for Section 80C deduction up to ₹1.5L/year.</span>
          </div>
          <div className={styles.eeeItem}>
            <FiCheckCircle className={styles.checkIcon} />
            <span><strong>Interest Earned:</strong> 100% Tax-Exempt under Section 10(11).</span>
          </div>
          <div className={styles.eeeItem}>
            <FiCheckCircle className={styles.checkIcon} />
            <span><strong>Maturity Corpus:</strong> Completely tax-free upon withdrawal.</span>
          </div>
        </div>
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressInvested}
              ref={(el) => { if (el) el.style.width = `${investedPercent}%`; }}
              title={`Invested: ${investedPercent}%`}
            />
            <div
              className={styles.progressGains}
              ref={(el) => { if (el) el.style.width = `${gainsPercent}%`; }}
              title={`Interest: ${gainsPercent}%`}
            />
          </div>
          <div className={styles.progressLegend}>
            <span>Invested: {investedPercent}%</span>
            <span>Wealth Multiplier: {wealthMultiplier}x</span>
            <span>Interest: {gainsPercent}%</span>
          </div>
        </div>
      </section>
    </div>
  );
}
