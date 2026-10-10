import React, { useMemo } from 'react';
import { FiChevronRight, FiCalendar, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import type { NavType } from '../../types/types';
import styles from '../../views/MutualFundAnalytics.module.scss';
import { NavValuesSkeleton } from '../skeleton';
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
export interface FundStatsCardProps {
  start?: NavType;
  end?: NavType;
  matureAmount: number;
  profitAmount: number;
  cagr: number;
  absoluteReturn: number;
  title: string;
  color: string;
  investedAmount?: number;
  units?: number;
  avgBuyPrice?: number;
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
    investedAmount,
    units,
    avgBuyPrice,
  }) => {
    const parsed = useMemo(() => parseFundSchemeDetails(title), [title]);
    const isProfit = profitAmount >= 0;
    const dateRangeStr = useMemo(() => {
      if (!start?.date || !end?.date) return '';
      return `${formatCardDate(start.date)} – ${formatCardDate(end.date)}`;
    }, [start?.date, end?.date]);
    // Fallbacks if not passed directly
    const invested = investedAmount ?? (start && matureAmount ? matureAmount - profitAmount : 0);
    const startNavVal = start ? parseFloat(start.nav) : 0;
    const endNavVal = end ? parseFloat(end.nav) : 0;
    const calculatedUnits = units ?? (startNavVal > 0 ? invested / startNavVal : 0);
    const calculatedAvgBuy = avgBuyPrice ?? startNavVal;
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
            {/* Primary Value Row: Current Value on Left, and Right Col (Return Box + Sparkline) on Right */}
            <div className={styles.lumpsumValueCardRow}>
              <div className={styles.lumpsumValueCol}>
                <span className={styles.lumpsumValueLabel}>Current Value</span>
                <span className={styles.lumpsumValueBig}>{formatCompactRupee(matureAmount)}</span>
                <span className={styles.lumpsumValueSub}>
                  (₹{Math.round(matureAmount).toLocaleString('en-IN')})
                </span>
              </div>
              <div className={styles.lumpsumRightCol}>
                <div
                  className={`${styles.lumpsumReturnBox} ${
                    isProfit ? styles.lumpsumReturnBoxPositive : styles.lumpsumReturnBoxNegative
                  }`}
                >
                  <div
                    className={`${styles.lumpsumReturnGainRow} ${
                      isProfit
                        ? styles.lumpsumReturnGainRowPositive
                        : styles.lumpsumReturnGainRowNegative
                    }`}
                  >
                    <span>
                      {isProfit ? '+' : ''}
                      {formatCompactRupee(profitAmount)}{' '}
                    </span>
                    {isProfit ? (
                      <FiArrowUp className={styles.lumpsumGainArrowIcon} />
                    ) : (
                      <FiArrowDown className={styles.lumpsumGainArrowIcon} />
                    )}
                  </div>
                  <div className={styles.lumpsumReturnSubRow}>
                    <span>CAGR:</span>
                    <span
                      className={
                        cagr >= 0
                          ? styles.lumpsumReturnValPositive
                          : styles.lumpsumReturnValNegative
                      }
                    >
                      {cagr.toFixed(2)}%
                      <span className={styles.lumpsumReturnPercent}>
                        ({absoluteReturn.toFixed(2)}%)
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* 3-Column Mid Grid: Invested, Units, Avg. Buy Price */}
            <div className={styles.lumpsumBottomGrid}>
              <div className={styles.lumpsumBottomCol}>
                <span className={styles.lumpsumBottomLabel}>Invested</span>
                <span className={styles.lumpsumBottomValue}>
                  ₹{Math.round(invested).toLocaleString('en-IN')}
                </span>
              </div>
              <div className={styles.lumpsumBottomCol}>
                <span className={styles.lumpsumBottomLabel}>Units</span>
                <span className={styles.lumpsumBottomValue}>
                  {calculatedUnits.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className={styles.lumpsumBottomCol}>
                <span className={styles.lumpsumBottomLabel}>Avg. Buy Price</span>
                <span className={styles.lumpsumBottomValue}>₹{calculatedAvgBuy.toFixed(2)}</span>
              </div>
            </div>
            {/* Bottom Footer Row: Date Range + Duration on Left, NAV Start -> End on Right */}
            <div className={styles.lumpsumFooterRow}>
              <div className={styles.lumpsumFooterLeft}>
                <FiCalendar className={styles.lumpsumCalendarIcon} aria-hidden="true" />
                <span className={styles.lumpsumDateRange}>{dateRangeStr}</span>
              </div>
              <div className={styles.lumpsumFooterRight}>
                <span className={styles.lumpsumNavTag}>NAV</span>
                <span className={styles.lumpsumNavPrice}>₹{startNavVal.toFixed(2)}</span>
                <span className={styles.lumpsumNavArrow}>&rarr;</span>
                <span className={styles.lumpsumNavPrice}>₹{endNavVal.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
);
FundStatsCard.displayName = 'FundStatsCard';
