'use client';
import React from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import type { AdminUser } from './types';
import { AdminUserRow } from './AdminUserRow';
import { AdminLimitModal } from './AdminLimitModal';
import styles from '../../../views/Admin.module.scss';
export interface AdminUsersTabProps {
  usersList: AdminUser[];
  now: number;
  busy: string | null;
  limitModalUser: AdminUser | null;
  customLimitInput: number;
  onRefresh: () => void;
  onOpenLimitModal: (user: AdminUser) => void;
  onCloseLimitModal: () => void;
  onCustomLimitChange: (val: number) => void;
  onUserAction: (
    userId: string,
    action: 'grant_access' | 'reset_usage' | 'reset_trial' | 'set_limit' | 'extend_trial_time',
    extra?: { free_limit?: number; hours?: number }
  ) => void;
}
export const AdminUsersTab: React.FC<AdminUsersTabProps> = React.memo(
  ({
    usersList,
    now,
    busy,
    limitModalUser,
    customLimitInput,
    onRefresh,
    onOpenLimitModal,
    onCloseLimitModal,
    onCustomLimitChange,
    onUserAction,
  }) => (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.sectionTitle}>User Management &amp; Quotas</h2>
          <p className={styles.subtitle}>
            Track user calculation usage, 48-hour first-usage trial windows, and grant access or
            quota overrides.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className={styles.btnOutline}
        >
          <FiRefreshCw />
          <span>Refresh</span>
        </button>
      </div>
      {usersList.length === 0 ? (
        <p className={styles.emptyPlaceholder}>
          No registered users found.
        </p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Quota (MF &amp; PPP)</th>
                <th>48h Trial (From 1st Use)</th>
                <th>Subscription</th>
                <th>Expires At</th>
                <th className={styles.tableRight}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u) => (
                <AdminUserRow
                  key={u.id}
                  user={u}
                  now={now}
                  busy={busy}
                  onOpenLimitModal={onOpenLimitModal}
                  onUserAction={onUserAction}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
      {limitModalUser && (
        <AdminLimitModal
          limitModalUser={limitModalUser}
          customLimitInput={customLimitInput}
          busy={busy}
          onClose={onCloseLimitModal}
          onCustomLimitChange={onCustomLimitChange}
          onUserAction={onUserAction}
        />
      )}
    </section>
  )
);
AdminUsersTab.displayName = 'AdminUsersTab';
