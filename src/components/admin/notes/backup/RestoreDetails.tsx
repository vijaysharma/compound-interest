'use client';
import React from 'react';
import { FiFileText, FiFolder, FiCheck } from 'react-icons/fi';
import { BackupPayload } from './types';
import styles from '../NotesModal.module.scss';
interface RestoreDetailsProps {
  parsedBackup: BackupPayload;
  restoreMode: 'merge' | 'replace';
  setRestoreMode: (mode: 'merge' | 'replace') => void;
  isRestoring: boolean;
  onExecuteRestore: () => void;
  onClose: () => void;
}
export const RestoreDetails: React.FC<RestoreDetailsProps> = ({
  parsedBackup,
  restoreMode,
  setRestoreMode,
  isRestoring,
  onExecuteRestore,
  onClose,
}) => {
  return (
    <>
      <div className={styles.backupDetailsBox}>
        <div className={styles.backupDetailsHeader}>
          <span>Backup Details:</span>
          <span className={`${styles.badge} ${styles.badgeSuccess}`}>Valid Backup</span>
        </div>
        <div className={styles.backupDetailsGrid}>
          <div className={styles.detailsStat}>
            <FiFileText size={14} className={styles.primaryIcon} />
            <span>Total Notes: <b>{parsedBackup.note_count}</b></span>
          </div>
          <div className={styles.detailsStat}>
            <FiFolder size={14} className={styles.primaryIcon} />
            <span>Folders: <b>{parsedBackup.folders?.length || 1}</b></span>
          </div>
        </div>
        <div className={styles.restoreModeSection}>
          <label className={styles.restoreModeLabel}>
            Restore Mode:
          </label>
          <div className={styles.restoreModeButtons}>
            <button
              type="button"
              onClick={() => setRestoreMode('merge')}
              className={`${restoreMode === 'merge' ? styles.btnPrimary : styles.btnGhost} ${styles.flex1}`}
            >
              Merge (Recommended)
            </button>
            <button
              type="button"
              onClick={() => setRestoreMode('replace')}
              className={`${restoreMode === 'replace' ? `${styles.btnGhost} ${styles.btnDanger} ${styles.replaceBtnActive}` : `${styles.btnGhost} ${styles.replaceBtn}`}`}
            >
              Replace All
            </button>
          </div>
          <p className={styles.restoreModeDesc}>
            {restoreMode === 'merge'
              ? 'Combines backup notes with your current notes without deleting any.'
              : 'WARNING: Clears current database notes and replaces them entirely with this backup.'}
          </p>
        </div>
      </div>
      <div className={styles.modalFooterBorder}>
        <button
          type="button"
          onClick={onClose}
          className={styles.btnGhost}
        >
          Close
        </button>
        <button
          type="button"
          onClick={onExecuteRestore}
          disabled={isRestoring}
          className={styles.btnPrimary}
        >
          {isRestoring ? (
            <span className={styles.spinner} />
          ) : (
            <FiCheck size={14} />
          )}
          {isRestoring ? 'Restoring...' : 'Restore Notes Now'}
        </button>
      </div>
    </>
  );
};
