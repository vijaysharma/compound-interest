'use client';
import React from 'react';
import { FiCheckCircle, FiMapPin } from 'react-icons/fi';
import type { ShiprocketAccountData } from './types';
import styles from '../ShiprocketDashboard.module.scss';
export interface ShiprocketCompanyTabProps {
  account: ShiprocketAccountData | null;
}
export const ShiprocketCompanyTab: React.FC<ShiprocketCompanyTabProps> = React.memo(({ account }) => (
  <div className={styles.companyStack}>
    <div className={styles.formCard}>
      <div className={styles.formSectionTitle}>
        <FiCheckCircle /> Shiprocket Account Credentials & User
      </div>
      <div className={styles.formGrid3}>
        <div>
          <label className={styles.fieldLabel}>User Name</label>
          <div className={styles.valueHighlight}>
            {account?.user?.first_name || 'API'} {account?.user?.last_name || 'USER'}
          </div>
        </div>
        <div>
          <label className={styles.fieldLabel}>Registered Email</label>
          <div className={styles.valueHighlight}>
            {account?.user?.email || 'N/A'}
          </div>
        </div>
        <div>
          <label className={styles.fieldLabel}>Company ID</label>
          <div className={styles.valueHighlight}>
            #{account?.user?.company_id || 'N/A'}
          </div>
        </div>
      </div>
      {account?.user?.created_at && (
        <div className={styles.createdAtText}>
          Account created on: {new Date(account.user.created_at).toLocaleString()}
        </div>
      )}
    </div>
    <div className={styles.formCard}>
      <div className={styles.formSectionTitle}>
        <FiMapPin /> Registered Pickup Locations & Warehouses ({account?.pickupLocations.length || 0})
      </div>
      {account?.pickupLocations && account.pickupLocations.length > 0 ? (
        <div className={styles.pickupsGrid}>
          {account.pickupLocations.map((loc) => (
            <div key={loc.id} className={styles.pickupCard}>
              <div className={styles.pickupCardHeader}>
                <strong className={styles.pickupTitle}>
                  {loc.pickup_location}
                </strong>
                <span className={`${styles.statusBadge} ${styles.statusGreen}`}>Active</span>
              </div>
              <div className={styles.pickupDetails}>
                <div>{loc.address}</div>
                {loc.address_2 && <div>{loc.address_2}</div>}
                <div>
                  {loc.city}, {loc.state} - {loc.pin_code}
                </div>
                <div className={styles.pickupContact}>
                  <strong>Contact:</strong> {loc.name} ({loc.phone})
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.emptyText}>
          No pickup locations configured.
        </p>
      )}
    </div>
  </div>
));
ShiprocketCompanyTab.displayName = 'ShiprocketCompanyTab';
