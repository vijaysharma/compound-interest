'use client';
import React from 'react';
import styles from '../WoodCalculator.module.scss';
export interface WoodExtraChargesProps {
  cutsCharge: string;
  labourCharge: string;
  shippingCharge: string;
  totalCft: number;
  totalCost: number;
  onCutsChange: (val: string) => void;
  onLabourChange: (val: string) => void;
  onShippingChange: (val: string) => void;
}
export const WoodExtraCharges: React.FC<WoodExtraChargesProps> = React.memo(
  ({
    cutsCharge,
    labourCharge,
    shippingCharge,
    totalCft,
    totalCost,
    onCutsChange,
    onLabourChange,
    onShippingChange,
  }) => (
    <>
      <h3 className={styles.sectionHeader}>Extra Charges</h3>
      <div className={styles.extraChargesBox}>
        <div>
          <label className={styles.label}>Cuts (₹)</label>
          <input
            type="number"
            className={styles.input}
            value={cutsCharge}
            onChange={(e) => onCutsChange(e.target.value)}
          />
        </div>
        <div>
          <label className={styles.label}>Labour (₹)</label>
          <input
            type="number"
            className={styles.input}
            value={labourCharge}
            onChange={(e) => onLabourChange(e.target.value)}
          />
        </div>
        <div>
          <label className={styles.label}>Shipping (₹)</label>
          <input
            type="number"
            className={styles.input}
            value={shippingCharge}
            onChange={(e) => onShippingChange(e.target.value)}
          />
        </div>
      </div>
      <div className={styles.totalsGrid}>
        <div className={styles.totalCard}>
          <span className={styles.totalLabel}>Total Volume</span>
          <span className={styles.totalVal}>{totalCft.toFixed(3)} CFT</span>
        </div>
        <div className={styles.finalCostCard}>
          <span className={styles.totalLabel}>Final Cost</span>
          <span className={styles.finalCostVal}>₹{totalCost.toFixed(0)}</span>
        </div>
      </div>
    </>
  )
);
WoodExtraCharges.displayName = 'WoodExtraCharges';
