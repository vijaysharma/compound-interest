import React, { useMemo } from 'react';
import { FiChevronRight } from 'react-icons/fi';
import type { SwpFundAnalysis } from './types';
import styles from '../MutualFundAnalytics.module.scss';
import { NavValuesSkeleton } from '../../components/skeleton';
import { parseFundSchemeDetails } from '../../utilities/mutual-fund/mfCardDetails';

export function SwpStatCard({ fund }: { fund: SwpFundAnalysis }) {
  const {
    schemeName, color, startNav, endNav, matureAmt, profitAmt,
    invested, units, averageNav, installments, xirr, absProfit,
  } = fund;

  const parsed = useMemo(() => parseFundSchemeDetails(schemeName), [schemeName]);
  const isProfit = profitAmt >= 0;
  const isAbsPositive = absProfit >= 0;
  const xirrVal = xirr !== undefined ? xirr * 100 : undefined;

  // NAV price change percentage between start and end NAV
  const navGrowthPct =
    startNav && endNav && parseFloat(startNav.nav) > 0
      ? ((parseFloat(endNav.nav) - parseFloat(startNav.nav)) / parseFloat(startNav.nav)) * 100
      : absProfit;
  const isNavGrowthPositive = navGrowthPct >= 0;

  return (
    <div className={styles.mfCardContainer}>
      {/* 1. Header: Dot + Fund Title + Chevron */}
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

      {/* 2. Tags / Pills */}
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
          {/* 3. Top Metrics Row: CAGR (XIRR) and Absolute Return */}
          <div className={styles.swpTopMetricsRow}>
            <div className={styles.swpTopMetricItem}>
              <span className={styles.swpTopMetricLabel}>CAGR (XIRR)</span>
              <span
                className={`${styles.swpTopMetricVal} ${(xirrVal ?? 0) >= 0 ? styles.textSuccess : styles.textError}`}
              >
                {xirrVal === undefined ? 'N/A' : `${xirrVal.toFixed(2)}%`}
              </span>
            </div>
            <div className={styles.swpTopMetricItem}>
              <span className={styles.swpTopMetricLabel}>Absolute Return</span>
              <span
                className={`${styles.swpTopMetricVal} ${isAbsPositive ? styles.textSuccess : styles.textError}`}
              >
                {absProfit.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* 4. NAV Row: NAV (dates) ₹start -> ₹end, sparkline & return pill */}
          <div className={styles.swpNavSparklineRow}>
            <div className={styles.swpNavProgressionCol}>
              <span>NAV</span>
              <span className={styles.swpNavDatesSpan}>
                ({startNav.date} &rarr; {endNav.date})
              </span>
              <strong>₹{parseFloat(startNav.nav).toFixed(2)}</strong>
              <span>&rarr;</span>
              <strong>₹{parseFloat(endNav.nav).toFixed(2)}</strong>
            </div>

            <div className={styles.swpSparklineCol}>
              <svg
                className={styles.swpSparklineSvg}
                viewBox="0 0 60 22"
                fill="none"
                aria-hidden="true"
              >
                {isNavGrowthPositive ? (
                  <>
                    <path
                      d="M 2 18 C 14 18, 22 15, 32 16 C 42 17, 48 8, 56 6"
                      stroke="var(--color-success)"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <circle cx="56" cy="6" r="2.5" fill="var(--color-success)" />
                  </>
                ) : (
                  <>
                    <path
                      d="M 2 6 C 14 6, 22 9, 32 8 C 42 7, 48 16, 56 18"
                      stroke="var(--color-error)"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <circle cx="56" cy="18" r="2.5" fill="var(--color-error)" />
                  </>
                )}
              </svg>
              <span
                className={`${styles.swpReturnPill} ${isNavGrowthPositive ? styles.sipPillSuccess : styles.sipPillError}`}
              >
                {isNavGrowthPositive ? '+' : ''}{navGrowthPct.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* 5. Values 3-Column Grid: Invested Amount, Current Value, Gain / Loss */}
          <div className={styles.swpValuesGrid}>
            <div className={styles.swpValueCol}>
              <span className={styles.swpValueColLabel}>Invested Amount</span>
              <span className={styles.swpValueColAmount}>
                ₹{Math.round(invested).toLocaleString('en-IN')}
              </span>
            </div>
            <div className={styles.swpValueCol}>
              <span className={styles.swpValueColLabel}>Current Value</span>
              <span className={styles.swpValueColAmountPurple}>
                ₹{Math.round(matureAmt).toLocaleString('en-IN')}
              </span>
            </div>
            <div className={styles.swpValueCol}>
              <span className={styles.swpValueColLabel}>Gain / Loss</span>
              <span
                className={`${styles.swpGainLossText} ${isProfit ? styles.textSuccess : styles.textError}`}
              >
                {isProfit ? '+' : '-'}₹{Math.round(Math.abs(profitAmt)).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* 6. Bottom 3-Column Row: Instalments, Units Left, Avg. Buy Price */}
          <div className={styles.swpBottomRow}>
            <div className={styles.swpBottomItem}>
              <span className={styles.swpBottomLabel}>Instalments</span>
              <span className={styles.swpBottomVal}>{installments}</span>
            </div>
            <div className={styles.swpBottomItem}>
              <span className={styles.swpBottomLabel}>Units Left</span>
              <span className={styles.swpBottomVal}>
                {units.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className={styles.swpBottomItem}>
              <span className={styles.swpBottomLabel}>Avg. Buy Price</span>
              <span className={styles.swpBottomVal}>
                ₹{Number(averageNav).toFixed(2)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
