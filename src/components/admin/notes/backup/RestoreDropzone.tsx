'use client';
import React, { useRef } from 'react';
import { FiFileText } from 'react-icons/fi';
import { Note } from '../NotesTypes';
import { sanitizeNoteHtml, sanitizePlainInput } from '../sanitizeHtml';
import { BackupPayload } from './types';
import styles from '../NotesModal.module.scss';
interface RestoreDropzoneProps {
  fileName: string | null;
  setFileName: (name: string | null) => void;
  setParsedBackup: (backup: BackupPayload | null) => void;
  setError: (err: string | null) => void;
  setSuccessMsg: (msg: string | null) => void;
}
export const RestoreDropzone: React.FC<RestoreDropzoneProps> = ({
  fileName,
  setFileName,
  setParsedBackup,
  setError,
  setSuccessMsg,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  return (
    <>
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
    </>
  );
};
