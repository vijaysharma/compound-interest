import React, { useMemo } from 'react';
import { FiChevronRight, FiCalendar, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import type { SipFundAnalysis } from './types';
import styles from '../MutualFundAnalytics.module.scss';
import { NavValuesSkeleton } from '../../components/skeleton';
import { parseFundSchemeDetails } from '../../utilities/mutual-fund/mfCardDetails';
import { parseAnyDate } from '../../utilities/dateUtils';
const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
function formatCardDate(dateStr: string): string {
  const d = parseAnyDate(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}
export function SipStatCard({ fund }: { fund: SipFundAnalysis }) {
  const {
    schemeName,
    color,
    startNav,
    endNav,
    matureAmt,
    profitAmt,
    invested,
    units,
    averageNav,
    installments,
    xirr,
    absProfit,
  } = fund;
  const parsed = useMemo(() => parseFundSchemeDetails(schemeName), [schemeName]);
  const isProfit = profitAmt >= 0;
  const isAbsProfit = absProfit >= 0;
  const xirrVal = xirr !== undefined ? xirr * 100 : undefined;
  const startNavDate = startNav?.date;
  const endNavDate = endNav?.date;
  const dateRangeStr = useMemo(() => {
    if (!startNavDate || !endNavDate) return '';
    return `${formatCardDate(startNavDate)} – ${formatCardDate(endNavDate)}`;
  }, [startNavDate, endNavDate]);
  const startNavVal = startNav ? parseFloat(startNav.nav) : 0;
  const endNavVal = endNav ? parseFloat(endNav.nav) : 0;
  function formatCompactRupee(val: number): string {
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (abs >= 10000000) {
      return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`;
    }
    if (abs >= 100000) {
      return `${sign}₹${(abs / 100000).toFixed(2)}L`;
    }
    if (abs >= 1000) {
      return `${sign}₹${(abs / 1000).toFixed(2)}K`;
    }
    return `${sign}₹${Math.round(abs).toLocaleString('en-IN')}`;
  }
  return (
    <div className={styles.mfCardContainer}>
      {/* 1. Header: Dot + Fund Title + Chevron */}
      <div className={styles.mfCardHeader}>
        <div className={styles.mfCardTitleRow}>
          <span
            className={styles.fundColorDot}
            ref={(el) => {
              if (el) el.style.backgroundColor = color;
            }}
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
          {/* 3. Primary Value Row: Current Value on Left & Gain/Loss Container on Right */}
          <div className={styles.sipValueCardRow}>
            <div className={styles.sipCurrentValueCol}>
              <span className={styles.sipValueLabel}>Current Value</span>
              <span
                className={`${styles.sipValueBig} ${isProfit ? styles.sipValueBigPositive : styles.sipValueBigNegative}`}
              >
                {formatCompactRupee(matureAmt)}
              </span>
              <span className={styles.sipValueSub}>
                (₹{Math.round(matureAmt).toLocaleString('en-IN')})
              </span>
            </div>
            <div className={styles.sipCurrentValueCol}>
              <span className={styles.sipValueLabel}>Invested</span>
              <span className={styles.sipValueBig}>{formatCompactRupee(invested)}</span>
              <span className={styles.sipValueSub}>
                (₹{Math.round(invested).toLocaleString('en-IN')})
              </span>
            </div>
          </div>
          <div
            className={`${styles.sipReturnBox} ${
              isProfit ? styles.sipReturnBoxPositive : styles.sipReturnBoxNegative
            }`}
          >
            <div className={styles.sipReturnGainRowContainer}>
              <div
                className={`${styles.sipReturnGainRow} ${
                  isProfit ? styles.sipReturnGainPositive : styles.sipReturnGainNegative
                }`}
              >
                <span>
                  {isProfit ? '+' : '−'}
                  {formatCompactRupee(Math.abs(profitAmt))}
                </span>
                {isProfit ? (
                  <FiArrowUp className={styles.sipGainArrowIcon} aria-hidden="true" />
                ) : (
                  <FiArrowDown className={styles.sipGainArrowIcon} aria-hidden="true" />
                )}
              </div>
              <span className={styles.sipValueSub}>
                (₹{Math.round(profitAmt).toLocaleString('en-IN')})
              </span>
            </div>
            <div className={styles.sipReturnSubRow}>
              <span className={styles.sipMetricLabel}>XIRR:</span>
              <span
                className={isAbsProfit ? styles.sipReturnValPositive : styles.sipReturnValNegative}
              >
                {xirrVal === undefined
                  ? 'N/A'
                  : `${xirrVal < 0 ? '−' : ''}${Math.abs(xirrVal).toFixed(2)}%`}
              </span>
            </div>
            <div className={styles.sipReturnSubRow}>
              <span className={styles.sipMetricLabel}>Abs:</span>
              <span
                className={isAbsProfit ? styles.sipReturnValPositive : styles.sipReturnValNegative}
              >
                {isAbsProfit ? '' : '−'}
                {Math.abs(absProfit).toFixed(2)}%
              </span>
            </div>
          </div>
          {/* 5. 3-Column Statistics Grid: Installments | Units | Avg. Buy Price */}
          <div className={styles.sipBottomGrid}>
            <div className={styles.sipBottomCol}>
              <span className={styles.sipBottomLabel}>Installments</span>
              <span className={styles.sipBottomValue}>{installments}</span>
            </div>
            <div className={styles.sipBottomCol}>
              <span className={styles.sipBottomLabel}>Units</span>
              <span className={styles.sipBottomValue}>
                {units.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className={styles.sipBottomCol}>
              <span className={styles.sipBottomLabel}>Avg. Buy Price</span>
              <span className={styles.sipBottomValue}>₹{Number(averageNav).toFixed(2)}</span>
            </div>
          </div>
          {/* 6. Footer Row: Calendar icon + Date range on Left, NAV start -> end on Right */}
          <div className={styles.sipFooterRow}>
            <div className={styles.sipFooterLeft}>
              <FiCalendar className={styles.sipCalendarIcon} aria-hidden="true" />
              <span className={styles.sipDateRange}>{dateRangeStr}</span>
            </div>
            <div className={styles.sipFooterRight}>
              <span className={styles.sipNavTag}>NAV</span>
              <span className={styles.sipNavPrice}>₹{startNavVal.toFixed(2)}</span>
              <span className={styles.sipNavArrow} aria-hidden="true">
                →
              </span>
              <span className={styles.sipNavPrice}>₹{endNavVal.toFixed(2)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
