import React from 'react';
import type { ZoomRange } from './types';
import styles from '../Chart.module.scss';
const PRESETS = ['1M', '6M', '1Y', '3Y', '5Y', 'All'];
export interface ChartZoomToolbarProps {
  showPresets?: boolean;
  activePreset: string | null;
  zoomRange: ZoomRange | null;
  onApplyPreset: (preset: string) => void;
  onResetZoom: () => void;
}
export const ChartZoomToolbar: React.FC<ChartZoomToolbarProps> = React.memo(
  ({ showPresets, activePreset, zoomRange, onApplyPreset, onResetZoom }) => (
    <div className={styles.zoomToolbar}>
      {showPresets && (
        <div className={styles.zoomPresets}>
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={`${styles.zoomPresetBtn} ${activePreset === preset ? styles.activePreset : ''}`}
              onClick={() => onApplyPreset(preset)}
            >
              {preset}
            </button>
          ))}
        </div>
      )}
      <div className={styles.zoomInfo}>
        {zoomRange ? (
          <>
            <span className={styles.zoomBadge}>
              {zoomRange.start} → {zoomRange.end}
            </span>
            <button
              type="button"
              className={styles.resetZoomBtn}
              onClick={onResetZoom}
              title="Reset Zoom"
            >
              ↩ Reset
            </button>
          </>
        ) : (
          <span className={styles.zoomHint}>Drag horizontally to zoom into a section</span>
        )}
      </div>
    </div>
  )
);
ChartZoomToolbar.displayName = 'ChartZoomToolbar';
