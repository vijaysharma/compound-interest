import type { RT } from '../../types/types';
import styles from '../CalculatorPage.module.scss';
interface RdSummaryCardProps {
  rt: RT;
  totalDeposited: number;
  totalInterestEarned: number;
  depositPercent: number;
}
export function RdSummaryCard({
  rt, totalDeposited, totalInterestEarned, depositPercent,
}: RdSummaryCardProps) {
  return (
    <div className={styles.summaryCard}>
      <div className={styles.summaryHeader}>
        <span>RD Maturity Summary</span>
        <span className={styles.summarySub}>
          {rt.tenure} {rt.tenureFormat === 'y' ? 'Years' : 'Months'} @ {rt.roi}%
        </span>
      </div>
      <div className={styles.statsGrid}>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Total Deposited</span>
          <span className={`${styles.statValue} ${styles.statValuePrimary}`}>
            ₹{totalDeposited.toLocaleString('en-IN')}
          </span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Total Interest</span>
          <span className={`${styles.statValue} ${styles.statValueSuccess}`}>
            +₹{totalInterestEarned.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
      <div className={styles.ratioBar}>
        <div
          className={styles.ratioFillInvested}
          ref={(el) => { if (el) el.style.width = `${depositPercent}%`; }}
        />
        <div
          className={styles.ratioFillReturns}
          ref={(el) => { if (el) el.style.width = `${100 - depositPercent}%`; }}
        />
      </div>
      <div className={styles.ratioLegend}>
        <span className={styles.ratioLegendItem}>
          <span className={styles.ratioDotInvested} /> Deposited ({depositPercent}%)
        </span>
        <span className={styles.ratioLegendItem}>
          <span className={styles.ratioDotReturns} /> Interest ({100 - depositPercent}%)
        </span>
      </div>
    </div>
  );
}
