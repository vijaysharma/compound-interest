'use client';
import React from 'react';
import { FiPackage } from 'react-icons/fi';
import { ShiprocketItemFields } from './ShiprocketItemFields';
import styles from '../ShiprocketDashboard.module.scss';
export interface ShiprocketCreatePackageProps {
  weight: string;
  length: string;
  breadth: string;
  height: string;
  items: Array<{ name: string; sku: string; units: string; selling_price: string }>;
  shippingCharges: string;
  discount: string;
  volumetricWeight: string;
  appliedWeight: string;
  onWeightChange: (val: string) => void;
  onLengthChange: (val: string) => void;
  onBreadthChange: (val: string) => void;
  onHeightChange: (val: string) => void;
  onShippingChargesChange: (val: string) => void;
  onDiscountChange: (val: string) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onItemChange: (index: number, field: 'name' | 'sku' | 'units' | 'selling_price', val: string) => void;
}
export const ShiprocketCreatePackageSection: React.FC<ShiprocketCreatePackageProps> = React.memo(
  ({
    weight,
    length,
    breadth,
    height,
    volumetricWeight,
    appliedWeight,
    onWeightChange,
    onLengthChange,
    onBreadthChange,
    onHeightChange,
    ...itemProps
  }) => (
    <>
      <div className={styles.formSectionTitle}>
        <FiPackage /> Package & Dimensions
      </div>
      <div className={styles.formGrid4}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Dead Weight (kg)*</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className={styles.fieldInput}
            value={weight}
            onChange={(e) => onWeightChange(e.target.value)}
            required
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Length (cm)*</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className={styles.fieldInput}
            value={length}
            onChange={(e) => onLengthChange(e.target.value)}
            required
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Breadth (cm)*</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className={styles.fieldInput}
            value={breadth}
            onChange={(e) => onBreadthChange(e.target.value)}
            required
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Height (cm)*</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className={styles.fieldInput}
            value={height}
            onChange={(e) => onHeightChange(e.target.value)}
            required
          />
        </div>
      </div>
      <div className={styles.volumetricCallout}>
        <div>
          <strong>Volumetric Weight:</strong> {volumetricWeight} kg
        </div>
        <div>
          <strong>Applied Weight (Chargeable):</strong> {appliedWeight} kg
        </div>
      </div>
      <ShiprocketItemFields {...itemProps} />
    </>
  )
);
ShiprocketCreatePackageSection.displayName = 'ShiprocketCreatePackageSection';
