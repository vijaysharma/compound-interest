'use client';
import { useCallback } from 'react';
import { Note, SYSTEM_FOLDERS } from '../NotesTypes';
import { deleteNoteAction, emptyTrashAction } from '@/actions/notes';
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
}: UseNotesDeleteActionsProps) {
  const handlePermanentDelete = useCallback(
    async (id?: string) => {
      const targetId = id || selectedNoteId;
      if (!targetId) return;
      savePendingRef.current.delete(targetId);
      locallyDeletedRef.current.add(targetId);
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
    [notes, selectedNoteId, token, flushPendingSaves, activeFolder, savePendingRef, locallyDeletedRef, setNotes, setSelectedNoteId, setMobileScreen, setSaveError, setUnsyncedCount]
  );
  const handleDeleteNote = useCallback(
    (id?: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      const targetId = id || selectedNoteId;
      if (!targetId) return;
      const target = notes.find((n) => n.id === targetId);
      if (!target) return;
      if (target.is_trashed) {
        handlePermanentDelete(targetId);
        return;
      }
      if (savePendingRef.current.size > 0) void flushPendingSaves();
      const updatedTime = new Date().toISOString();
      setNotes((prev) => prev.map((n) => (n.id === targetId ? { ...n, is_trashed: true, updated_at: updatedTime } : n)));
      if (selectedNoteId === targetId) {
        const remaining = notes.filter((n) => n.id !== targetId && !n.is_trashed);
        setSelectedNoteId(remaining.length > 0 ? remaining[0].id : null);
        setMobileScreen('list');
      }
      queueNoteSync(targetId);
      void flushPendingSaves();
    },
    [notes, selectedNoteId, queueNoteSync, handlePermanentDelete, flushPendingSaves, savePendingRef, setNotes, setSelectedNoteId, setMobileScreen]
  );
  const handleRestoreNote = useCallback(
    (id?: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      const targetId = id || selectedNoteId;
      if (!targetId) return;
      if (savePendingRef.current.size > 0) void flushPendingSaves();
      const updatedTime = new Date().toISOString();
      setNotes((prev) => prev.map((n) => (n.id === targetId ? { ...n, is_trashed: false, updated_at: updatedTime } : n)));
      queueNoteSync(targetId);
      void flushPendingSaves();
    },
    [selectedNoteId, queueNoteSync, flushPendingSaves, savePendingRef, setNotes]
  );
  const handleEmptyTrash = useCallback(async () => {
    if (!window.confirm('Permanently delete all notes in Recently Deleted? This cannot be undone.')) return;
    setNotes((prev) => {
      prev.filter((n) => n.is_trashed).forEach((n) => {
        locallyDeletedRef.current.add(n.id);
        savePendingRef.current.delete(n.id);
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
  }, [token, locallyDeletedRef, savePendingRef, setNotes, setSelectedNoteId, setSaveError, setUnsyncedCount]);
  return {
    handleDeleteNote,
    handlePermanentDelete,
    handleRestoreNote,
    handleEmptyTrash,
  };
}
