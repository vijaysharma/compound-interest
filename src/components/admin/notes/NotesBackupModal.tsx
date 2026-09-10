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
        const res = await fetch('/api/admin/notes?action=restore_backup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            notes: encryptedNotesForServer,
            replace: restoreMode === 'replace',
          }),
        });
        if (!res.ok) {
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
      <div className={`${styles.modalBox} ${styles.modalBoxLg}`} style={{ userSelect: 'none' }}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalIconBox} style={{ background: 'var(--color-primary)', color: '#ffffff' }}>
              <FiUploadCloud size={16} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
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
        <div style={{ padding: '0.75rem 1rem 0' }}>
          {error && (
            <div className={styles.alertError}>
              <FiAlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className={styles.alertSuccess}>
              <FiCheck size={16} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}
        </div>
        {activeTab === 'backup' && (
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                padding: '0.75rem',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: '12px',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <p style={{ fontWeight: 600, color: 'var(--color-primary)', margin: 0 }}>
                  Ready to Backup {notes.length} Notes
                </p>
                <p style={{ fontSize: '11px', opacity: 0.6, margin: '2px 0 0 0' }}>
                  {totalActiveNotes} active notes, {folders.length} folders, checklists, tags, &amp; locks
                </p>
              </div>
              <span className={`${styles.badge} ${styles.badgeInfo}`}>
                v2.0
              </span>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.5, marginBottom: '0.5rem' }}>
                Dump to Cloud Storage
              </label>
              <button
                onClick={handleDumpToGoogleDrive}
                className={styles.cloudOptionBtn}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                    <SiGoogledrive size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 600, fontSize: '0.875rem', margin: 0 }}>
                      Dump to Google Drive
                    </h4>
                    <p style={{ fontSize: '11px', opacity: 0.6, margin: '2px 0 0 0' }}>
                      Save directly into your Google Drive folders
                    </p>
                  </div>
                </div>
                <FiExternalLink size={16} style={{ opacity: 0.4 }} />
              </button>
              <button
                onClick={handleDumpToOneDrive}
                className={styles.cloudOptionBtn}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(14, 165, 233, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                    <svg style={{ width: '20px', height: '20px', fill: 'currentColor' }} viewBox="0 0 24 24">
                      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
                    </svg>
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 600, fontSize: '0.875rem', margin: 0 }}>
                      Dump to Microsoft OneDrive
                    </h4>
                    <p style={{ fontSize: '11px', opacity: 0.6, margin: '2px 0 0 0' }}>
                      Save directly into your OneDrive personal or work vault
                    </p>
                  </div>
                </div>
                <FiExternalLink size={16} style={{ opacity: 0.4 }} />
              </button>
              <button
                onClick={handleNativeShare}
                className={styles.cloudOptionBtn}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                    <FiShare2 size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 600, fontSize: '0.875rem', margin: 0 }}>
                      Share to Drive / Files App
                    </h4>
                    <p style={{ fontSize: '11px', opacity: 0.6, margin: '2px 0 0 0' }}>
                      Open device share sheet (Drive, OneDrive, Files)
                    </p>
                  </div>
                </div>
                <FiShare2 size={16} style={{ opacity: 0.4 }} />
              </button>
              <button
                onClick={handleDownloadBackup}
                className={styles.cloudOptionBtn}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                    <FiDownload size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 600, fontSize: '0.875rem', margin: 0 }}>
                      Download JSON File
                    </h4>
                    <p style={{ fontSize: '11px', opacity: 0.6, margin: '2px 0 0 0' }}>
                      Save standard backup file to device or external storage
                    </p>
                  </div>
                </div>
                <FiDownload size={16} style={{ opacity: 0.4 }} />
              </button>
            </div>
          </div>
        )}
        {activeTab === 'restore' && (
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p className={styles.helperText}>
              Restore notes from any backup file stored in Google Drive, OneDrive, or local device storage.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className={styles.dropzone}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                <FiFileText size={20} />
              </div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>
                {fileName ? fileName : 'Choose Backup File (.json)'}
              </p>
              <p style={{ fontSize: '11px', opacity: 0.5, margin: '4px 0 0 0' }}>
                Browse from Google Drive, OneDrive, or Device Storage
              </p>
            </div>
            {parsedBackup && (
              <div style={{ padding: '0.75rem', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '12px', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>Backup Details:</span>
                  <span className={`${styles.badge} ${styles.badgeSuccess}`}>Valid Backup</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', paddingTop: '0.5rem', fontSize: '11px', opacity: 0.7 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <FiFileText size={14} style={{ color: 'var(--color-primary)' }} />
                    <span>Total Notes: <b>{parsedBackup.note_count}</b></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <FiFolder size={14} style={{ color: 'var(--color-primary)' }} />
                    <span>Folders: <b>{parsedBackup.folders?.length || 1}</b></span>
                  </div>
                </div>
                <div style={{ paddingTop: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', opacity: 0.6, marginBottom: '0.35rem' }}>
                    Restore Mode:
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setRestoreMode('merge')}
                      className={restoreMode === 'merge' ? styles.btnPrimary : styles.btnGhost}
                      style={{ flex: 1 }}
                    >
                      Merge (Recommended)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRestoreMode('replace')}
                      className={restoreMode === 'replace' ? `${styles.btnGhost} ${styles.btnDanger}` : styles.btnGhost}
                      style={{ flex: 1, border: restoreMode === 'replace' ? '1px solid #ef4444' : '1px solid var(--color-border)' }}
                    >
                      Replace All
                    </button>
                  </div>
                  <p style={{ fontSize: '10px', opacity: 0.5, fontStyle: 'italic', margin: '4px 0 0 0' }}>
                    {restoreMode === 'merge'
                      ? 'Combines backup notes with your current notes without deleting any.'
                      : 'WARNING: Clears current database notes and replaces them entirely with this backup.'}
                  </p>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
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
