'use client';
import React from 'react';
import styles from '../ShiprocketRates.module.scss';
export interface DimensionsInputsProps {
  length: string;
  breadth: string;
  height: string;
  weight: string;
  volumetricWeight: string;
  loading: boolean;
  hasResult: boolean;
  onLengthChange: (val: string) => void;
  onBreadthChange: (val: string) => void;
  onHeightChange: (val: string) => void;
  onWeightChange: (val: string) => void;
  onFetchRates: () => void;
}
export const DimensionsInputs: React.FC<DimensionsInputsProps> = React.memo(
  ({
    length,
    breadth,
    height,
    weight,
    volumetricWeight,
    loading,
    hasResult,
    onLengthChange,
    onBreadthChange,
    onHeightChange,
    onWeightChange,
    onFetchRates,
  }) => (
    <>
      <div className={styles.dimensionsGrid}>
        <div>
          <label className={styles.dimLabel}>
            Length (cm)*
          </label>
          <input
            type="number"
            className={styles.input}
            value={length}
            onChange={(e) => onLengthChange(e.target.value)}
            placeholder="Required"
          />
        </div>
        <div>
          <label className={styles.dimLabel}>
            Breadth (cm)*
          </label>
          <input
            type="number"
            className={styles.input}
            value={breadth}
            onChange={(e) => onBreadthChange(e.target.value)}
            placeholder="Required"
          />
        </div>
        <div>
          <label className={styles.dimLabel}>
            Height (cm)*
          </label>
          <input
            type="number"
            className={styles.input}
            value={height}
            onChange={(e) => onHeightChange(e.target.value)}
            placeholder="Required"
          />
        </div>
        <div>
          <label className={styles.dimLabel}>
            D. Weight (kg)*
          </label>
          <input
            type="number"
            className={styles.input}
            value={weight}
            onChange={(e) => onWeightChange(e.target.value)}
          />
        </div>
      </div>
      <div className={styles.summaryBox}>
        <div className={styles.summaryVolumetric}>
          Volumetric Weight
          <span>{volumetricWeight} kg</span>
        </div>
        <div className={styles.summaryApplied}>
          Applied Weight
          <strong>
            {Math.max(Number(weight || 0), Number(volumetricWeight))} kg
          </strong>
        </div>
      </div>
      <div className={styles.actionsRow}>
        <button className={styles.submitBtn} onClick={onFetchRates} disabled={loading}>
          {loading ? (
            <span className={styles.btnSpinner} />
          ) : hasResult ? (
            'Refresh Rates'
          ) : (
            'Get Rates'
          )}
        </button>
      </div>
    </>
  )
);
DimensionsInputs.displayName = 'DimensionsInputs';
