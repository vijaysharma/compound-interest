'use client';
import React, { useMemo, useState } from 'react';
import { FiInfo } from 'react-icons/fi';
import type {
  AdjustmentMode,
  ViewMode,
  Timeframe,
  FlowInterval,
} from '@/lib/fiiDii/fiiDiiCalculations';
import { FLOW_INTERVALS, isIntervalAllowedForTimeframe } from '@/lib/fiiDii/fiiDiiCalculations';
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
  showFii: boolean;
  setShowFii: (s: boolean) => void;
  showDii: boolean;
  setShowDii: (s: boolean) => void;
  showNifty: boolean;
  setShowNifty: (s: boolean) => void;
  showSensex: boolean;
  setShowSensex: (s: boolean) => void;
  isLoading?: boolean;
}

const QUICK_TFS: Timeframe[] = ['1W', '1M', '3M', '6M', '1Y', '5Y', 'ALL'];

const ADJUSTMENT_EXPLANATIONS: Record<AdjustmentMode, string> = {
  nominal: 'Nominal (₹ Cr): Raw transaction flow settled on NSE/BSE without macroeconomic adjustments.',
  inflation: 'Inflation Adjusted: Historical flows normalized against India CPI index to reflect real current purchasing power.',
  ppp: 'PPP Adjusted ($M): Converted to USD Millions using World Bank Purchasing Power Parity factor for cross-border comparison.',
};

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
  showFii,
  setShowFii,
  showDii,
  setShowDii,
  showNifty,
  setShowNifty,
  showSensex,
  setShowSensex,
  isLoading,
}) => {
  const [activeInfoMode, setActiveInfoMode] = useState<AdjustmentMode | null>(null);

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
      {/* 1. Time Interval Chips - Disabled if timeframe is shorter than interval */}
      {interval && setInterval && (
        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>Time Interval:</span>
          <div className={styles.chipsScroll}>
            {FLOW_INTERVALS.map((item) => {
              const isAllowed = isIntervalAllowedForTimeframe(item.key, timeframe);
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`${styles.chipBtn} ${interval === item.key ? styles.chipBtnActive : ''} ${!isAllowed ? styles.chipBtnDisabled : ''}`}
                  onClick={() => setInterval(item.key)}
                  disabled={isLoading || !isAllowed}
                  title={
                    !isAllowed
                      ? `Interval '${item.label}' is longer than the selected duration (${timeframe})`
                      : `Group flows by ${item.label}`
                  }
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Duration: quick chips (1W, 1M, 3M, 6M, 1Y, 5Y, ALL) + FY dropdown */}
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

      {/* 3. Adjustment Mode with info explanation */}
      <div className={styles.controlGroup}>
        <span className={styles.controlLabel}>Adjustment:</span>
        <div className={styles.segmentedControl}>
          <button
            type="button"
            className={`${styles.segmentBtn} ${adjustmentMode === 'nominal' ? styles.segmentBtnActive : ''}`}
            onClick={() => setAdjustmentMode('nominal')}
            disabled={isLoading}
          >
            <span>Nominal (₹ Cr)</span>
            <span
              className={styles.segmentInfoIcon}
              onClick={(e) => {
                e.stopPropagation();
                setActiveInfoMode((prev) => (prev === 'nominal' ? null : 'nominal'));
              }}
              title="What is Nominal?"
              role="button"
              tabIndex={0}
              aria-label="Nominal mode information"
            >
              <FiInfo size={12} />
            </span>
          </button>
          <button
            type="button"
            className={`${styles.segmentBtn} ${adjustmentMode === 'inflation' ? styles.segmentBtnActive : ''}`}
            onClick={() => setAdjustmentMode('inflation')}
            disabled={isLoading}
          >
            <span>Inflation Adj.</span>
            <span
              className={styles.segmentInfoIcon}
              onClick={(e) => {
                e.stopPropagation();
                setActiveInfoMode((prev) => (prev === 'inflation' ? null : 'inflation'));
              }}
              title="What is Inflation Adjusted?"
              role="button"
              tabIndex={0}
              aria-label="Inflation adjusted information"
            >
              <FiInfo size={12} />
            </span>
          </button>
          <button
            type="button"
            className={`${styles.segmentBtn} ${adjustmentMode === 'ppp' ? styles.segmentBtnActive : ''}`}
            onClick={() => setAdjustmentMode('ppp')}
            disabled={isLoading}
          >
            <span>PPP Adj.</span>
            <span
              className={styles.segmentInfoIcon}
              onClick={(e) => {
                e.stopPropagation();
                setActiveInfoMode((prev) => (prev === 'ppp' ? null : 'ppp'));
              }}
              title="What is PPP Adjusted?"
              role="button"
              tabIndex={0}
              aria-label="PPP adjusted information"
            >
              <FiInfo size={12} />
            </span>
          </button>
        </div>

        {/* Inline explanation card for selected mode or info click */}
        <div className={styles.adjExplanationCard}>
          <span style={{ fontWeight: 600 }}>Mode Note: </span>
          {ADJUSTMENT_EXPLANATIONS[activeInfoMode || adjustmentMode]}
        </div>
      </div>

      {/* 4. View + Chart + Overlays (FII, DII, Nifty 50, Sensex) */}
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
          <span className={styles.controlLabel}>Overlays & Series:</span>
          <div className={styles.togglesRow}>
            {/* FII Series Toggle */}
            <label className={`${styles.toggleChip} ${showFii ? styles.toggleChipFiiActive : ''}`}>
              <input
                type="checkbox"
                checked={showFii}
                onChange={(e) => setShowFii(e.target.checked)}
                className={styles.hiddenCheckbox}
              />
              <span className={styles.toggleDot} style={{ background: '#2563eb' }} />
              <span>FII Net</span>
            </label>

            {/* DII Series Toggle */}
            <label className={`${styles.toggleChip} ${showDii ? styles.toggleChipDiiActive : ''}`}>
              <input
                type="checkbox"
                checked={showDii}
                onChange={(e) => setShowDii(e.target.checked)}
                className={styles.hiddenCheckbox}
              />
              <span className={styles.toggleDot} style={{ background: '#059669' }} />
              <span>DII Net</span>
            </label>

            {/* Nifty 50 Overlay */}
            <label className={`${styles.toggleChip} ${showNifty ? styles.toggleChipNiftyActive : ''}`}>
              <input
                type="checkbox"
                checked={showNifty}
                onChange={(e) => setShowNifty(e.target.checked)}
                className={styles.hiddenCheckbox}
              />
              <span className={styles.toggleDot} style={{ background: '#8b5cf6' }} />
              <span>Nifty 50</span>
            </label>

            {/* Sensex Overlay */}
            <label className={`${styles.toggleChip} ${showSensex ? styles.toggleChipSensexActive : ''}`}>
              <input
                type="checkbox"
                checked={showSensex}
                onChange={(e) => setShowSensex(e.target.checked)}
                className={styles.hiddenCheckbox}
              />
              <span className={styles.toggleDot} style={{ background: '#f97316' }} />
              <span>Sensex</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
