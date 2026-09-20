'use client';
import React from 'react';
import styles from '../ShiprocketDashboard.module.scss';
export interface ShiprocketAddressFieldsProps {
  custAddress: string;
  custAddress2: string;
  custPincode: string;
  custCity: string;
  custState: string;
  pincodeLoading: boolean;
  onCustAddressChange: (val: string) => void;
  onCustAddress2Change: (val: string) => void;
  onCustPincodeChange: (val: string) => void;
  onCustCityChange: (val: string) => void;
  onCustStateChange: (val: string) => void;
}
export const ShiprocketAddressFields: React.FC<ShiprocketAddressFieldsProps> = React.memo(
  ({
    custAddress,
    custAddress2,
    custPincode,
    custCity,
    custState,
    pincodeLoading,
    onCustAddressChange,
    onCustAddress2Change,
    onCustPincodeChange,
    onCustCityChange,
    onCustStateChange,
  }) => (
    <>
      <div className={styles.formGrid2}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Delivery Address Line 1*</label>
          <input
            type="text"
            className={styles.fieldInput}
            placeholder="House/Flat, Street, Locality"
            value={custAddress}
            onChange={(e) => onCustAddressChange(e.target.value)}
            required
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Address Line 2 (Optional)</label>
          <input
            type="text"
            className={styles.fieldInput}
            placeholder="Landmark, Area"
            value={custAddress2}
            onChange={(e) => onCustAddress2Change(e.target.value)}
          />
        </div>
      </div>
      <div className={styles.formGrid3}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            Destination Pincode* {pincodeLoading && '(Looking up...)'}
          </label>
          <input
            type="text"
            maxLength={6}
            className={styles.fieldInput}
            placeholder="e.g. 560001"
            value={custPincode}
            onChange={(e) => onCustPincodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>City*</label>
          <input
            type="text"
            className={styles.fieldInput}
            placeholder="e.g. Bengaluru"
            value={custCity}
            onChange={(e) => onCustCityChange(e.target.value)}
            required
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>State*</label>
          <input
            type="text"
            className={styles.fieldInput}
            placeholder="e.g. Karnataka"
            value={custState}
            onChange={(e) => onCustStateChange(e.target.value)}
            required
          />
        </div>
      </div>
    </>
  )
);
ShiprocketAddressFields.displayName = 'ShiprocketAddressFields';
