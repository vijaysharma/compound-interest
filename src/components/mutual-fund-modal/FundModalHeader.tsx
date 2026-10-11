import React, { useMemo } from 'react';
import { FiX, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { getChartSeriesColor } from '@/data/chartColors';
import type { DetailedFundItem, PerformanceMetrics } from './types';
import type { MFMetaType } from '../../data/api_data';
import { parseFundSchemeDetails } from '../../utilities/mutual-fund/mfCardDetails';
import { parseAnyDate } from '../../utilities/dateUtils';
import styles from '../MutualFundDetailModal.module.scss';
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
export interface FundModalHeaderProps {
  fund: DetailedFundItem;
  meta: MFMetaType | null;
  performance: PerformanceMetrics;
  holdingDays: number;
  startDateISO: string;
  endDateISO: string;
  onClose: () => void;
}
export const FundModalHeader: React.FC<FundModalHeaderProps> = React.memo(
  ({ fund, performance, holdingDays, startDateISO, endDateISO, onClose }) => {
    const parsed = useMemo(() => parseFundSchemeDetails(fund.schemeName), [fund.schemeName]);
    const isProfit = performance.gain >= 0;
    // Determine invested, units, and avg buy price
    const invested =
      performance.invested > 0 ? performance.invested : fund.investedAmount || fund.invAmt || 0;
    const sNav =
      performance.startNavVal > 0
        ? performance.startNavVal
        : fund.startNav
          ? typeof fund.startNav === 'number'
            ? fund.startNav
            : parseFloat(fund.startNav.nav)
          : 0;
    const eNav =
      performance.endNavVal > 0
        ? performance.endNavVal
        : fund.endNav
          ? typeof fund.endNav === 'number'
            ? fund.endNav
            : parseFloat(fund.endNav.nav)
          : 0;
    const units = fund.units ?? (sNav > 0 ? invested / sNav : 0);
    const avgBuyPrice = fund.avgBuyPrice ?? sNav;
    // Date range string and duration badge
    const dateRangeStr = useMemo(() => {
      if (!startDateISO || !endDateISO) return '';
      return `${formatCardDate(startDateISO)} – ${formatCardDate(endDateISO)}`;
    }, [startDateISO, endDateISO]);
    const durationMonths = Math.max(1, Math.round(holdingDays / 30.4375));
    const durationLabel =
      holdingDays >= 365 ? `${(holdingDays / 365.25).toFixed(1)}y` : `${durationMonths}m`;
    return (
      <div className={styles.headerWrapper}>
        {/* Top Header Row */}
        <div className={styles.headerTop}>
          <div className={styles.headerTopLeft}>
            <span
              className={styles.colorIndicator}
              style={{ backgroundColor: fund.color || getChartSeriesColor(0) }}
              aria-hidden="true"
            />
            <div className={styles.titleInfo}>
              <h2 className={styles.schemeTitle}>{parsed.cleanName}</h2>
              <div className={styles.subTitleRow}>
                <span>
                  {parsed.planType ? `${parsed.planType} Plan` : 'Direct Plan'} •{' '}
                  {parsed.optionType || 'Growth'}
                </span>
                <span className={styles.subTitleDivider}>|</span>
                <span>Code: {fund.schemeCode}</span>
              </div>
            </div>
          </div>
          <div className={styles.headerTopRight}>
            <button
              type="button"
              className={styles.headerCloseBtn}
              onClick={onClose}
              aria-label="Close dialog"
            >
              <FiX />
            </button>
          </div>
        </div>
        {/* Overview Stats Card */}
        <div className={styles.overviewCard}>
          <div className={styles.overviewMainRow}>
            {/* Left: Current Value */}
            <div className={styles.overviewCurrentValCol}>
              <span className={styles.overviewLabel}>Current Value</span>
              <div className={styles.overviewValueWrap}>
                <span className={styles.overviewValueBig}>
                  {formatCompactRupee(performance.maturity)}
                </span>
                <span className={styles.overviewValueExact}>
                  (₹{Math.round(performance.maturity).toLocaleString('en-IN')})
                </span>
              </div>
            </div>
            {/* Right: Return Box */}
            <div
              className={`${styles.overviewReturnBox} ${
                isProfit ? styles.overviewReturnBoxPositive : styles.overviewReturnBoxNegative
              }`}
            >
              <div className={styles.overviewReturnGainRow}>
                <span>
                  {isProfit ? '+' : ''}
                  {formatCompactRupee(performance.gain)}
                </span>
                {isProfit ? (
                  <FiArrowUp className={styles.overviewReturnArrow} />
                ) : (
                  <FiArrowDown className={styles.overviewReturnArrow} />
                )}
              </div>
              <div className={styles.overviewReturnRatesRow}>
                <span>
                  CAGR {performance.cagr.toFixed(2)}% | Abs {performance.absReturn.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          {/* 3-Column Key Stats */}
          <div className={styles.overviewStatsRow}>
            <div className={styles.overviewStatCol}>
              <span className={styles.statColLabel}>Invested</span>
              <span className={styles.statColValue}>
                ₹{Math.round(invested).toLocaleString('en-IN')}
              </span>
            </div>
            <div className={styles.overviewStatCol}>
              <span className={styles.statColLabel}>Units</span>
              <span className={styles.statColValue}>
                {units.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className={styles.overviewStatCol}>
              <span className={styles.statColLabel}>Avg. Buy Price</span>
              <span className={styles.statColValue}>₹{avgBuyPrice.toFixed(2)}</span>
            </div>
          </div>
          {/* Overview Footer: Date range + NAVs */}
          <div className={styles.overviewFooterRow}>
            <div className={styles.overviewFooterLeft}>
              <span>{dateRangeStr}</span>
              <span className={styles.overviewDurationBadge}>({durationLabel})</span>
            </div>
            <div className={styles.overviewFooterRight}>
              <span>
                NAV ₹{sNav.toFixed(2)} → ₹{eNav.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
FundModalHeader.displayName = 'FundModalHeader';
