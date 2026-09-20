'use client';
import React from 'react';
import { FiPackage } from 'react-icons/fi';
import styles from '../ShiprocketDashboard.module.scss';
export interface ShiprocketItemFieldsProps {
  itemName: string;
  itemSku: string;
  itemQty: string;
  itemPrice: string;
  onItemNameChange: (val: string) => void;
  onItemSkuChange: (val: string) => void;
  onItemQtyChange: (val: string) => void;
  onItemPriceChange: (val: string) => void;
}
export const ShiprocketItemFields: React.FC<ShiprocketItemFieldsProps> = React.memo(
  ({
    itemName,
    itemSku,
    itemQty,
    itemPrice,
    onItemNameChange,
    onItemSkuChange,
    onItemQtyChange,
    onItemPriceChange,
  }) => (
    <>
      <div className={styles.formSectionTitle}>
        <FiPackage /> Item Details
      </div>
      <div className={styles.formGrid4}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Item Name*</label>
          <input
            type="text"
            className={styles.fieldInput}
            placeholder="e.g. Handcrafted Cotton Dress"
            value={itemName}
            onChange={(e) => onItemNameChange(e.target.value)}
            required
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>SKU (Optional)</label>
          <input
            type="text"
            className={styles.fieldInput}
            placeholder="e.g. SKU-001"
            value={itemSku}
            onChange={(e) => onItemSkuChange(e.target.value)}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Quantity*</label>
          <input
            type="number"
            min="1"
            className={styles.fieldInput}
            value={itemQty}
            onChange={(e) => onItemQtyChange(e.target.value)}
            required
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Unit Price (₹)*</label>
          <input
            type="number"
            min="1"
            className={styles.fieldInput}
            value={itemPrice}
            onChange={(e) => onItemPriceChange(e.target.value)}
            required
          />
        </div>
      </div>
    </>
  )
);
ShiprocketItemFields.displayName = 'ShiprocketItemFields';
