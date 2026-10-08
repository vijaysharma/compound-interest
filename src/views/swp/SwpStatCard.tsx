import React, { useMemo } from 'react';
import { FiChevronRight, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import type { SwpFundAnalysis } from './types';
import styles from '../MutualFundAnalytics.module.scss';
import { NavValuesSkeleton } from '../../components/skeleton';
import { parseFundSchemeDetails } from '../../utilities/mutual-fund/mfCardDetails';

export function SwpStatCard({ fund }: { fund: SwpFundAnalysis }) {
  const {
    schemeName, color, startNav, endNav, matureAmt, profitAmt,
    xirr, absProfit,
  } = fund;

  const parsed = useMemo(() => parseFundSchemeDetails(schemeName), [schemeName]);
  const isProfit = profitAmt >= 0;
  const isAbsPositive = absProfit >= 0;
  const xirrVal = xirr !== undefined ? xirr * 100 : undefined;

  return (
    <div className={styles.mfCardContainer}>
      {/* Header: Dot + Fund Title + Chevron */}
      <div className={styles.mfCardHeader}>
        <div className={styles.mfCardTitleRow}>
          <span
            className={styles.fundColorDot}
            ref={(el) => { if (el) el.style.backgroundColor = color; }}
            aria-hidden="true"
          />
          <span title={schemeName} className={styles.fundName}>
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

      {!startNav || !endNav ? (
        <NavValuesSkeleton />
      ) : (
        <>
          {/* Primary Value Row: Remaining/Current Value on Left, Profit/Loss on Right */}
          <div className={styles.mfCardValueRow}>
            <div className={styles.mfCardValueLeft}>
              <span className={styles.mfCardFieldLabel}>Current Value</span>
              <span className={styles.mfCardBigAmount}>
                ₹{Math.round(matureAmt).toLocaleString('en-IN')}
              </span>
            </div>
            <div className={styles.mfCardValueRight}>
              <span
                className={`${styles.mfCardProfitMain} ${isProfit ? styles.textSuccess : styles.textError}`}
              >
                {isProfit ? '+' : '-'}₹{Math.round(Math.abs(profitAmt)).toLocaleString('en-IN')}{' '}
                {isProfit ? <FiArrowUp /> : <FiArrowDown />}
              </span>
              <span
                className={`${styles.mfCardProfitSub} ${isAbsPositive ? styles.textSuccess : styles.textError}`}
              >
                {isAbsPositive ? '+' : ''}{absProfit.toFixed(2)}% (A)
              </span>
            </div>
          </div>

          {/* Metrics: XIRR (X) & Absolute (A) */}
          <div className={styles.mfCardMetricsRow}>
            <div className={styles.mfCardMetricItem}>
              <span className={styles.mfCardMetricLabel}>XIRR (X)</span>
              <span
                className={`${styles.mfCardMetricVal} ${(xirrVal ?? 0) >= 0 ? styles.textSuccess : styles.textError}`}
              >
                {xirrVal === undefined ? 'N/A' : `${xirrVal.toFixed(2)}%`}
              </span>
            </div>
            <div className={styles.mfCardMetricItem}>
              <span className={styles.mfCardMetricLabel}>Absolute (A)</span>
              <span
                className={`${styles.mfCardMetricVal} ${isAbsPositive ? styles.textSuccess : styles.textError}`}
              >
                {absProfit.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Bottom: NAV Progression and Mini Trend Arrow */}
          <div className={styles.mfCardNavRow}>
            <div className={styles.mfCardNavText}>
              <span>NAV</span>
              <strong>₹{parseFloat(startNav.nav).toFixed(2)}</strong>
              <span>&rarr;</span>
              <strong>₹{parseFloat(endNav.nav).toFixed(2)}</strong>
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
                    id={`grad-swp-${isAbsPositive ? 'up' : 'down'}-${color.replace(/[^a-zA-Z0-9]/g, '')}`}
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
                      fill={`url(#grad-swp-up-${color.replace(/[^a-zA-Z0-9]/g, '')})`}
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
                      fill={`url(#grad-swp-down-${color.replace(/[^a-zA-Z0-9]/g, '')})`}
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
                {isAbsPositive ? '+' : ''}{absProfit.toFixed(2)}%
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
