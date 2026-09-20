import type { SwpFundAnalysis } from './types';
import Spinner from '../../components/Spinner';
import styles from '../MutualFundAnalytics.module.scss';
const formatNav = (nav: string): string => {
  const [whole, fraction] = nav.split('.');
  return fraction ? `${whole}.${fraction.slice(0, 2)}` : whole;
};
export function SwpStatCard({ fund }: { fund: SwpFundAnalysis }) {
  const {
    schemeName, color, startNav, endNav, matureAmt, installments,
    invested, units, averageNav, xirr, totalWithdrawn,
    lastWithdrawalAmount, lastWithdrawalDate,
  } = fund;
  return (
    <div className={`${styles.statCard} ${styles.statCardLeadingNone}`}>
      <div className={styles.statTitle}>
        <span
          className={styles.fundColorDot}
          ref={(el) => { if (el) el.style.backgroundColor = color; }}
          aria-hidden="true"
        />
        <span title={schemeName} className={styles.fundName}>{schemeName}</span>
      </div>
      {!startNav || !endNav ? (
        <div className={styles.spinnerWrapper}>
          <Spinner size="sm" label="Loading NAV data..." />
        </div>
      ) : (
        <>
          <div className={`${styles.navDatesRow} ${styles.navDatesRowSpaced}`}>
            <div className={styles.textSecondary}>
              <div className={styles.statTitle}>{startNav.date}</div>
              <span>₹</span>{formatNav(startNav.nav)}
            </div>
            <div className={parseFloat(endNav.nav) >= parseFloat(startNav.nav) ? styles.textSuccess : styles.textError}>
              <div className={styles.statTitle}>{endNav.date}</div>
              <span>₹</span>{formatNav(endNav.nav)}
            </div>
          </div>
          <div className={`${styles.statValueLg} ${styles.textSecondary}`}>
            <div className={styles.statTitle}>Initial Investment</div>
            {Math.round(invested).toLocaleString('en-IN')}
          </div>
          <div className={`${styles.statValueLg} ${styles.textPrimary}`}>
            <div className={styles.statTitle}>No. of Monthly Installments</div>
            {installments}
          </div>
          <div className={`${styles.statValueLg} ${styles.textPrimary}`}>
            <div className={styles.statTitle}>Total Withdrawal Amount</div>
            {Math.round(totalWithdrawn ?? 0).toLocaleString('en-IN')}
          </div>
          <div className={`${styles.statValueLg} ${styles.textPrimary}`}>
            <div className={styles.statTitle}>Last Withdrawal {lastWithdrawalDate ?? 'N/A'}</div>
            {lastWithdrawalAmount === undefined ? 'N/A' : Math.round(lastWithdrawalAmount).toLocaleString('en-IN')}
          </div>
          <div className={`${styles.statValueLg} ${styles.textPrimary}`}>
            <div className={styles.statTitle}>Value as on {endNav.date}</div>
            {Math.round(matureAmt).toLocaleString('en-IN')}
            <span className={(xirr ?? 0) >= 0 ? styles.textSuccess : styles.textError}>
              &nbsp;({xirr === undefined ? 'N/A' : `${(xirr * 100).toFixed(2)}%`})
            </span>
          </div>
          <div className={styles.statRow}>
            <span>Units Left: </span>
            <span className={styles.textPrimary}>{units.toFixed(2)}</span>
          </div>
          <div className={styles.statRow}>
            <span>Avg. buy price: </span>
            <span className={styles.textPrimary}>₹{formatNav(String(averageNav))}</span>
          </div>
        </>
      )}
    </div>
  );
}
