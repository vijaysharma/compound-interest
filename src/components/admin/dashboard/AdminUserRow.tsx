'use client';
import React from 'react';
import { FiEdit2, FiRotateCcw, FiClock, FiPlus } from 'react-icons/fi';
import type { AdminUser } from './types';
import styles from '../../../views/Admin.module.scss';
export interface AdminUserRowProps {
  user: AdminUser;
  now: number;
  busy: string | null;
  onOpenLimitModal: (user: AdminUser) => void;
  onUserAction: (
    userId: string,
    action: 'grant_access' | 'reset_usage' | 'reset_trial' | 'set_limit' | 'extend_trial_time',
    extra?: { free_limit?: number; hours?: number }
  ) => void;
}
export const AdminUserRow: React.FC<AdminUserRowProps> = React.memo(
  ({ user, now, busy, onOpenLimitModal, onUserAction }) => {
    const limit = user.free_limit || 15;
    const isOverLimit = user.api_usage_count >= limit;
    let trialBadge = (
      <span className={`${styles.badge} ${styles.badgeGhost}`}>Not Started</span>
    );
    if (user.trial_expires_at) {
      const diff = new Date(user.trial_expires_at).getTime() - now;
      if (diff <= 0) {
        trialBadge = (
          <span className={`${styles.badge} ${styles.badgeError}`}>Expired</span>
        );
      } else {
        const hrs = Math.floor(diff / (1000 * 60 * 60));
        trialBadge = (
          <span className={`${styles.badge} ${styles.badgeInfo}`}>
            Active ({hrs}h left)
          </span>
        );
      }
    }
    return (
      <tr>
        <td className={styles.cellUserEmail}>{user.email}</td>
        <td>
          <span
            className={`${styles.badge} ${user.role === 'admin' ? styles.badgeAccent : styles.badgeGhost}`}
          >
            {user.role}
          </span>
        </td>
        <td>
          <div className={styles.quotaWrapper}>
            <span
              className={`${styles.quotaText} ${isOverLimit && user.role !== 'admin' ? styles.quotaOverLimit : ''}`}
            >
              {user.api_usage_count} / {limit}
            </span>
            <button
              type="button"
              onClick={() => onOpenLimitModal(user)}
              className={`${styles.btnGhost} ${styles.btnIcon}`}
              title="Edit calculation quota limit"
            >
              <FiEdit2 />
            </button>
          </div>
        </td>
        <td>{trialBadge}</td>
        <td>
          <span
            className={`${styles.badge} ${
              user.subscription_status === 'active'
                ? styles.badgeSuccess
                : isOverLimit
                  ? styles.badgeError
                  : styles.badgeInfo
            }`}
          >
            {user.subscription_status}
          </span>
        </td>
        <td className={styles.cellDate}>
          {user.subscription_expires_at
            ? new Date(user.subscription_expires_at).toLocaleDateString()
            : '—'}
        </td>
        <td className={styles.tableRight}>
          <div className={styles.actionsGroup}>
            <button
              type="button"
              disabled={busy === `user_${user.id}`}
              onClick={() => onUserAction(user.id, 'reset_trial')}
              className={`${styles.btnGhost} ${styles.btnWarning}`}
              title="Reset trial to 0 runs and fresh 48h from next usage"
            >
              <FiRotateCcw />
              <span>Reset Trial</span>
            </button>
            <button
              type="button"
              disabled={busy === `user_${user.id}`}
              onClick={() => onUserAction(user.id, 'extend_trial_time', { hours: 48 })}
              className={styles.btnOutline}
              title="Extend trial time by +48 hours"
            >
              <FiClock />
              <span>+48h</span>
            </button>
            <button
              type="button"
              disabled={busy === `user_${user.id}`}
              onClick={() => onUserAction(user.id, 'grant_access')}
              className={styles.btnOutline}
              title="Grant 30 Days Pro Access"
            >
              <FiPlus />
              <span>+30d Pro</span>
            </button>
          </div>
        </td>
      </tr>
    );
  }
);
AdminUserRow.displayName = 'AdminUserRow';
