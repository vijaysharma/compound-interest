'use client';
import React from 'react';
import {
  FiCheckCircle,
  FiMapPin,
  FiUser,
  FiBriefcase,
  FiPhone,
  FiMail,
  FiKey,
  FiTrash2,
  FiToggleRight,
  FiServer,
} from 'react-icons/fi';
import type { ShiprocketAccountData, ShiprocketAccountProfile } from './types';
import styles from '../ShiprocketDashboard.module.scss';
export interface ShiprocketCompanyTabProps {
  account: ShiprocketAccountData | null;
  accountsList?: ShiprocketAccountProfile[];
  loadingAccount?: boolean;
  onSwitchAccount?: (id: string) => Promise<void>;
  onDeleteAccount?: (id: string) => Promise<void>;
}
export const ShiprocketCompanyTab: React.FC<ShiprocketCompanyTabProps> = React.memo(
  ({ account, accountsList = [], loadingAccount, onSwitchAccount, onDeleteAccount }) => {
    const profile = account?.profile;
    const isLoading = loadingAccount || !account;
    return (
      <div className={styles.companyStack}>
        {/* 1. Master Company & User Profile Details */}
        <div className={styles.formCard}>
          <div className={styles.formSectionTitle}>
            <FiBriefcase /> Primary Business & Owner Details
          </div>
          <div className={styles.formGrid4}>
            <div>
              <label className={styles.fieldLabel}>Company Name</label>
              <div className={styles.valueHighlight}>
                {isLoading ? (
                  <div className={`${styles.shimmer} ${styles.skeletonLine}`} />
                ) : (
                  profile?.company_name || '—'
                )}
              </div>
            </div>
            <div>
              <label className={styles.fieldLabel}>Contact / User Name</label>
              <div className={styles.valueHighlight}>
                {isLoading ? (
                  <div className={`${styles.shimmer} ${styles.skeletonLine}`} />
                ) : (
                  <>
                    <FiUser className={styles.inlineIcon} />
                    {profile?.contact_name || '—'}
                  </>
                )}
              </div>
            </div>
            <div>
              <label className={styles.fieldLabel}>Phone Number</label>
              <div className={styles.valueHighlight}>
                {isLoading ? (
                  <div className={`${styles.shimmer} ${styles.skeletonLine}`} />
                ) : (
                  <>
                    <FiPhone className={styles.inlineIcon} />
                    {profile?.contact_phone || '—'}
                  </>
                )}
              </div>
            </div>
            <div>
              <label className={styles.fieldLabel}>Contact Email</label>
              <div className={styles.valueHighlight}>
                {isLoading ? (
                  <div className={`${styles.shimmer} ${styles.skeletonLine}`} />
                ) : (
                  <>
                    <FiMail className={styles.inlineIcon} />
                    {profile?.contact_email || '—'}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* 2. Active Shiprocket API User & Auth Token Details */}
        <div className={styles.formCard}>
          <div className={styles.formSectionTitle}>
            <FiCheckCircle /> Shiprocket API User & Authentication Status
          </div>
          <div className={styles.formGrid4}>
            <div>
              <label className={styles.fieldLabel}>API User Name</label>
              <div className={styles.valueHighlight}>
                {isLoading ? (
                  <div className={`${styles.shimmer} ${styles.skeletonLine}`} />
                ) : (
                  `${account?.user?.first_name || profile?.sr_first_name || 'API'} ${account?.user?.last_name || profile?.sr_last_name || 'User'}`
                )}
              </div>
            </div>
            <div>
              <label className={styles.fieldLabel}>API User Email</label>
              <div className={styles.valueHighlight}>
                {isLoading ? (
                  <div className={`${styles.shimmer} ${styles.skeletonLine}`} />
                ) : (
                  account?.user?.email || profile?.api_email || '—'
                )}
              </div>
            </div>
            <div>
              <label className={styles.fieldLabel}>Shiprocket Company ID</label>
              <div className={styles.valueHighlight}>
                {isLoading ? (
                  <div className={`${styles.shimmer} ${styles.skeletonLine}`} />
                ) : (
                  `#${account?.user?.company_id || profile?.sr_company_id || '—'}`
                )}
              </div>
            </div>
            <div>
              <label className={styles.fieldLabel}>Token Storage</label>
              <div className={styles.valueHighlight}>
                {isLoading ? (
                  <div className={`${styles.shimmer} ${styles.skeletonLine}`} />
                ) : (
                  <span className={`${styles.statusBadge} ${styles.statusGreen}`}>
                    <FiKey className={styles.inlineIcon} />
                    Database Token
                  </span>
                )}
              </div>
            </div>
          </div>
          {!isLoading && profile?.token_expires_at && (
            <div className={styles.createdAtText}>
              DB Token Expires At: {new Date(profile.token_expires_at).toLocaleString()} (Auto-renews upon expiry)
            </div>
          )}
        </div>
        {/* 3. Multi-Account Management Section */}
        <div className={styles.formCard}>
          <div className={styles.accountCardHeader}>
            <div className={`${styles.formSectionTitle} ${styles.formSectionTitleFlush}`}>
              <FiServer /> Configured Shiprocket Accounts ({accountsList.length})
            </div>
          </div>
          {accountsList.length > 0 ? (
            <div className={styles.pickupsGrid}>
              {accountsList.map((acc) => (
                <div
                  key={acc.id}
                  className={`${styles.accountItemCard} ${acc.is_active ? styles.accountItemActive : ''}`}
                >
                  <div className={styles.pickupCardHeader}>
                    <strong className={styles.pickupTitle}>{acc.account_label}</strong>
                    {acc.is_active ? (
                      <span className={`${styles.statusBadge} ${styles.statusGreen}`}>Active Account</span>
                    ) : (
                      <span className={`${styles.statusBadge} ${styles.statusGray}`}>Inactive</span>
                    )}
                  </div>
                  <div className={styles.pickupDetails}>
                    <div>
                      <strong>Company:</strong> {acc.company_name}
                    </div>
                    {acc.contact_name && (
                      <div>
                        <strong>Contact:</strong> {acc.contact_name} {acc.contact_phone ? `(${acc.contact_phone})` : ''}
                      </div>
                    )}
                    <div>
                      <strong>API User:</strong> {acc.api_email}
                    </div>
                    <div>
                      <strong>Wallet Balance:</strong> ₹{Number(acc.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    {acc.sr_company_id && (
                      <div>
                        <strong>SR Company ID:</strong> #{acc.sr_company_id}
                      </div>
                    )}
                  </div>
                  <div className={styles.accountActionRow}>
                    {!acc.is_active && onSwitchAccount ? (
                      <button
                        type="button"
                        className={styles.activateBtnSmall}
                        onClick={() => onSwitchAccount(acc.id)}
                      >
                        <FiToggleRight /> Set Active
                      </button>
                    ) : (
                      <span className={styles.activeAccountText}>
                        Currently in use
                      </span>
                    )}
                    {onDeleteAccount && (
                      <button
                        type="button"
                        className={styles.dangerBtnSmall}
                        onClick={() => {
                          if (confirm(`Remove account '${acc.account_label}'?`)) {
                            onDeleteAccount(acc.id);
                          }
                        }}
                      >
                        <FiTrash2 /> Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyText}>
              No accounts configured in database. Please click &ldquo;Add Account&rdquo; in Accounts Manager to set up Shiprocket API access.
            </p>
          )}
        </div>
        {/* 4. Registered Pickup Locations */}
        <div className={styles.formCard}>
          <div className={styles.formSectionTitle}>
            <FiMapPin /> Registered Pickup Locations & Warehouses ({account?.pickupLocations?.length || 0})
          </div>
          {isLoading ? (
            <div className={styles.pickupsGrid}>
              {[1, 2].map((i) => (
                <div key={i} className={`${styles.skeletonCard} ${styles.shimmer}`}>
                  <div className={`${styles.shimmer} ${styles.skeletonLine}`} style={{ width: '40%' }} />
                  <div className={`${styles.shimmer} ${styles.skeletonLine}`} style={{ width: '80%' }} />
                  <div className={`${styles.shimmer} ${styles.skeletonLine}`} style={{ width: '60%' }} />
                </div>
              ))}
            </div>
          ) : account?.pickupLocations && account.pickupLocations.length > 0 ? (
            <div className={styles.pickupsGrid}>
              {account.pickupLocations.map((loc) => (
                <div key={loc.id} className={styles.pickupCard}>
                  <div className={styles.pickupCardHeader}>
                    <strong className={styles.pickupTitle}>{loc.pickup_location}</strong>
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
            <p className={styles.emptyText}>No pickup locations configured for active account.</p>
          )}
        </div>
      </div>
    );
  }
);
ShiprocketCompanyTab.displayName = 'ShiprocketCompanyTab';
