'use client';
import React from 'react';
import { FiPackage, FiPlus, FiTrash2, FiPercent, FiTruck } from 'react-icons/fi';
import styles from '../ShiprocketDashboard.module.scss';

export interface OrderItemEntry {
  name: string;
  sku: string;
  units: string;
  selling_price: string;
}

export interface ShiprocketItemFieldsProps {
  items: OrderItemEntry[];
  shippingCharges: string;
  discount: string;
  onShippingChargesChange: (val: string) => void;
  onDiscountChange: (val: string) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onItemChange: (index: number, field: 'name' | 'sku' | 'units' | 'selling_price', val: string) => void;
}

export const ShiprocketItemFields: React.FC<ShiprocketItemFieldsProps> = React.memo(
  ({
    items,
    shippingCharges,
    discount,
    onShippingChargesChange,
    onDiscountChange,
    onAddItem,
    onRemoveItem,
    onItemChange,
  }) => {
    const itemsTotal = items.reduce(
      (acc, it) => acc + (parseFloat(it.selling_price) || 0) * (parseInt(it.units, 10) || 0),
      0
    );
    const shipping = parseFloat(shippingCharges) || 0;
    const disc = parseFloat(discount) || 0;
    const netTotal = Math.max(0, itemsTotal + shipping - disc);

    return (
      <>
        <div className={styles.sectionHeaderRow}>
          <div className={styles.formSectionTitle}>
            <FiPackage /> Order Items ({items.length})
          </div>
          <button
            type="button"
            className={styles.outlineBtn}
            onClick={onAddItem}
            title="Add another item"
          >
            <FiPlus /> Add Item
          </button>
        </div>

        {items.map((it, idx) => (
          <div
            key={idx}
            style={{
              padding: '0.85rem',
              marginBottom: '0.75rem',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm, 6px)',
              background: 'var(--color-bg)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem',
              }}
            >
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-heading)' }}>
                Item #{idx + 1}
              </span>
              {items.length > 1 && (
                <button
                  type="button"
                  className={styles.dangerBtnSmall}
                  onClick={() => onRemoveItem(idx)}
                  title="Remove this item"
                >
                  <FiTrash2 /> Remove
                </button>
              )}
            </div>
            <div className={styles.formGrid4}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Item Name*</label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  placeholder="e.g. Handcrafted Cotton Dress"
                  value={it.name}
                  onChange={(e) => onItemChange(idx, 'name', e.target.value)}
                  required
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>SKU (Optional)</label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  placeholder="e.g. SKU-001"
                  value={it.sku}
                  onChange={(e) => onItemChange(idx, 'sku', e.target.value)}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Quantity*</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className={styles.fieldInput}
                  value={it.units}
                  onChange={(e) => onItemChange(idx, 'units', e.target.value)}
                  required
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Unit Price (₹)*</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={styles.fieldInput}
                  value={it.selling_price}
                  onChange={(e) => onItemChange(idx, 'selling_price', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        ))}

        <div className={styles.formSectionTitle}>
          <FiTruck /> Shipping Charges & Discount
        </div>
        <div className={styles.formGrid2}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Shipping Charges (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={styles.fieldInput}
              placeholder="0.00"
              value={shippingCharges}
              onChange={(e) => onShippingChargesChange(e.target.value)}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Discount (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={styles.fieldInput}
              placeholder="0.00"
              value={discount}
              onChange={(e) => onDiscountChange(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.volumetricCallout}>
          <div>
            <strong>Items Total:</strong> ₹{itemsTotal.toFixed(2)}
          </div>
          <div>
            <strong>Shipping:</strong> +₹{shipping.toFixed(2)}
          </div>
          <div>
            <strong>Discount:</strong> -₹{disc.toFixed(2)}
          </div>
          <div>
            <strong>Net Order Value:</strong> ₹{netTotal.toFixed(2)}
          </div>
        </div>
      </>
    );
  }
);
ShiprocketItemFields.displayName = 'ShiprocketItemFields';

