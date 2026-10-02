'use client';
import React from 'react';
import { InfoTooltip } from '@/components/InfoTooltip';
import type { AdjustmentMode, ViewMode } from '@/lib/fiiDii/fiiDiiCalculations';
import type { ChartType } from './FiiDiiChart';
import styles from './FiiDiiTracker.module.scss';
interface FiiDiiControlsProps {
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
const ADJUSTMENT_EXPLANATIONS: Record<AdjustmentMode, string> = {
  nominal:
    'Nominal (₹ Cr): Raw transaction flow settled on NSE/BSE without macroeconomic adjustments.',
  inflation:
    'Inflation Adjusted: Historical flows normalized against India CPI index to reflect real current purchasing power.',
  ppp: 'PPP Adjusted ($M): Converted to USD Millions using World Bank Purchasing Power Parity factor for cross-border comparison.',
};
const ADJUSTMENT_OPTIONS: Array<{
  mode: AdjustmentMode;
  label: string;
  ariaLabel: string;
  align: 'left' | 'center' | 'right';
}> = [
  {
    mode: 'nominal',
    label: 'Nominal (₹ Cr)',
    ariaLabel: 'Nominal mode information',
    align: 'left',
  },
  {
    mode: 'inflation',
    label: 'Inflation Adj.',
    ariaLabel: 'Inflation adjusted information',
    align: 'center',
  },
  { mode: 'ppp', label: 'PPP Adj.', ariaLabel: 'PPP adjusted information', align: 'right' },
];
export const FiiDiiControls: React.FC<FiiDiiControlsProps> = ({
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
  return (
    <div className={styles.viewAndOverlaysRow}>
      <div className={styles.viewAndChartRow}>
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
      </div>
      <div className={styles.controlGroup}>
        <span className={styles.controlLabel}>Adjustment:</span>
        <div className={styles.adjSegmentedControl}>
          {ADJUSTMENT_OPTIONS.map(({ mode, label, ariaLabel, align }) => (
            <button
              key={mode}
              type="button"
              className={`${styles.segmentBtn} ${adjustmentMode === mode ? styles.segmentBtnActive : ''}`}
              onClick={() => setAdjustmentMode(mode)}
              disabled={isLoading}
            >
              <span>{label}</span>
              <InfoTooltip ariaLabel={ariaLabel} align={align}>
                <p>{ADJUSTMENT_EXPLANATIONS[mode]}</p>
              </InfoTooltip>
            </button>
          ))}
        </div>
      </div>
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
          <label
            className={`${styles.toggleChip} ${showNifty ? styles.toggleChipNiftyActive : ''}`}
          >
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
          <label
            className={`${styles.toggleChip} ${showSensex ? styles.toggleChipSensexActive : ''}`}
          >
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
  );
};
