import type { RT } from '../../types/types';
import styles from '../CalculatorPage.module.scss';
interface FdSummaryCardProps {
  mode: string;
  selectedPayoutTitle: string;
  rt: RT;
  principalDeposit: number;
  totalInterestEarned: number;
  principalPercent: number;
}
export function FdSummaryCard({
  mode, selectedPayoutTitle, rt, principalDeposit,
  totalInterestEarned, principalPercent,
}: FdSummaryCardProps) {
  return (
    <div className={styles.summaryCard}>
      <div className={styles.summaryHeader}>
        <span>{mode === '100' ? 'FD Maturity Summary' : `FD Summary (${selectedPayoutTitle})`}</span>
        <span className={styles.summarySub}>
          {rt.tenure} {rt.tenureFormat === 'y' ? 'Years' : 'Months'} @ {rt.roi}%
        </span>
      </div>
      <div className={styles.statsGrid}>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Principal Deposit</span>
          <span className={`${styles.statValue} ${styles.statValuePrimary}`}>
            ₹{principalDeposit.toLocaleString('en-IN')}
          </span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>
            {mode === '100' ? 'Total Interest' : `Total Interest (${selectedPayoutTitle})`}
          </span>
          <span className={`${styles.statValue} ${styles.statValueSuccess}`}>
            +₹{totalInterestEarned.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
      <div className={styles.ratioBar}>
        <div
          className={styles.ratioFillInvested}
          ref={(el) => { if (el) el.style.width = `${principalPercent}%`; }}
        />
        <div
          className={styles.ratioFillReturns}
          ref={(el) => { if (el) el.style.width = `${100 - principalPercent}%`; }}
        />
      </div>
      <div className={styles.ratioLegend}>
        <span className={styles.ratioLegendItem}>
          <span className={styles.ratioDotInvested} /> Principal ({principalPercent}%)
        </span>
        <span className={styles.ratioLegendItem}>
          <span className={styles.ratioDotReturns} /> Interest ({100 - principalPercent}%)
        </span>
      </div>
    </div>
  );
}
