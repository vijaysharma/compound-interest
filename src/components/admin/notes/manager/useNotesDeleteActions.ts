'use client';
import { useCallback } from 'react';
import { Note, SYSTEM_FOLDERS } from '../NotesTypes';
import { deleteNoteAction, emptyTrashAction } from '@/actions/notes';
import { saveLocalDraft, removeLocalDraft } from './notesDraftStorage';
interface UseNotesDeleteActionsProps {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  selectedNoteId: string | null;
  setSelectedNoteId: (id: string | null) => void;
  setMobileScreen: (s: 'folders' | 'list' | 'editor') => void;
  activeFolder: string;
  token: string;
  setSaveError: (err: string) => void;
  savePendingRef: React.MutableRefObject<Set<string>>;
  locallyDeletedRef: React.MutableRefObject<Set<string>>;
  setUnsyncedCount: (count: number) => void;
  flushPendingSaves: () => Promise<void>;
  queueNoteSync: (id: string) => void;
  userId?: string;
}
export function useNotesDeleteActions({
  notes,
  setNotes,
  selectedNoteId,
  setSelectedNoteId,
  setMobileScreen,
  activeFolder,
  token,
  setSaveError,
  savePendingRef,
  locallyDeletedRef,
  setUnsyncedCount,
  flushPendingSaves,
  queueNoteSync,
  userId,
}: UseNotesDeleteActionsProps) {
  const handlePermanentDelete = useCallback(
    async (id?: string) => {
      const targetId = id || selectedNoteId;
      if (!targetId) return;
      savePendingRef.current.delete(targetId);
      locallyDeletedRef.current.add(targetId);
      if (userId) {
        removeLocalDraft(userId, targetId);
      }
      setUnsyncedCount(savePendingRef.current.size);
      if (savePendingRef.current.size > 0) await flushPendingSaves();
      setNotes((prev) => prev.filter((n) => n.id !== targetId));
      if (selectedNoteId === targetId) {
        const remaining = notes.filter((n) => {
          if (n.id === targetId) return false;
          if (activeFolder === SYSTEM_FOLDERS.TRASH) return n.is_trashed;
          return !n.is_trashed;
        });
        setSelectedNoteId(remaining.length > 0 ? remaining[0].id : null);
        setMobileScreen('list');
      }
      if (!token) {
        setSaveError('Not signed in — this note has not been deleted on the server.');
        return;
      }
      try {
        await deleteNoteAction({ id: targetId, permanent: true }, token);
      } catch (err) {
        setSaveError(
          `Could not permanently delete note on the server: ` +
            (err instanceof Error ? err.message : 'Unknown error')
        );
      }
    },
    [notes, selectedNoteId, token, flushPendingSaves, activeFolder, savePendingRef, locallyDeletedRef, setNotes, setSelectedNoteId, setMobileScreen, setSaveError, setUnsyncedCount, userId]
  );
  const handleDeleteNote = useCallback(
    async (id?: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      const targetId = id || selectedNoteId;
      if (!targetId) return;
      const target = notes.find((n) => n.id === targetId);
      if (!target) return;
      if (target.is_trashed) {
        await handlePermanentDelete(targetId);
        return;
      }
      savePendingRef.current.delete(targetId);
      setUnsyncedCount(savePendingRef.current.size);
      const updatedTime = new Date().toISOString();
      const trashedNote: Note = { ...target, is_trashed: true, updated_at: updatedTime };
      setNotes((prev) => prev.map((n) => (n.id === targetId ? trashedNote : n)));
      if (userId) {
        saveLocalDraft(userId, trashedNote);
      }
      if (selectedNoteId === targetId) {
        const remaining = notes.filter((n) => n.id !== targetId && !n.is_trashed);
        setSelectedNoteId(remaining.length > 0 ? remaining[0].id : null);
        setMobileScreen('list');
      }
      if (!token) {
        setSaveError('Not signed in — note moved to trash locally only.');
        return;
      }
      try {
        await deleteNoteAction({ id: targetId }, token);
        if (userId) {
          removeLocalDraft(userId, targetId);
        }
      } catch (err) {
        setSaveError('Could not trash note on the server: ' + (err instanceof Error ? err.message : 'Unknown error'));
        queueNoteSync(targetId);
      }
    },
    [notes, selectedNoteId, queueNoteSync, handlePermanentDelete, savePendingRef, setNotes, setSelectedNoteId, setMobileScreen, token, userId, setSaveError, setUnsyncedCount]
  );
  const handleRestoreNote = useCallback(
    (id?: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      const targetId = id || selectedNoteId;
      if (!targetId) return;
      const target = notes.find((n) => n.id === targetId);
      if (!target) return;
      const updatedTime = new Date().toISOString();
      const restoredNote: Note = { ...target, is_trashed: false, updated_at: updatedTime };
      setNotes((prev) => prev.map((n) => (n.id === targetId ? restoredNote : n)));
      if (userId) {
        saveLocalDraft(userId, restoredNote);
      }
      queueNoteSync(targetId);
      void flushPendingSaves();
    },
    [notes, selectedNoteId, queueNoteSync, flushPendingSaves, setNotes, userId]
  );
  const handleEmptyTrash = useCallback(async () => {
    if (!window.confirm('Permanently delete all notes in Recently Deleted? This cannot be undone.')) return;
    setNotes((prev) => {
      prev.filter((n) => n.is_trashed).forEach((n) => {
        locallyDeletedRef.current.add(n.id);
        savePendingRef.current.delete(n.id);
        if (userId) removeLocalDraft(userId, n.id);
      });
      setUnsyncedCount(savePendingRef.current.size);
      return prev.filter((n) => !n.is_trashed);
    });
    setSelectedNoteId(null);
    if (!token) {
      setSaveError('Not signed in — the trash has not been emptied on the server.');
      return;
    }
    try {
      await emptyTrashAction(token);
    } catch (err) {
      setSaveError('Could not empty trash on the server: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }, [token, locallyDeletedRef, savePendingRef, setNotes, setSelectedNoteId, setSaveError, setUnsyncedCount, userId]);
  return {
    handleDeleteNote,
    handlePermanentDelete,
    handleRestoreNote,
    handleEmptyTrash,
  };
}
