'use client';
import React, { useState } from 'react';
import { FiInfo, FiClock, FiCheckCircle } from 'react-icons/fi';
import type { FIIDIISummary } from '@/lib/fiiDii/fiiDiiCalculations';
import styles from './FiiDiiTracker.module.scss';
interface FiiDiiSummaryCardsProps {
  summary: FIIDIISummary | null;
  isLoading?: boolean;
}
function fmtDate(d: string): string {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${parseInt(day, 10)} ${months[parseInt(m, 10) - 1]} '${y.slice(2)}`;
}
export const FiiDiiSummaryCards: React.FC<FiiDiiSummaryCardsProps> = ({
  summary,
  isLoading,
}) => {
  const [activeInfo, setActiveInfo] = useState<'fii' | 'dii' | null>(null);
  if (isLoading || !summary) {
    return (
      <div className={styles.summarySection}>
        <div className={styles.dataSourceBannerSkeleton} />
        <div className={styles.summaryGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`${styles.summaryCard} ${styles.cardSkeleton}`}>
              <div className={styles.skeletonLine} />
              <div className={styles.skeletonValue} />
            </div>
          ))}
        </div>
      </div>
    );
  }
  const {
    latestDate,
    periodStart,
    periodEnd,
    latestFiiNet,
    latestDiiNet,
    totalFiiNet,
    totalDiiNet,
    latestNifty,
    niftyPeriodChangePercent,
    latestSensex,
    sensexPeriodChangePercent,
    adjustmentMode,
  } = summary;
  const unitLabel =
    adjustmentMode === 'ppp' ? '$M (PPP)' : adjustmentMode === 'inflation' ? '₹ Cr (Real)' : '₹ Cr';
  const formatAmount = (num: number) => {
    const prefix = num > 0 ? '+' : '';
    return `${prefix}${num.toLocaleString('en-IN', { maximumFractionDigits: 1 })}`;
  };
  const toggleInfo = (type: 'fii' | 'dii') => {
    setActiveInfo((prev) => (prev === type ? null : type));
  };
  const periodLabel = periodStart && periodEnd && periodStart !== periodEnd
    ? `${fmtDate(periodStart)} – ${fmtDate(periodEnd)}`
    : fmtDate(latestDate);
  return (
    <div className={styles.summarySection}>
      <div className={styles.dataSourceBanner}>
        <div className={styles.dataSourceIcon}>
          <FiCheckCircle size={18} />
        </div>
        <div className={styles.dataSourceContent}>
          <div className={styles.dataSourceHeader}>
            <span className={styles.dataSourceTitle}>Official Exchange Data Ingestion</span>
            <span className={styles.dataSourceTag}>
              <FiClock size={12} />
              <span>Daily at 6:00 PM IST</span>
            </span>
          </div>
          <p className={styles.dataSourceText}>
            Daily net data is ingested directly from official NSE/BSE end-of-day settlement reports
            (published each weekday at 6:00 PM IST). Values represent settled institutional transactions.
          </p>
        </div>
      </div>
      <div className={styles.summaryGrid}>
        {/* 1. Latest FII Flow */}
        <div className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleWithInfo}>
              <span className={styles.cardTitle}>Latest FII Net</span>
              <button
                type="button"
                className={styles.infoIconBtn}
                onClick={() => toggleInfo('fii')}
                title="FII derivation details"
                aria-label="FII derivation details"
              >
                <FiInfo size={14} />
              </button>
            </div>
          </div>
          <div className={styles.cardDateRange}>{fmtDate(latestDate)}</div>
          <div className={`${styles.cardValue} ${latestFiiNet >= 0 ? styles.pos : styles.neg}`}>
            {formatAmount(latestFiiNet)}{' '}
            <span className={styles.cardUnit}>{unitLabel}</span>
          </div>
          <div className={styles.cardFooter}>
            <span className={latestFiiNet >= 0 ? styles.pillBuy : styles.pillSell}>
              {latestFiiNet >= 0 ? 'Net Buyers' : 'Net Sellers'}
            </span>
          </div>
          {activeInfo === 'fii' && (
            <div className={styles.infoPopover}>
              <div className={styles.popoverHeader}>
                <strong>FII Net Flow Derivation</strong>
                <button type="button" className={styles.popoverCloseBtn} onClick={() => setActiveInfo(null)}>✕</button>
              </div>
              <p className={styles.popoverText}><strong>Formula:</strong> Net = FII Gross Buy − FII Gross Sell.</p>
              <p className={styles.popoverSubText}>Source: Ingested from official NSE/BSE EOD reports at 6:00 PM IST.</p>
            </div>
          )}
        </div>
        {/* 2. Latest DII Flow */}
        <div className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleWithInfo}>
              <span className={styles.cardTitle}>Latest DII Net</span>
              <button
                type="button"
                className={styles.infoIconBtn}
                onClick={() => toggleInfo('dii')}
                title="DII derivation details"
                aria-label="DII derivation details"
              >
                <FiInfo size={14} />
              </button>
            </div>
          </div>
          <div className={styles.cardDateRange}>{fmtDate(latestDate)}</div>
          <div className={`${styles.cardValue} ${latestDiiNet >= 0 ? styles.pos : styles.neg}`}>
            {formatAmount(latestDiiNet)}{' '}
            <span className={styles.cardUnit}>{unitLabel}</span>
          </div>
          <div className={styles.cardFooter}>
            <span className={latestDiiNet >= 0 ? styles.pillBuy : styles.pillSell}>
              {latestDiiNet >= 0 ? 'Net Buyers' : 'Net Sellers'}
            </span>
          </div>
          {activeInfo === 'dii' && (
            <div className={styles.infoPopover}>
              <div className={styles.popoverHeader}>
                <strong>DII Net Flow Derivation</strong>
                <button type="button" className={styles.popoverCloseBtn} onClick={() => setActiveInfo(null)}>✕</button>
              </div>
              <p className={styles.popoverText}><strong>Formula:</strong> Net = DII Gross Buy − DII Gross Sell.</p>
              <p className={styles.popoverSubText}>Includes Mutual Funds, Insurance (LIC), Pension Funds, and Banks.</p>
            </div>
          )}
        </div>
        {/* 3. Period Net Total */}
        <div className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Period Net Total</span>
            <span className={styles.cardTag}>{summary.totalPeriodDays} buckets</span>
          </div>
          <div className={styles.cardDateRange}>{periodLabel}</div>
          <div className={styles.cardSplitRow}>
            <div>
              <span className={styles.splitLabel}>FII:</span>
              <span className={`${styles.splitVal} ${totalFiiNet >= 0 ? styles.pos : styles.neg}`}>
                {formatAmount(totalFiiNet)}
              </span>
            </div>
            <div>
              <span className={styles.splitLabel}>DII:</span>
              <span className={`${styles.splitVal} ${totalDiiNet >= 0 ? styles.pos : styles.neg}`}>
                {formatAmount(totalDiiNet)}
              </span>
            </div>
          </div>
          <div className={styles.cardFooter}>
            <span className={styles.cardMetaText}>
              Net: {(totalFiiNet + totalDiiNet) >= 0 ? '+' : ''}
              {(totalFiiNet + totalDiiNet).toLocaleString('en-IN', { maximumFractionDigits: 1 })}{' '}
              {unitLabel}
            </span>
          </div>
        </div>
        {/* 4. Index Benchmarks */}
        <div className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Index Benchmarks</span>
            <span className={styles.cardDate}>Closing</span>
          </div>
          <div className={styles.cardDateRange}>{periodLabel}</div>
          <div className={styles.cardSplitRow}>
            <div>
              <span className={styles.splitLabel}>Nifty 50:</span>
              <span className={styles.splitVal}>
                {latestNifty ? latestNifty.toLocaleString('en-IN') : '—'}
              </span>
              {niftyPeriodChangePercent !== null && (
                <span className={`${styles.changeBadge} ${niftyPeriodChangePercent >= 0 ? styles.pos : styles.neg}`}>
                  {niftyPeriodChangePercent >= 0 ? '▲' : '▼'} {Math.abs(niftyPeriodChangePercent)}%
                </span>
              )}
            </div>
            <div>
              <span className={styles.splitLabel}>Sensex:</span>
              <span className={styles.splitVal}>
                {latestSensex ? latestSensex.toLocaleString('en-IN') : '—'}
              </span>
              {sensexPeriodChangePercent !== null && (
                <span className={`${styles.changeBadge} ${sensexPeriodChangePercent >= 0 ? styles.pos : styles.neg}`}>
                  {sensexPeriodChangePercent >= 0 ? '▲' : '▼'} {Math.abs(sensexPeriodChangePercent)}%
                </span>
              )}
            </div>
          </div>
          <div className={styles.cardFooter}>
            <span className={styles.cardMetaText}>
              CPI: {summary.cpiLatest} | PPP: ₹{summary.pppLatest}/$
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
