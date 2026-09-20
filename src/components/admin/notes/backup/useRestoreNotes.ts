import { useState } from 'react';
import { Note } from '../NotesTypes';
import { getUserEncryptionKey, encryptText } from '../NotesCrypto';
import { restoreNotesBackupAction } from '@/actions/notes';
import { BackupPayload } from './types';
interface UseRestoreNotesProps {
  token: string;
  userId: string;
  userEmail: string;
  parsedBackup: BackupPayload | null;
  restoreMode: 'merge' | 'replace';
  onRestoreSuccess: (restoredNotes: Note[], customFolders: string[]) => void;
  onClose: () => void;
  setError: (err: string | null) => void;
  setSuccessMsg: (msg: string | null) => void;
}
export function useRestoreNotes({
  token,
  userId,
  userEmail,
  parsedBackup,
  restoreMode,
  onRestoreSuccess,
  onClose,
  setError,
  setSuccessMsg,
}: UseRestoreNotesProps) {
  const [isRestoring, setIsRestoring] = useState(false);
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
  return { isRestoring, executeRestore };
}
