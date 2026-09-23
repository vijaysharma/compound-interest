import React from 'react';
import type { NavType } from '../../types/types';
import styles from '../../views/MutualFundAnalytics.module.scss';
import { NavValuesSkeleton } from '../skeleton';
export interface FundStatsCardProps {
  start?: NavType;
  end?: NavType;
  matureAmount: number;
  profitAmount: number;
  cagr: number;
  absoluteReturn: number;
  title: string;
  color: string;
}
export const FundStatsCard: React.FC<FundStatsCardProps> = React.memo(
  ({
    start,
    end,
    matureAmount,
    profitAmount,
    cagr,
    absoluteReturn,
    title,
    color,
  }) => (
    <div className={styles.statCard}>
      <div className={styles.statTitle}>
        <span
          className={styles.fundColorDot}
          ref={(el) => {
            if (el) el.style.backgroundColor = color;
          }}
          aria-hidden="true"
        />
        <span title={title} className={styles.fundName}>
          {title}
        </span>
      </div>
      {!start || !end ? (
        <NavValuesSkeleton />
      ) : (
        <>
          <div className={styles.navDatesRow}>
            <div className={styles.textSecondary}>
              <div className={styles.statTitle}>{start.date}</div>
              <span>₹</span>
              {parseFloat(start.nav).toFixed(2)}
            </div>
            <div
              className={
                parseFloat(end.nav) >= parseFloat(start.nav)
                  ? styles.textSuccess
                  : styles.textError
              }
            >
              <div className={styles.statTitle}>{end.date}</div>
              <span>₹</span>
              {parseFloat(end.nav).toFixed(2)}
            </div>
          </div>
          <div className={styles.statTitle}>Final Amount</div>
          <span className={`${styles.statValueXl} ${styles.textPrimary}`}>
            ₹ {Math.round(matureAmount).toLocaleString('en-IN')}
          </span>
          <div
            className={`${styles.statRow} ${profitAmount >= 0 ? styles.textSuccess : styles.textError}`}
          >
            {profitAmount < 0 ? '-' : '+'}
            &nbsp;₹
            {Math.round(profitAmount).toLocaleString('en-IN')}
          </div>
          <div className={styles.statRow}>
            <span>C:</span>{' '}
            <span className={cagr >= 0 ? styles.textSuccess : styles.textError}>
              {cagr.toFixed(2)}%
            </span>
            &nbsp;|&nbsp;
            <span>A:</span>{' '}
            <span className={absoluteReturn >= 0 ? styles.textSuccess : styles.textError}>
              {absoluteReturn.toFixed(2)}%
            </span>
          </div>
        </>
      )}
    </div>
  )
);
FundStatsCard.displayName = 'FundStatsCard';
