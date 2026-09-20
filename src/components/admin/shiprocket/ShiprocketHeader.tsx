'use client';
import React from 'react';
import { FiTruck, FiRefreshCw, FiPlus } from 'react-icons/fi';
import type { ShiprocketAccountData } from './types';
import styles from '../ShiprocketDashboard.module.scss';
export interface ShiprocketHeaderProps {
  account: ShiprocketAccountData | null;
  loading: boolean;
  onRefreshAll: () => void;
  onNewShipment: () => void;
}
export const ShiprocketHeader: React.FC<ShiprocketHeaderProps> = React.memo(
  ({ account, loading, onRefreshAll, onNewShipment }) => (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>
            <FiTruck className={styles.titleIcon} /> Shiprocket Manager
          </h1>
          {account?.user?.company_id && (
            <span className={styles.companyBadge}>
              Company #{account.user.company_id}
            </span>
          )}
        </div>
        <p className={styles.userSubtext}>
          <span>
            <strong>User:</strong> {account?.user?.first_name || 'API'} {account?.user?.last_name || 'User'} ({account?.user?.email || 'Registered'})
          </span>
          {account?.pickupLocations?.[0] && (
            <span>
              • <strong>Warehouse:</strong> {account.pickupLocations[0].pickup_location} ({account.pickupLocations[0].city}, {account.pickupLocations[0].pin_code})
            </span>
          )}
        </p>
      </div>
      <div className={styles.headerActions}>
        <button
          className={styles.outlineBtn}
          onClick={onRefreshAll}
          disabled={loading}
          title="Refresh All Data"
        >
          <FiRefreshCw className={loading ? styles.spinner : ''} /> Refresh
        </button>
        <button
          className={styles.primaryBtn}
          onClick={onNewShipment}
        >
          <FiPlus /> New Shipment
        </button>
      </div>
    </div>
  )
);
ShiprocketHeader.displayName = 'ShiprocketHeader';
