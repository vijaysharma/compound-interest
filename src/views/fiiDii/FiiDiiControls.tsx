'use client';
import React, { useState } from 'react';
import { FiInfo } from 'react-icons/fi';
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
  const [hoveredInfoMode, setHoveredInfoMode] = useState<AdjustmentMode | null>(null);
  return (
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
              className={styles.adjModeTooltipContainer}
              onMouseEnter={() => setHoveredInfoMode('nominal')}
              onMouseLeave={() => setHoveredInfoMode(null)}
              onClick={(e) => e.stopPropagation()}
            >
              <span
                className={styles.segmentInfoIcon}
                role="button"
                tabIndex={0}
                aria-label="Nominal mode information"
              >
                <FiInfo size={13} />
              </span>
              {hoveredInfoMode === 'nominal' && (
                <div className={styles.adjTooltipPopover} role="tooltip">
                  {ADJUSTMENT_EXPLANATIONS.nominal}
                </div>
              )}
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
              className={styles.adjModeTooltipContainer}
              onMouseEnter={() => setHoveredInfoMode('inflation')}
              onMouseLeave={() => setHoveredInfoMode(null)}
              onClick={(e) => e.stopPropagation()}
            >
              <span
                className={styles.segmentInfoIcon}
                role="button"
                tabIndex={0}
                aria-label="Inflation adjusted information"
              >
                <FiInfo size={13} />
              </span>
              {hoveredInfoMode === 'inflation' && (
                <div className={styles.adjTooltipPopover} role="tooltip">
                  {ADJUSTMENT_EXPLANATIONS.inflation}
                </div>
              )}
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
              className={styles.adjModeTooltipContainer}
              onMouseEnter={() => setHoveredInfoMode('ppp')}
              onMouseLeave={() => setHoveredInfoMode(null)}
              onClick={(e) => e.stopPropagation()}
            >
              <span
                className={styles.segmentInfoIcon}
                role="button"
                tabIndex={0}
                aria-label="PPP adjusted information"
              >
                <FiInfo size={13} />
              </span>
              {hoveredInfoMode === 'ppp' && (
                <div className={styles.adjTooltipPopover} role="tooltip">
                  {ADJUSTMENT_EXPLANATIONS.ppp}
                </div>
              )}
            </span>
          </button>
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
