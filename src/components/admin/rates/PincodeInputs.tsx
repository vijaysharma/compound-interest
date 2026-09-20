'use client';
import React from 'react';
import { FiMapPin } from 'react-icons/fi';
import type { PincodeInfo } from './types';
import styles from '../ShiprocketRates.module.scss';
export interface PincodeInputsProps {
  pickup: string;
  delivery: string;
  pickupLocation: PincodeInfo | null;
  pickupLoading: boolean;
  deliveryLocation: PincodeInfo | null;
  deliveryLoading: boolean;
  onPickupChange: (val: string) => void;
  onDeliveryChange: (val: string) => void;
  onPickupLoadingChange: (loading: boolean) => void;
  onDeliveryLoadingChange: (loading: boolean) => void;
  onPickupLocationClear: () => void;
  onDeliveryLocationClear: () => void;
}
export const PincodeInputs: React.FC<PincodeInputsProps> = React.memo(
  ({
    pickup,
    delivery,
    pickupLocation,
    pickupLoading,
    deliveryLocation,
    deliveryLoading,
    onPickupChange,
    onDeliveryChange,
    onPickupLoadingChange,
    onDeliveryLoadingChange,
    onPickupLocationClear,
    onDeliveryLocationClear,
  }) => (
    <div className={styles.pincodeGrid}>
      <div className={styles.pincodeCol}>
        <label className={styles.label}>
          Pickup Pincode*
        </label>
        <input
          type="text"
          className={styles.input}
          value={pickup}
          maxLength={6}
          placeholder="e.g. 700157"
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
            onPickupChange(val);
            if (val.length !== 6) {
              onPickupLocationClear();
              onPickupLoadingChange(false);
            } else {
              onPickupLoadingChange(true);
            }
          }}
        />
        <div className={styles.statusContainer}>
          {pickupLoading && (
            <span className={styles.statusLoading}>
              <span className={styles.spinnerSmall} />
              Looking up location...
            </span>
          )}
          {!pickupLoading && pickupLocation && (
            <span
              className={styles.statusSuccess}
              title={pickupLocation.tooltip || pickupLocation.display}
            >
              <FiMapPin className={styles.locationIcon} />
              <span>{pickupLocation.display}</span>
            </span>
          )}
          {!pickupLoading && !pickupLocation && pickup.length === 6 && (
            <span className={styles.statusError}>Location not found</span>
          )}
        </div>
      </div>
      <div className={styles.pincodeCol}>
        <label className={styles.label}>
          Delivery Pincode*
        </label>
        <input
          type="text"
          className={styles.input}
          value={delivery}
          maxLength={6}
          placeholder="e.g. 560083"
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
            onDeliveryChange(val);
            if (val.length !== 6) {
              onDeliveryLocationClear();
              onDeliveryLoadingChange(false);
            } else {
              onDeliveryLoadingChange(true);
            }
          }}
        />
        <div className={styles.statusContainer}>
          {deliveryLoading && (
            <span className={styles.statusLoading}>
              <span className={styles.spinnerSmall} />
              Looking up location...
            </span>
          )}
          {!deliveryLoading && deliveryLocation && (
            <span
              className={styles.statusSuccess}
              title={deliveryLocation.tooltip || deliveryLocation.display}
            >
              <FiMapPin className={styles.locationIcon} />
              <span>{deliveryLocation.display}</span>
            </span>
          )}
          {!deliveryLoading && !deliveryLocation && delivery.length === 6 && (
            <span className={styles.statusError}>Location not found</span>
          )}
        </div>
      </div>
    </div>
  )
);
PincodeInputs.displayName = 'PincodeInputs';
