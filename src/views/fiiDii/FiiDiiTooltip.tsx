'use client';
import React from 'react';
import type { ProcessedFIIDIIPoint, AdjustmentMode, ViewMode } from '@/lib/fiiDii/fiiDiiCalculations';
import styles from './FiiDiiTracker.module.scss';
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload?: ProcessedFIIDIIPoint;
    value?: number;
    dataKey?: string | number;
    name?: string;
  }>;
  adjustmentMode: AdjustmentMode;
  viewMode: ViewMode;
  showNifty: boolean;
  showSensex: boolean;
}
export const FiiDiiTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  adjustmentMode,
  viewMode,
  showNifty,
  showSensex,
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0]?.payload as ProcessedFIIDIIPoint | undefined;
  if (!data) return null;
  const unitLabel =
    adjustmentMode === 'ppp' ? '$M (PPP)' : adjustmentMode === 'inflation' ? '₹ Cr (Real)' : '₹ Cr';
  const formatVal = (v: number) => {
    const sign = v > 0 ? '+' : '';
    return `${sign}${v.toLocaleString('en-IN', { maximumFractionDigits: 1 })}`;
  };
  const fiiVal = viewMode === 'cumulative' ? data.cumulativeFiiNet : data.fiiNet;
  const diiVal = viewMode === 'cumulative' ? data.cumulativeDiiNet : data.diiNet;
  return (
    <div className={styles.tooltipCard}>
      <div className={styles.tooltipHeader}>
        <span className={styles.tooltipDate}>{data.formattedDate}</span>
        <span className={styles.tooltipModeBadge}>{adjustmentMode.toUpperCase()}</span>
      </div>
      <div className={styles.tooltipBody}>
        <div className={styles.tooltipRow}>
          <div className={styles.tooltipLabel}>
            <span className={`${styles.legendDot} ${styles.dotFii}`} />
            <span>FII / FPI Net:</span>
          </div>
          <span className={`${styles.tooltipValue} ${fiiVal >= 0 ? styles.pos : styles.neg}`}>
            {formatVal(fiiVal)} {unitLabel}
          </span>
        </div>
        <div className={styles.tooltipRow}>
          <div className={styles.tooltipLabel}>
            <span className={`${styles.legendDot} ${styles.dotDii}`} />
            <span>DII Net:</span>
          </div>
          <span className={`${styles.tooltipValue} ${diiVal >= 0 ? styles.pos : styles.neg}`}>
            {formatVal(diiVal)} {unitLabel}
          </span>
        </div>
        {viewMode === 'daily' && adjustmentMode === 'nominal' && (
          <div className={styles.tooltipSubRow}>
            <span>FII Buy: ₹{data.fiiBuy.toLocaleString()} Cr | Sell: ₹{data.fiiSell.toLocaleString()} Cr</span>
          </div>
        )}
        {showNifty && data.niftyClose && (
          <div className={styles.tooltipRow}>
            <div className={styles.tooltipLabel}>
              <span className={`${styles.legendDot} ${styles.dotNifty}`} />
              <span>Nifty 50:</span>
            </div>
            <span className={styles.tooltipIndexValue}>
              {data.niftyClose.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
            </span>
          </div>
        )}
        {showSensex && data.sensexClose && (
          <div className={styles.tooltipRow}>
            <div className={styles.tooltipLabel}>
              <span className={`${styles.legendDot} ${styles.dotSensex}`} />
              <span>BSE Sensex:</span>
            </div>
            <span className={styles.tooltipIndexValue}>
              {data.sensexClose.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
            </span>
          </div>
        )}
        {adjustmentMode === 'inflation' && data.cpi && (
          <div className={styles.tooltipMacroRow}>
            <span>CPI Applied: {data.cpi}</span>
          </div>
        )}
        {adjustmentMode === 'ppp' && data.ppp && (
          <div className={styles.tooltipMacroRow}>
            <span>PPP Factor: ₹{data.ppp}/$</span>
          </div>
        )}
      </div>
    </div>
  );
};
