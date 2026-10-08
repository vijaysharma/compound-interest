import React, { useMemo } from 'react';
import { FiChevronRight, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import type { NavType } from '../../types/types';
import styles from '../../views/MutualFundAnalytics.module.scss';
import { NavValuesSkeleton } from '../skeleton';
import { parseFundSchemeDetails } from '../../utilities/mutual-fund/mfCardDetails';

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
  }) => {
    const parsed = useMemo(() => parseFundSchemeDetails(title), [title]);
    const isProfit = profitAmount >= 0;
    const isAbsPositive = absoluteReturn >= 0;

    return (
      <div className={styles.mfCardContainer}>
        {/* Header: Dot + Fund Title + Chevron */}
        <div className={styles.mfCardHeader}>
          <div className={styles.mfCardTitleRow}>
            <span
              className={styles.fundColorDot}
              ref={(el) => {
                if (el) el.style.backgroundColor = color;
              }}
              aria-hidden="true"
            />
            <span title={title} className={styles.fundName}>
              {parsed.cleanName}
            </span>
          </div>
          <FiChevronRight className={styles.mfCardChevron} aria-hidden="true" />
        </div>

        {/* Tags / Pills */}
        <div className={styles.mfCardTagsRow}>
          {parsed.category && (
            <span
              className={`${styles.mfCardTag} ${styles.mfCardTagHighlight}`}
              style={{
                backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
                color: color,
                borderColor: `color-mix(in srgb, ${color} 25%, transparent)`,
              }}
            >
              {parsed.category}
            </span>
          )}
          {parsed.planType && <span className={styles.mfCardTag}>{parsed.planType}</span>}
          {parsed.optionType && <span className={styles.mfCardTag}>{parsed.optionType}</span>}
        </div>

        {!start || !end ? (
          <NavValuesSkeleton />
        ) : (
          <>
            {/* Primary Value Row: Current Value on Left, Profit/Loss on Right */}
            <div className={styles.mfCardValueRow}>
              <div className={styles.mfCardValueLeft}>
                <span className={styles.mfCardFieldLabel}>Current Value</span>
                <span className={styles.mfCardBigAmount}>
                  ₹{Math.round(matureAmount).toLocaleString('en-IN')}
                </span>
              </div>
              <div className={styles.mfCardValueRight}>
                <span
                  className={`${styles.mfCardProfitMain} ${isProfit ? styles.textSuccess : styles.textError}`}
                >
                  {isProfit ? '+' : '-'}₹{Math.round(Math.abs(profitAmount)).toLocaleString('en-IN')}{' '}
                  {isProfit ? <FiArrowUp /> : <FiArrowDown />}
                </span>
                <span
                  className={`${styles.mfCardProfitSub} ${isAbsPositive ? styles.textSuccess : styles.textError}`}
                >
                  {isAbsPositive ? '+' : ''}{absoluteReturn.toFixed(2)}% (A)
                </span>
              </div>
            </div>

            {/* Metrics: CAGR (C) & Absolute (A) */}
            <div className={styles.mfCardMetricsRow}>
              <div className={styles.mfCardMetricItem}>
                <span className={styles.mfCardMetricLabel}>CAGR (C)</span>
                <span
                  className={`${styles.mfCardMetricVal} ${cagr >= 0 ? styles.textSuccess : styles.textError}`}
                >
                  {cagr.toFixed(2)}%
                </span>
              </div>
              <div className={styles.mfCardMetricItem}>
                <span className={styles.mfCardMetricLabel}>Absolute (A)</span>
                <span
                  className={`${styles.mfCardMetricVal} ${isAbsPositive ? styles.textSuccess : styles.textError}`}
                >
                  {absoluteReturn.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Bottom: NAV Progression and Mini Trend Arrow */}
            <div className={styles.mfCardNavRow}>
              <div className={styles.mfCardNavText}>
                <span>NAV</span>
                <strong>₹{parseFloat(start.nav).toFixed(2)}</strong>
                <span>&rarr;</span>
                <strong>₹{parseFloat(end.nav).toFixed(2)}</strong>
              </div>
              <div className={styles.mfCardNavTrendCol}>
                <svg
                  className={styles.mfCardNavArrowSvg}
                  viewBox="0 0 72 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient
                      id={`grad-${isAbsPositive ? 'up' : 'down'}-${color.replace(/[^a-zA-Z0-9]/g, '')}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={isAbsPositive ? 'var(--color-success)' : 'var(--color-error)'}
                        stopOpacity="0.18"
                      />
                      <stop
                        offset="100%"
                        stopColor={isAbsPositive ? 'var(--color-success)' : 'var(--color-error)'}
                        stopOpacity="0"
                      />
                    </linearGradient>
                  </defs>
                  {isAbsPositive ? (
                    <>
                      <path
                        d="M 2 16 Q 30 15 54 8 L 64 5 L 64 20 L 2 20 Z"
                        fill={`url(#grad-up-${color.replace(/[^a-zA-Z0-9]/g, '')})`}
                      />
                      <path
                        d="M 2 16 Q 32 15 62 6"
                        stroke="var(--color-success)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        fill="none"
                      />
                      <polyline
                        points="54,4 64,5 61,13"
                        stroke="var(--color-success)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </>
                  ) : (
                    <>
                      <path
                        d="M 2 5 Q 30 6 54 12 L 64 15 L 64 20 L 2 20 Z"
                        fill={`url(#grad-down-${color.replace(/[^a-zA-Z0-9]/g, '')})`}
                      />
                      <path
                        d="M 2 5 Q 32 6 62 14"
                        stroke="var(--color-error)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        fill="none"
                      />
                      <polyline
                        points="54,16 64,15 61,7"
                        stroke="var(--color-error)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </>
                  )}
                </svg>
                <span
                  className={`${styles.mfCardNavReturn} ${isAbsPositive ? styles.textSuccess : styles.textError}`}
                >
                  {isAbsPositive ? '+' : ''}{absoluteReturn.toFixed(2)}%
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
);
FundStatsCard.displayName = 'FundStatsCard';
