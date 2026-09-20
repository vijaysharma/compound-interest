'use client';
import React from 'react';
import { FiMapPin } from 'react-icons/fi';
import type { ShiprocketAccountData } from './types';
import { ShiprocketAddressFields } from './ShiprocketAddressFields';
import styles from '../ShiprocketDashboard.module.scss';
export interface ShiprocketCreateCustomerProps {
  account: ShiprocketAccountData | null;
  pickupLoc: string;
  paymentMode: 'Prepaid' | 'COD';
  custName: string;
  custPhone: string;
  custEmail: string;
  custAddress: string;
  custAddress2: string;
  custPincode: string;
  custCity: string;
  custState: string;
  pincodeLoading: boolean;
  onPickupLocChange: (val: string) => void;
  onPaymentModeChange: (val: 'Prepaid' | 'COD') => void;
  onCustNameChange: (val: string) => void;
  onCustPhoneChange: (val: string) => void;
  onCustEmailChange: (val: string) => void;
  onCustAddressChange: (val: string) => void;
  onCustAddress2Change: (val: string) => void;
  onCustPincodeChange: (val: string) => void;
  onCustCityChange: (val: string) => void;
  onCustStateChange: (val: string) => void;
}
export const ShiprocketCreateCustomerSection: React.FC<ShiprocketCreateCustomerProps> = React.memo(
  ({
    account,
    pickupLoc,
    paymentMode,
    custName,
    custPhone,
    custEmail,
    onPickupLocChange,
    onPaymentModeChange,
    onCustNameChange,
    onCustPhoneChange,
    onCustEmailChange,
    ...addressProps
  }) => (
    <>
      <div className={styles.formSectionTitle}>
        <FiMapPin /> Pickup & Warehouse
      </div>
      <div className={styles.formGrid2}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Pickup Warehouse Location*</label>
          <select
            className={styles.selectInput}
            value={pickupLoc}
            onChange={(e) => onPickupLocChange(e.target.value)}
            required
          >
            {account?.pickupLocations.map((loc) => (
              <option key={loc.id} value={loc.pickup_location}>
                {loc.pickup_location} ({loc.city}, {loc.pin_code})
              </option>
            ))}
          </select>
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Payment Method*</label>
          <select
            className={styles.selectInput}
            value={paymentMode}
            onChange={(e) => onPaymentModeChange(e.target.value as 'Prepaid' | 'COD')}
          >
            <option value="Prepaid">Prepaid</option>
            <option value="COD">Cash on Delivery (COD)</option>
          </select>
        </div>
      </div>
      <div className={styles.formSectionTitle}>
        <FiMapPin /> Delivery Customer Details
      </div>
      <div className={styles.formGrid3}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Customer Full Name*</label>
          <input
            type="text"
            className={styles.fieldInput}
            placeholder="e.g. Ramesh Kumar"
            value={custName}
            onChange={(e) => onCustNameChange(e.target.value)}
            required
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Customer Phone Number*</label>
          <input
            type="tel"
            maxLength={10}
            className={styles.fieldInput}
            placeholder="10-digit mobile number"
            value={custPhone}
            onChange={(e) => onCustPhoneChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
            required
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Email Address</label>
          <input
            type="email"
            className={styles.fieldInput}
            placeholder="e.g. customer@example.com"
            value={custEmail}
            onChange={(e) => onCustEmailChange(e.target.value)}
          />
        </div>
      </div>
      <ShiprocketAddressFields {...addressProps} />
    </>
  )
);
ShiprocketCreateCustomerSection.displayName = 'ShiprocketCreateCustomerSection';
