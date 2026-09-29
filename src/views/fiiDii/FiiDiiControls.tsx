'use client';
import React, { useMemo } from 'react';
import type {
  AdjustmentMode,
  ViewMode,
  Timeframe,
  FlowInterval,
} from '@/lib/fiiDii/fiiDiiCalculations';
import { FLOW_INTERVALS } from '@/lib/fiiDii/fiiDiiCalculations';
import type { ChartType } from './FiiDiiChart';
import styles from './FiiDiiTracker.module.scss';
interface FiiDiiControlsProps {
  timeframe: Timeframe;
  setTimeframe: (t: Timeframe) => void;
  interval?: FlowInterval;
  setInterval?: (i: FlowInterval) => void;
  adjustmentMode: AdjustmentMode;
  setAdjustmentMode: (m: AdjustmentMode) => void;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  chartType?: ChartType;
  setChartType?: (c: ChartType) => void;
  showNifty: boolean;
  setShowNifty: (s: boolean) => void;
  showSensex: boolean;
  setShowSensex: (s: boolean) => void;
  isLoading?: boolean;
}
const QUICK_TFS: Timeframe[] = ['1M', '3M', '6M', '1Y', '5Y', 'ALL'];
export const FiiDiiControls: React.FC<FiiDiiControlsProps> = ({
  timeframe,
  setTimeframe,
  interval,
  setInterval,
  adjustmentMode,
  setAdjustmentMode,
  viewMode,
  setViewMode,
  chartType,
  setChartType,
  showNifty,
  setShowNifty,
  showSensex,
  setShowSensex,
  isLoading,
}) => {
  const fyOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const opts: { value: Timeframe; label: string }[] = [];
    for (let y = currentYear + 1; y >= 2008; y--) {
      opts.push({ value: `FY${y}` as Timeframe, label: `FY${y - 1}–${String(y).slice(2)} (Apr–Mar)` });
    }
    return opts;
  }, []);
  const isFyActive = typeof timeframe === 'string' && timeframe.startsWith('FY');
  return (
    <div className={styles.controlsContainer}>
      {/* 1. Time Interval Chips */}
      {interval && setInterval && (
        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>Time Interval:</span>
          <div className={styles.chipsScroll}>
            {FLOW_INTERVALS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`${styles.chipBtn} ${interval === item.key ? styles.chipBtnActive : ''}`}
                onClick={() => setInterval(item.key)}
                disabled={isLoading}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {/* 2. Duration: quick chips + FY dropdown */}
      <div className={styles.controlGroup}>
        <span className={styles.controlLabel}>Duration:</span>
        <div className={styles.durationRow}>
          <div className={styles.chipsScroll}>
            {QUICK_TFS.map((tf) => {
              const isActive = timeframe === tf || (tf === 'ALL' && timeframe === 'MAX');
              return (
                <button
                  key={tf}
                  type="button"
                  className={`${styles.chipBtn} ${isActive ? styles.chipBtnActive : ''}`}
                  onClick={() => setTimeframe(tf)}
                  disabled={isLoading}
                >
                  {tf}
                </button>
              );
            })}
          </div>
          <div className={styles.fyDropdownWrap}>
            <select
              className={`${styles.fySelect} ${isFyActive ? styles.fySelectActive : ''}`}
              value={isFyActive ? String(timeframe) : ''}
              onChange={(e) => {
                if (e.target.value) setTimeframe(e.target.value as Timeframe);
              }}
              disabled={isLoading}
              aria-label="Select Financial Year"
            >
              <option value="">FY (India)</option>
              {fyOptions.map((opt) => (
                <option key={String(opt.value)} value={String(opt.value)}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      {/* 3. Adjustment Mode */}
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
            Inflation Adj.
          </button>
          <button
            type="button"
            className={`${styles.segmentBtn} ${adjustmentMode === 'ppp' ? styles.segmentBtnActive : ''}`}
            onClick={() => setAdjustmentMode('ppp')}
            disabled={isLoading}
          >
            PPP Adj.
          </button>
        </div>
      </div>
      {/* 4. View + Chart + Overlays */}
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
              Cumulative
            </button>
          </div>
        </div>
        {chartType && setChartType && (
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Chart:</span>
            <div className={styles.segmentedControl}>
              <button
                type="button"
                className={`${styles.segmentBtn} ${chartType === 'bar' ? styles.segmentBtnActive : ''}`}
                onClick={() => setChartType('bar')}
                disabled={isLoading}
              >
                Bar
              </button>
              <button
                type="button"
                className={`${styles.segmentBtn} ${chartType === 'line' ? styles.segmentBtnActive : ''}`}
                onClick={() => setChartType('line')}
                disabled={isLoading}
              >
                Line
              </button>
            </div>
          </div>
        )}
        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>Overlays:</span>
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
              <span>Sensex</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
