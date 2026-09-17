'use client';
import React, { useState, useRef } from 'react';
import {
  FiX,
  FiDownload,
  FiUploadCloud,
  FiShare2,
  FiCheck,
  FiAlertCircle,
  FiExternalLink,
  FiFileText,
  FiFolder,
  FiShield,
} from 'react-icons/fi';
import { SiGoogledrive } from 'react-icons/si';
import { BsCloudArrowUp, BsCloudArrowDown } from 'react-icons/bs';
import { Note } from './NotesTypes';
import { getUserEncryptionKey, encryptText } from './NotesCrypto';
import { sanitizeNoteHtml, sanitizePlainInput } from './sanitizeHtml';
import { restoreNotesBackupAction } from '@/actions/notes';
import { useScrollLock } from '../../../utilities/useScrollLock';
import styles from './NotesModal.module.scss';
interface NotesBackupModalProps {
  isOpen: boolean;
  notes: Note[];
  folders: string[];
  token: string;
  userId?: string;
  userEmail?: string;
  onClose: () => void;
  onRestoreSuccess: (restoredNotes: Note[], customFolders: string[]) => void;
}
interface BackupPayload {
  app: string;
  version: number;
  exported_at: string;
  note_count: number;
  folders: string[];
  notes: Note[];
}
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
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  if (!isOpen) return null;
  const totalActiveNotes = notes.filter((n) => !n.is_trashed).length;
  const generateBackupData = (): BackupPayload => {
    return {
      app: 'Quick Notes',
      version: 2,
      exported_at: new Date().toISOString(),
      note_count: notes.length,
      folders,
      notes,
    };
  };
  const getBackupBlob = (): { blob: Blob; fileName: string } => {
    const data = generateBackupData();
    const jsonStr = JSON.stringify(data, null, 2);
    const dateStr = new Date().toISOString().split('T')[0];
    const name = `quick-notes-backup-${dateStr}.json`;
    const blob = new Blob([jsonStr], { type: 'application/json' });
    return { blob, fileName: name };
  };
  const downloadFile = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleDumpToGoogleDrive = async () => {
    setError(null);
    const { blob, fileName: name } = getBackupBlob();
    const file = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: 'Quick Notes Backup',
          text: 'Backup of Quick Notes for Google Drive',
          files: [file],
        });
        setSuccessMsg('Backup shared! Choose Google Drive in the share sheet.');
        return;
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }
    downloadFile(blob, name);
    window.open('https://drive.google.com/drive/my-drive', '_blank', 'noopener,noreferrer');
    setSuccessMsg('Backup downloaded! Opening Google Drive where you can upload it.');
  };
  const handleDumpToOneDrive = async () => {
    setError(null);
    const { blob, fileName: name } = getBackupBlob();
    const file = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: 'Quick Notes Backup',
          text: 'Backup of Quick Notes for OneDrive',
          files: [file],
        });
        setSuccessMsg('Backup shared! Choose OneDrive in the share sheet.');
        return;
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }
    downloadFile(blob, name);
    window.open('https://onedrive.live.com', '_blank', 'noopener,noreferrer');
    setSuccessMsg('Backup downloaded! Opening OneDrive where you can upload it.');
  };
  const handleDownloadBackup = () => {
    const { blob, fileName: name } = getBackupBlob();
    downloadFile(blob, name);
    setSuccessMsg(`Backup saved as ${name}`);
  };
  const handleNativeShare = async () => {
    setError(null);
    const { blob, fileName: name } = getBackupBlob();
    const file = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: 'Quick Notes Backup',
          text: 'Full Quick Notes Backup',
          files: [file],
        });
        setSuccessMsg('Backup shared successfully!');
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return;
        setError('Share canceled or not supported');
      }
    } else {
      handleDownloadBackup();
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccessMsg(null);
    setParsedBackup(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setError('Backup file exceeds maximum allowed size of 20MB.');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed || (!Array.isArray(parsed.notes) && !Array.isArray(parsed))) {
          setError('Invalid backup file: notes array not found.');
          return;
        }
        const rawNotesList: Note[] = Array.isArray(parsed.notes) ? parsed.notes : parsed;
        const rawFoldersList: string[] = Array.isArray(parsed.folders) ? parsed.folders : ['Notes'];
        const notesList: Note[] = rawNotesList.map((n) => ({
          ...n,
          id: typeof n.id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(n.id) ? n.id : crypto.randomUUID(),
          title: sanitizePlainInput(n.title, 250),
          content: sanitizeNoteHtml(n.content || ''),
          folder: sanitizePlainInput(n.folder || 'Notes', 100) || 'Notes',
          tags: Array.isArray(n.tags)
            ? n.tags.map((t) => sanitizePlainInput(t, 30).toLowerCase()).filter(Boolean)
            : [],
        }));
        const foldersList: string[] = rawFoldersList
          .map((f) => sanitizePlainInput(f, 50))
          .filter(Boolean);
        setParsedBackup({
          app: parsed.app || 'Quick Notes',
          version: parsed.version || 1,
          exported_at: parsed.exported_at || new Date().toISOString(),
          note_count: notesList.length,
          folders: foldersList,
          notes: notesList,
        });
      } catch {
        setError('Failed to parse file. Make sure it is a valid JSON backup file.');
      }
    };
    reader.readAsText(file);
  };
  const executeRestore = async () => {
    if (!parsedBackup || parsedBackup.notes.length === 0) {
      setError('No valid notes found to restore.');
      return;
    }
    setIsRestoring(true);
    setError(null);
    try {
      if (token) {
        const key = await getUserEncryptionKey(userId, userEmail);
        const encryptedNotesForServer = await Promise.all(
          parsedBackup.notes.map(async (n) => ({
            ...n,
            title: await encryptText(n.title || '', key),
            content: await encryptText(n.content || '', key),
          }))
        );
        const res = await restoreNotesBackupAction({
          notes: encryptedNotesForServer,
          replace: restoreMode === 'replace',
        }, token);
        if (!res.success) {
          throw new Error('Server rejected backup restore');
        }
      }
      onRestoreSuccess(parsedBackup.notes, parsedBackup.folders);
      setSuccessMsg(`Successfully restored ${parsedBackup.notes.length} notes with end-to-end encryption!`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(`Restore failed: ${String(err)}`);
    } finally {
      setIsRestoring(false);
    }
  };
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
          <div className={styles.tabContent}>
            <div className={styles.backupStatusBanner}>
              <div>
                <p className={styles.backupStatusTitle}>
                  Ready to Backup {notes.length} Notes
                </p>
                <p className={styles.backupStatusSub}>
                  {totalActiveNotes} active notes, {folders.length} folders, checklists, tags, &amp; locks
                </p>
              </div>
              <span className={`${styles.badge} ${styles.badgeInfo}`}>
                v2.0
              </span>
            </div>
            <div>
              <label className={styles.sectionLabel}>
                Dump to Cloud Storage
              </label>
              <button
                onClick={handleDumpToGoogleDrive}
                className={styles.cloudOptionBtn}
              >
                <div className={styles.cloudBtnLeft}>
                  <div className={styles.driveIconBox}>
                    <SiGoogledrive size={20} />
                  </div>
                  <div>
                    <h4 className={styles.cloudBtnTitle}>
                      Dump to Google Drive
                    </h4>
                    <p className={styles.cloudBtnDesc}>
                      Save directly into your Google Drive folders
                    </p>
                  </div>
                </div>
                <FiExternalLink size={16} className={styles.linkIconDim} />
              </button>
              <button
                onClick={handleDumpToOneDrive}
                className={styles.cloudOptionBtn}
              >
                <div className={styles.cloudBtnLeft}>
                  <div className={styles.oneDriveIconBox}>
                    <svg className={styles.svgIcon20} viewBox="0 0 24 24">
                      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className={styles.cloudBtnTitle}>
                      Dump to Microsoft OneDrive
                    </h4>
                    <p className={styles.cloudBtnDesc}>
                      Save directly into your OneDrive personal or work vault
                    </p>
                  </div>
                </div>
                <FiExternalLink size={16} className={styles.linkIconDim} />
              </button>
              <button
                onClick={handleNativeShare}
                className={styles.cloudOptionBtn}
              >
                <div className={styles.cloudBtnLeft}>
                  <div className={styles.shareIconBox}>
                    <FiShare2 size={20} />
                  </div>
                  <div>
                    <h4 className={styles.cloudBtnTitle}>
                      Share to Drive / Files App
                    </h4>
                    <p className={styles.cloudBtnDesc}>
                      Open device share sheet (Drive, OneDrive, Files)
                    </p>
                  </div>
                </div>
                <FiShare2 size={16} className={styles.linkIconDim} />
              </button>
              <button
                onClick={handleDownloadBackup}
                className={styles.cloudOptionBtn}
              >
                <div className={styles.cloudBtnLeft}>
                  <div className={styles.downloadIconBox}>
                    <FiDownload size={20} />
                  </div>
                  <div>
                    <h4 className={styles.cloudBtnTitle}>
                      Download JSON File
                    </h4>
                    <p className={styles.cloudBtnDesc}>
                      Save standard backup file to device or external storage
                    </p>
                  </div>
                </div>
                <FiDownload size={16} className={styles.linkIconDim} />
              </button>
            </div>
          </div>
        )}
        {activeTab === 'restore' && (
          <div className={styles.tabContent}>
            <p className={styles.helperText}>
              Restore notes from any backup file stored in Google Drive, OneDrive, or local device storage.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className={styles.hiddenFileInput}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className={styles.dropzone}
            >
              <div className={styles.dropzoneIcon}>
                <FiFileText size={20} />
              </div>
              <p className={styles.dropzoneTitle}>
                {fileName ? fileName : 'Choose Backup File (.json)'}
              </p>
              <p className={styles.dropzoneDesc}>
                Browse from Google Drive, OneDrive, or Device Storage
              </p>
            </div>
            {parsedBackup && (
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
            )}
            <div className={styles.modalFooterBorder}>
              <button
                type="button"
                onClick={onClose}
                className={styles.btnGhost}
              >
                Close
              </button>
              {parsedBackup && (
                <button
                  type="button"
                  onClick={executeRestore}
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
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
