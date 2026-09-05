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
        const notesList: Note[] = Array.isArray(parsed.notes) ? parsed.notes : parsed;
        const foldersList: string[] = Array.isArray(parsed.folders) ? parsed.folders : ['Notes'];
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
    <div className="modal modal-open z-50">
      <div className="modal-box max-w-lg rounded-2xl bg-base-100 p-0 shadow-2xl border border-base-300 overflow-hidden select-none">
        <div className="p-4 border-b border-base-200 bg-base-200/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-content shadow-xs font-bold text-sm">
              <FiUploadCloud className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-base text-base-content leading-tight">Backup & Restore</h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-success bg-success/10 border border-success/25 px-1.5 py-0.5 rounded-full">
                  <FiShield className="w-2.5 h-2.5" /> E2EE
                </span>
              </div>
              <p className="text-[11px] text-base-content/50">Google Drive · OneDrive · Local Storage</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-xs btn-circle">
            <FiX className="w-4 h-4" />
          </button>
        </div>
        <div className="flex border-b border-base-200 bg-base-100 px-4 pt-2">
          <button
            onClick={() => {
              setActiveTab('backup');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'backup'
                ? 'border-primary text-primary'
                : 'border-transparent text-base-content/60 hover:text-base-content'
            }`}
          >
            <BsCloudArrowUp className="w-4 h-4" />
            Backup / Dump
          </button>
          <button
            onClick={() => {
              setActiveTab('restore');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'restore'
                ? 'border-primary text-primary'
                : 'border-transparent text-base-content/60 hover:text-base-content'
            }`}
          >
            <BsCloudArrowDown className="w-4 h-4" />
            Restore
          </button>
        </div>
        <div className="px-4 pt-3">
          {error && (
            <div className="alert alert-error text-xs py-2 px-3 rounded-lg flex items-center gap-2">
              <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="alert alert-success text-xs py-2 px-3 rounded-lg flex items-center gap-2 text-white">
              <FiCheck className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>
        {activeTab === 'backup' && (
          <div className="p-4 space-y-4">
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-xs flex items-center justify-between">
              <div>
                <p className="font-semibold text-primary">
                  Ready to Backup {notes.length} Notes
                </p>
                <p className="text-[11px] text-base-content/60 mt-0.5">
                  {totalActiveNotes} active notes, {folders.length} folders, checklists, tags, & locks
                </p>
              </div>
              <span className="badge badge-primary font-bold text-[10px]">
                v2.0
              </span>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-base-content/50">
                Dump to Cloud Storage
              </label>
              <button
                onClick={handleDumpToGoogleDrive}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-base-200 hover:border-primary/50 hover:bg-base-200/60 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                    <SiGoogledrive className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">
                      Dump to Google Drive
                    </h4>
                    <p className="text-[11px] text-base-content/60">
                      Save directly into your Google Drive folders
                    </p>
                  </div>
                </div>
                <FiExternalLink className="w-4 h-4 text-base-content/40 group-hover:text-primary" />
              </button>
              <button
                onClick={handleDumpToOneDrive}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-base-200 hover:border-primary/50 hover:bg-base-200/60 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-600">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">
                      Dump to Microsoft OneDrive
                    </h4>
                    <p className="text-[11px] text-base-content/60">
                      Save directly into your OneDrive personal or work vault
                    </p>
                  </div>
                </div>
                <FiExternalLink className="w-4 h-4 text-base-content/40 group-hover:text-primary" />
              </button>
              <button
                onClick={handleNativeShare}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-base-200 hover:border-primary/50 hover:bg-base-200/60 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <FiShare2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">
                      Share to Drive / Files App
                    </h4>
                    <p className="text-[11px] text-base-content/60">
                      Open device share sheet (Drive, OneDrive, Files)
                    </p>
                  </div>
                </div>
                <FiShare2 className="w-4 h-4 text-base-content/40 group-hover:text-primary" />
              </button>
              <button
                onClick={handleDownloadBackup}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-base-200 hover:border-primary/50 hover:bg-base-200/60 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    <FiDownload className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">
                      Download JSON File
                    </h4>
                    <p className="text-[11px] text-base-content/60">
                      Save standard backup file to device or external storage
                    </p>
                  </div>
                </div>
                <FiDownload className="w-4 h-4 text-base-content/40 group-hover:text-primary" />
              </button>
            </div>
          </div>
        )}
        {activeTab === 'restore' && (
          <div className="p-4 space-y-4">
            <p className="text-xs text-base-content/70">
              Restore notes from any backup file stored in Google Drive, OneDrive, or local device storage.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-base-300 hover:border-primary p-6 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer bg-base-200/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                <FiFileText className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-base-content">
                {fileName ? fileName : 'Choose Backup File (.json)'}
              </p>
              <p className="text-[11px] text-base-content/50 mt-1">
                Browse from Google Drive, OneDrive, or Device Storage
              </p>
            </div>
            {parsedBackup && (
              <div className="p-3 bg-base-200/70 border border-base-300 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between font-semibold">
                  <span>Backup Details:</span>
                  <span className="badge badge-sm badge-success text-white">Valid Backup</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-base-content/70">
                  <div className="flex items-center gap-1.5">
                    <FiFileText className="w-3.5 h-3.5 text-primary" />
                    <span>Total Notes: <b>{parsedBackup.note_count}</b></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FiFolder className="w-3.5 h-3.5 text-primary" />
                    <span>Folders: <b>{parsedBackup.folders?.length || 1}</b></span>
                  </div>
                </div>
                <div className="pt-2 border-t border-base-300 space-y-1.5">
                  <label className="text-[11px] font-bold block text-base-content/60">
                    Restore Mode:
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRestoreMode('merge')}
                      className={`btn btn-xs flex-1 rounded-lg ${
                        restoreMode === 'merge' ? 'btn-primary font-semibold' : 'btn-ghost'
                      }`}
                    >
                      Merge (Recommended)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRestoreMode('replace')}
                      className={`btn btn-xs flex-1 rounded-lg ${
                        restoreMode === 'replace' ? 'btn-error text-white font-semibold' : 'btn-ghost'
                      }`}
                    >
                      Replace All
                    </button>
                  </div>
                  <p className="text-[10px] text-base-content/50 italic">
                    {restoreMode === 'merge'
                      ? 'Combines backup notes with your current notes without deleting any.'
                      : 'WARNING: Clears current database notes and replaces them entirely with this backup.'}
                  </p>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2 border-t border-base-200">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost btn-sm text-xs rounded-xl"
              >
                Close
              </button>
              {parsedBackup && (
                <button
                  type="button"
                  onClick={executeRestore}
                  disabled={isRestoring}
                  className="btn btn-primary btn-sm text-xs font-semibold rounded-xl shadow-xs"
                >
                  {isRestoring ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <FiCheck className="w-3.5 h-3.5 mr-1" />
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
