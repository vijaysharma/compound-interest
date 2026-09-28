'use client';
import React from 'react';
import type { AdjustmentMode, ViewMode, Timeframe } from '@/lib/fiiDii/fiiDiiCalculations';
import styles from './FiiDiiTracker.module.scss';
interface FiiDiiControlsProps {
  timeframe: Timeframe;
  setTimeframe: (t: Timeframe) => void;
  adjustmentMode: AdjustmentMode;
  setAdjustmentMode: (m: AdjustmentMode) => void;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  showNifty: boolean;
  setShowNifty: (s: boolean) => void;
  showSensex: boolean;
  setShowSensex: (s: boolean) => void;
  isLoading?: boolean;
}
const TIMEFRAMES: Timeframe[] = ['1M', '3M', '6M', '1Y', '5Y', 'MAX'];
export const FiiDiiControls: React.FC<FiiDiiControlsProps> = ({
  timeframe,
  setTimeframe,
  adjustmentMode,
  setAdjustmentMode,
  viewMode,
  setViewMode,
  showNifty,
  setShowNifty,
  showSensex,
  setShowSensex,
  isLoading,
}) => {
  return (
    <div className={styles.controlsContainer}>
      {/* 1. Timeframe Chips */}
      <div className={styles.controlGroup}>
        <span className={styles.controlLabel}>Timeframe:</span>
        <div className={styles.chipsScroll}>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              type="button"
              className={`${styles.chipBtn} ${timeframe === tf ? styles.chipBtnActive : ''}`}
              onClick={() => setTimeframe(tf)}
              disabled={isLoading}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      {/* 2. Adjustment Mode Segmented Control */}
      <div className={styles.controlGroup}>
        <span className={styles.controlLabel}>Adjustment:</span>
        <div className={styles.segmentedControl}>
          <button
            type="button"
            className={`${styles.segmentBtn} ${adjustmentMode === 'nominal' ? styles.segmentBtnActive : ''}`}
            onClick={() => setAdjustmentMode('nominal')}
            disabled={isLoading}
          >
            Nominal (₹ Cr)
          </button>
          <button
            type="button"
            className={`${styles.segmentBtn} ${adjustmentMode === 'inflation' ? styles.segmentBtnActive : ''}`}
            onClick={() => setAdjustmentMode('inflation')}
            disabled={isLoading}
          >
            Inflation Adjusted
          </button>
          <button
            type="button"
            className={`${styles.segmentBtn} ${adjustmentMode === 'ppp' ? styles.segmentBtnActive : ''}`}
            onClick={() => setAdjustmentMode('ppp')}
            disabled={isLoading}
          >
            PPP Adjusted
          </button>
        </div>
      </div>
      {/* 3. View Mode Switcher + Index Overlays */}
      <div className={styles.viewAndOverlaysRow}>
        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>View:</span>
          <div className={styles.segmentedControl}>
            <button
              type="button"
              className={`${styles.segmentBtn} ${viewMode === 'daily' ? styles.segmentBtnActive : ''}`}
              onClick={() => setViewMode('daily')}
              disabled={isLoading}
            >
              Daily Net
            </button>
            <button
              type="button"
              className={`${styles.segmentBtn} ${viewMode === 'cumulative' ? styles.segmentBtnActive : ''}`}
              onClick={() => setViewMode('cumulative')}
              disabled={isLoading}
            >
              Cumulative Net
            </button>
          </div>
        </div>
        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>Index Overlays:</span>
          <div className={styles.togglesRow}>
            <label className={`${styles.toggleChip} ${showNifty ? styles.toggleChipNiftyActive : ''}`}>
              <input
                type="checkbox"
                checked={showNifty}
                onChange={(e) => setShowNifty(e.target.checked)}
                className={styles.hiddenCheckbox}
              />
              <span className={styles.toggleDot} style={{ background: '#3b82f6' }} />
              <span>Nifty 50</span>
            </label>
            <label className={`${styles.toggleChip} ${showSensex ? styles.toggleChipSensexActive : ''}`}>
              <input
                type="checkbox"
                checked={showSensex}
                onChange={(e) => setShowSensex(e.target.checked)}
                className={styles.hiddenCheckbox}
              />
              <span className={styles.toggleDot} style={{ background: '#ec4899' }} />
              <span>BSE Sensex</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
