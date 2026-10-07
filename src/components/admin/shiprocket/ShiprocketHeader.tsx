'use client';
import React from 'react';
import { FiTruck, FiRefreshCw, FiPlus, FiServer } from 'react-icons/fi';
import type { ShiprocketAccountData, ShiprocketAccountProfile } from './types';
import styles from '../ShiprocketDashboard.module.scss';
export interface ShiprocketHeaderProps {
  account: ShiprocketAccountData | null;
  accountsList?: ShiprocketAccountProfile[];
  onSwitchAccount?: (id: string) => Promise<void>;
  loading: boolean;
  onRefreshAll: () => void;
  onNewShipment: () => void;
}
export const ShiprocketHeader: React.FC<ShiprocketHeaderProps> = React.memo(
  ({ account, accountsList = [], onSwitchAccount, loading, onRefreshAll, onNewShipment }) => {
    const profile = account?.profile;
    const activeAccountId = profile?.id || accountsList.find((a) => a.is_active)?.id || '';
    return (
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>
              <FiTruck className={styles.titleIcon} /> Shiprocket Manager
            </h1>
            {account?.user?.company_id && (
              <span className={styles.companyBadge}>Company #{account.user.company_id}</span>
            )}
          </div>
          <div className={styles.accountSelectContainer}>
            {accountsList.length > 0 && onSwitchAccount && (
              <div className={styles.accountSelectWrapper}>
                <FiServer size={14} className={styles.selectServerIcon} />
                <select
                  className={styles.accountSelect}
                  value={activeAccountId}
                  onChange={(e) => onSwitchAccount(e.target.value)}
                  disabled={loading}
                  aria-label="Switch Active Shiprocket API User Account"
                >
                  {accountsList.map((acc) => {
                    const bal =
                      acc.id === activeAccountId && account?.balance !== undefined
                        ? Number(account.balance)
                        : Number(acc.balance || 0);
                    const balStr = `₹${bal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    return (
                      <option key={acc.id} value={acc.id}>
                        {acc.account_label} ({acc.company_name}) — {balStr}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
            <div className={styles.headerActions}>
              <button
                className={styles.outlineBtn}
                onClick={onRefreshAll}
                disabled={loading}
                title="Refresh All Data"
              >
                <FiRefreshCw className={loading ? styles.spinner : ''} />
                <span className={styles.buttonLabelWeb}>Refresh</span>
              </button>
              <button
                className={styles.primaryBtn}
                onClick={onNewShipment}
                title="Add Order"
              >
                <FiPlus />
                <span className={styles.buttonLabelWeb}>Add Order</span>
              </button>
            </div>
          </div>
          <p className={styles.userSubtext}>
            <span>
              <strong>Company:</strong> {profile?.company_name || '—'}
            </span>
            {profile?.contact_name && (
              <span>
                <strong>Contact:</strong> {profile.contact_email}{' '}
                {profile.contact_phone ? `(${profile.contact_phone})` : ''}
              </span>
            )}
            <span>
              <strong>API User:</strong> {account?.user?.email || profile?.api_email || 'Default'}
            </span>
            {account?.pickupLocations?.[0] && (
              <span>
                <strong>Warehouse:</strong>
                &nbsp;{account.pickupLocations[0].pickup_location} (
                {account.pickupLocations[0].address} {account.pickupLocations[0].city},{' '}
                {account.pickupLocations[0].pin_code})
              </span>
            )}
          </p>
        </div>
      </div>
    );
  }
);
ShiprocketHeader.displayName = 'ShiprocketHeader';
