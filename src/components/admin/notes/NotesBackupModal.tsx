'use client';
import React, { useState } from 'react';
import { FiX, FiUploadCloud, FiShield, FiAlertCircle, FiCheck } from 'react-icons/fi';
import { BsCloudArrowUp, BsCloudArrowDown } from 'react-icons/bs';
import { useScrollLock } from '../../../utilities/useScrollLock';
import styles from './NotesModal.module.scss';
import { NotesBackupModalProps, BackupPayload } from './backup/types';
import { BackupTab } from './backup/BackupTab';
import { RestoreDropzone } from './backup/RestoreDropzone';
import { RestoreDetails } from './backup/RestoreDetails';
import { useRestoreNotes } from './backup/useRestoreNotes';
export const NotesBackupModal: React.FC<NotesBackupModalProps> = ({
  isOpen,
  notes,
  folders,
  token,
  userId = 'default',
  userEmail = '',
  onClose,
  onRestoreSuccess,
}) => {
  useScrollLock(isOpen);
  const [activeTab, setActiveTab] = useState<'backup' | 'restore'>('backup');
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [parsedBackup, setParsedBackup] = useState<BackupPayload | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const { isRestoring, executeRestore } = useRestoreNotes({
    token,
    userId,
    userEmail,
    parsedBackup,
    restoreMode,
    onRestoreSuccess,
    onClose,
    setError,
    setSuccessMsg,
  });
  if (!isOpen) return null;
  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modalBox} ${styles.modalBoxLg} ${styles.noSelect}`}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={`${styles.modalIconBox} ${styles.backupIconBox}`}>
              <FiUploadCloud size={16} />
            </div>
            <div>
              <div className={styles.titleWithBadge}>
                <h3 className={styles.modalTitle}>Backup &amp; Restore</h3>
                <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                  <FiShield size={10} /> E2EE
                </span>
              </div>
              <p className={styles.modalSubtitle}>Google Drive · OneDrive · Local Storage</p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <FiX size={16} />
          </button>
        </div>
        <div className={styles.tabsRow}>
          <button
            onClick={() => {
              setActiveTab('backup');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`${styles.tabItem} ${activeTab === 'backup' ? styles.tabItemActive : ''}`}
          >
            <BsCloudArrowUp size={16} />
            Backup / Dump
          </button>
          <button
            onClick={() => {
              setActiveTab('restore');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`${styles.tabItem} ${activeTab === 'restore' ? styles.tabItemActive : ''}`}
          >
            <BsCloudArrowDown size={16} />
            Restore
          </button>
        </div>
        <div className={styles.alertPadding}>
          {error && (
            <div className={styles.alertError}>
              <FiAlertCircle size={16} className={styles.flexShrink0} />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className={styles.alertSuccess}>
              <FiCheck size={16} className={styles.flexShrink0} />
              <span>{successMsg}</span>
            </div>
          )}
        </div>
        {activeTab === 'backup' && (
          <BackupTab
            notes={notes}
            folders={folders}
            setError={setError}
            setSuccessMsg={setSuccessMsg}
          />
        )}
        {activeTab === 'restore' && (
          <div className={styles.tabContent}>
            <RestoreDropzone
              fileName={fileName}
              setFileName={setFileName}
              setParsedBackup={setParsedBackup}
              setError={setError}
              setSuccessMsg={setSuccessMsg}
            />
            {parsedBackup ? (
              <RestoreDetails
                parsedBackup={parsedBackup}
                restoreMode={restoreMode}
                setRestoreMode={setRestoreMode}
                isRestoring={isRestoring}
                onExecuteRestore={executeRestore}
                onClose={onClose}
              />
            ) : (
              <div className={styles.modalFooterBorder}>
                <button type="button" onClick={onClose} className={styles.btnGhost}>
                  Close
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
