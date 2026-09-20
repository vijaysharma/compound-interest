'use client';
import React from 'react';
import { FiSliders, FiX } from 'react-icons/fi';
import type { AdminUser } from './types';
import styles from '../../../views/Admin.module.scss';
export interface AdminLimitModalProps {
  limitModalUser: AdminUser;
  customLimitInput: number;
  busy: string | null;
  onClose: () => void;
  onCustomLimitChange: (val: number) => void;
  onUserAction: (
    userId: string,
    action: 'grant_access' | 'reset_usage' | 'reset_trial' | 'set_limit' | 'extend_trial_time',
    extra?: { free_limit?: number; hours?: number }
  ) => void;
}
export const AdminLimitModal: React.FC<AdminLimitModalProps> = React.memo(
  ({
    limitModalUser,
    customLimitInput,
    busy,
    onClose,
    onCustomLimitChange,
    onUserAction,
  }) => (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderTitle}>
            <FiSliders size={20} />
            <h3 className={styles.modalTitle}>Set Calculation Quota Limit</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`${styles.btnGhost} ${styles.btnIcon}`}
          >
            <FiX size={18} />
          </button>
        </div>
        <p className={styles.modalDesc}>
          Override total allowed free calculations for <strong>{limitModalUser.email}</strong>.
        </p>
        <div className={styles.mb1}>
          <label className={styles.label}>Quota Limit (Runs)</label>
          <input
            type="number"
            min="1"
            max="99999"
            value={customLimitInput}
            onChange={(e) => onCustomLimitChange(Number(e.target.value))}
            className={`${styles.input} ${styles.inputMono}`}
          />
          <div className={styles.presetGrid}>
            {[15, 25, 50, 100, 250, 1000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onCustomLimitChange(preset)}
                className={`${styles.presetBtn} ${customLimitInput === preset ? styles.presetActive : ''}`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button
            type="button"
            onClick={onClose}
            className={styles.btnOutline}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy === `user_${limitModalUser.id}`}
            onClick={() =>
              onUserAction(limitModalUser.id, 'set_limit', {
                free_limit: customLimitInput,
              })
            }
            className={styles.btnPrimarySm}
          >
            {busy === `user_${limitModalUser.id}` ? 'Saving...' : 'Save Quota'}
          </button>
        </div>
      </div>
    </div>
  )
);
AdminLimitModal.displayName = 'AdminLimitModal';
