'use client';
import React from 'react';
import { Note } from '../NotesTypes';
import { BackupPayload } from './types';
import { BackupCloudButtons } from './BackupCloudButtons';
import styles from '../NotesModal.module.scss';
interface BackupTabProps {
  notes: Note[];
  folders: string[];
  setError: (err: string | null) => void;
  setSuccessMsg: (msg: string | null) => void;
}
export const BackupTab: React.FC<BackupTabProps> = ({
  notes,
  folders,
  setError,
  setSuccessMsg,
}) => {
  const totalActiveNotes = notes.filter((n) => !n.is_trashed).length;
  const generateBackupData = (): BackupPayload => ({
    app: 'Quick Notes',
    version: 2,
    exported_at: new Date().toISOString(),
    note_count: notes.length,
    folders,
    notes,
  });
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
  const handleDumpGoogleDrive = async () => {
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
  const handleDumpOneDrive = async () => {
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
  return (
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
      <BackupCloudButtons
        onDumpGoogleDrive={handleDumpGoogleDrive}
        onDumpOneDrive={handleDumpOneDrive}
        onNativeShare={handleNativeShare}
        onDownloadBackup={handleDownloadBackup}
      />
    </div>
  );
};
