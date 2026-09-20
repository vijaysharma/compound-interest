'use client';
import React, { useState } from 'react';
import { FiLock, FiX } from 'react-icons/fi';
import { useScrollLock } from '../../../utilities/useScrollLock';
import styles from './NotesModal.module.scss';
import { NotesUnlockForm } from './lock/NotesUnlockForm';
import { NotesSetPasswordForm } from './lock/NotesSetPasswordForm';
interface NotesLockModalProps {
  isOpen: boolean;
  isLocked: boolean;
  hasPasswordHash: boolean;
  expectedHash?: string;
  onClose: () => void;
  onSetPassword: (hash: string) => void;
  onRemoveLock: () => void;
  onUnlockSuccess: () => void;
}
export const NotesLockModal: React.FC<NotesLockModalProps> = ({
  isOpen,
  isLocked,
  hasPasswordHash,
  expectedHash,
  onClose,
  onSetPassword,
  onRemoveLock,
  onUnlockSuccess,
}) => {
  useScrollLock(isOpen);
  const [error, setError] = useState<string | null>(null);
  if (!isOpen) return null;
  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modalBox} ${styles.modalBoxSm}`}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalIconBox}>
              <FiLock size={16} />
            </div>
            <h3 className={styles.modalTitle}>
              {isLocked ? 'Note Password' : 'Lock Note'}
            </h3>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <FiX size={16} />
          </button>
        </div>
        <div className={styles.modalBody}>
          {error && (
            <div className={styles.alertError}>
              <span>{error}</span>
            </div>
          )}
          {hasPasswordHash ? (
            <NotesUnlockForm
              expectedHash={expectedHash}
              onClose={onClose}
              onRemoveLock={onRemoveLock}
              onUnlockSuccess={onUnlockSuccess}
              setError={setError}
            />
          ) : (
            <NotesSetPasswordForm
              onClose={onClose}
              onSetPassword={onSetPassword}
              setError={setError}
            />
          )}
        </div>
      </div>
    </div>
  );
};
