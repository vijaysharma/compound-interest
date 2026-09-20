import type { SipFundAnalysis } from './types';
import Spinner from '../../components/Spinner';
import styles from '../MutualFundAnalytics.module.scss';
const formatNav = (nav: string): string => {
  const [whole, fraction] = nav.split('.');
  return fraction ? `${whole}.${fraction.slice(0, 2)}` : whole;
};
export function SipStatCard({ fund }: { fund: SipFundAnalysis }) {
  const {
    schemeName, color, startNav, endNav, matureAmt, profitAmt,
    installments, invested, units, averageNav, xirr, absProfit,
    latestValue, latestNavDate, latestXirr,
  } = fund;
  return (
    <div className={styles.statCard}>
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
          <div className={styles.navDatesRow}>
            <div className={styles.textSecondary}>
              <div className={styles.statTitle}>{startNav.date}</div>
              <span>₹</span>{formatNav(startNav.nav)}
            </div>
            <div className={parseFloat(endNav.nav) >= parseFloat(startNav.nav) ? styles.textSuccess : styles.textError}>
              <div className={styles.statTitle}>{endNav.date}</div>
              <span>₹</span>{formatNav(endNav.nav)}
            </div>
          </div>
          <div className={styles.statTitle}>Invested Amount</div>
          <span className={`${styles.statValueLg} ${styles.textSecondary}`}>
            {Math.round(invested).toLocaleString('en-IN')}
          </span>
          <div className={styles.statTitle}>Value as on {endNav.date}</div>
          <span className={`${styles.statValueLg} ${styles.textPrimary}`}>
            {Math.round(matureAmt).toLocaleString('en-IN')}
            <span className={(xirr ?? 0) >= 0 ? styles.textSuccess : styles.textError}>
              &nbsp;({xirr === undefined ? 'N/A' : `${(xirr * 100).toFixed(2)}%`})
            </span>
          </span>
          {latestValue !== undefined && latestNavDate && (
            <>
              <div className={styles.statTitle}>Value as on ({latestNavDate})</div>
              <span className={`${styles.statValueXl} ${styles.textPrimary}`}>
                {Math.round(latestValue).toLocaleString('en-IN')}
              </span>
            </>
          )}
          <div className={`${styles.statRow} ${profitAmt >= 0 ? styles.textSuccess : styles.textError}`}>
            {profitAmt < 0 ? '-' : '+'}
            &nbsp;₹{Math.abs(profitAmt).toLocaleString('en-IN')}
          </div>
          <div className={styles.statRow}>
            <span>X:</span>{' '}
            <span className={(latestXirr ?? 0) >= 0 ? styles.textSuccess : styles.textError}>
              {latestXirr === undefined ? 'N/A' : `${(latestXirr * 100).toFixed(2)}%`}
            </span>
            &nbsp;|&nbsp;
            <span>A:</span>{' '}
            <span className={absProfit >= 0 ? styles.textSuccess : styles.textError}>
              {absProfit.toFixed(2)}%
            </span>
          </div>
          <div className={styles.statRow}>
            <span>Insts.: </span>
            <span className={styles.textPrimary}>{installments}</span>
            &nbsp;|&nbsp;
            <span>Units: </span>
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
