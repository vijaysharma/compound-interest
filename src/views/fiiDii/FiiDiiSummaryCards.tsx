'use client';
import React from 'react';
import type { FIIDIISummary } from '@/lib/fiiDii/fiiDiiCalculations';
import styles from './FiiDiiTracker.module.scss';
interface FiiDiiSummaryCardsProps {
  summary: FIIDIISummary | null;
  isLoading?: boolean;
}
export const FiiDiiSummaryCards: React.FC<FiiDiiSummaryCardsProps> = ({
  summary,
  isLoading,
}) => {
  if (isLoading || !summary) {
    return (
      <div className={styles.summaryGrid}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`${styles.summaryCard} ${styles.cardSkeleton}`}>
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonValue} />
          </div>
        ))}
      </div>
    );
  }
  const {
    latestDate,
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
  return (
    <div className={styles.summaryGrid}>
      {/* 1. Latest FII Flow */}
      <div className={styles.summaryCard}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>Latest FII Net</span>
          <span className={styles.cardDate}>{latestDate}</span>
        </div>
        <div className={`${styles.cardValue} ${latestFiiNet >= 0 ? styles.pos : styles.neg}`}>
          {formatAmount(latestFiiNet)}{' '}
          <span className={styles.cardUnit}>{unitLabel}</span>
        </div>
        <div className={styles.cardFooter}>
          <span className={latestFiiNet >= 0 ? styles.pillBuy : styles.pillSell}>
            {latestFiiNet >= 0 ? 'Net Buyers' : 'Net Sellers'}
          </span>
        </div>
      </div>
      {/* 2. Latest DII Flow */}
      <div className={styles.summaryCard}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>Latest DII Net</span>
          <span className={styles.cardDate}>{latestDate}</span>
        </div>
        <div className={`${styles.cardValue} ${latestDiiNet >= 0 ? styles.pos : styles.neg}`}>
          {formatAmount(latestDiiNet)}{' '}
          <span className={styles.cardUnit}>{unitLabel}</span>
        </div>
        <div className={styles.cardFooter}>
          <span className={latestDiiNet >= 0 ? styles.pillBuy : styles.pillSell}>
            {latestDiiNet >= 0 ? 'Net Buyers' : 'Net Sellers'}
          </span>
        </div>
      </div>
      {/* 3. Period Total Cumulative Inflows */}
      <div className={styles.summaryCard}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>Period Net Total</span>
          <span className={styles.cardTag}>{summary.totalPeriodDays} days</span>
        </div>
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
            Net Institutional Balance: {(totalFiiNet + totalDiiNet) >= 0 ? '+' : ''}
            {(totalFiiNet + totalDiiNet).toLocaleString('en-IN', { maximumFractionDigits: 1 })} {unitLabel}
          </span>
        </div>
      </div>
      {/* 4. Index Levels */}
      <div className={styles.summaryCard}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>Index Benchmarks</span>
          <span className={styles.cardDate}>Closing</span>
        </div>
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
  );
};
