'use client';
import { useCallback } from 'react';
import { Note, SYSTEM_FOLDERS } from '../NotesTypes';
import { createEncryptedNote } from './notesCreator';
interface UseNotesCreateActionsProps {
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  selectedNote: Note | null;
  setSelectedNoteId: (id: string | null) => void;
  setMobileScreen: (s: 'folders' | 'list' | 'editor') => void;
  activeFolder: string;
  activeTag: string | null;
  token: string;
  userId: string;
  userEmail: string;
  setSaveError: (err: string) => void;
  savePendingRef: React.MutableRefObject<Set<string>>;
  unconfirmedCreatesRef: React.MutableRefObject<Set<string>>;
  flushPendingSaves: () => Promise<void>;
  queueNoteSync: (id: string) => void;
}
export function useNotesCreateActions({
  setNotes,
  selectedNote,
  setSelectedNoteId,
  setMobileScreen,
  activeFolder,
  activeTag,
  token,
  userId,
  userEmail,
  setSaveError,
  savePendingRef,
  unconfirmedCreatesRef,
  flushPendingSaves,
  queueNoteSync,
}: UseNotesCreateActionsProps) {
  const handleNewNote = useCallback(async () => {
    if (savePendingRef.current.size > 0) await flushPendingSaves();
    let targetFolder = 'Quick Notes';
    if (
      activeFolder !== SYSTEM_FOLDERS.ALL &&
      activeFolder !== SYSTEM_FOLDERS.PINNED &&
      activeFolder !== SYSTEM_FOLDERS.TRASH
    ) {
      targetFolder = activeFolder;
    }
    const tempId = `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    const newNote: Note = {
      id: tempId,
      title: '',
      content: '',
      folder: targetFolder,
      is_pinned: false,
      is_locked: false,
      is_trashed: false,
      tags: activeTag ? [activeTag.toLowerCase()] : [],
      created_at: nowIso,
      updated_at: nowIso,
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelectedNoteId(tempId);
    setMobileScreen('editor');
    unconfirmedCreatesRef.current.add(tempId);
    if (!token) {
      setSaveError('Not signed in — this note has not been saved.');
      return;
    }
    try {
      const created = await createEncryptedNote({ note: newNote, token, userId, userEmail });
      unconfirmedCreatesRef.current.delete(tempId);
      setNotes((prev) => prev.map((n) => (n.id === tempId ? { ...created, is_pinned: n.is_pinned, folder: n.folder, tags: n.tags } : n)));
      setSelectedNoteId(created.id);
    } catch (err) {
      queueNoteSync(tempId);
      setSaveError(`Could not create note on the server: ` + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }, [activeFolder, activeTag, token, userId, userEmail, flushPendingSaves, queueNoteSync, savePendingRef, unconfirmedCreatesRef, setNotes, setSelectedNoteId, setMobileScreen, setSaveError]);
  const handleDuplicateNote = useCallback(
    async (noteToDupe?: Note, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (savePendingRef.current.size > 0) await flushPendingSaves();
      const baseNote = noteToDupe || selectedNote;
      if (!baseNote) return;
      const tempId = `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const nowIso = new Date().toISOString();
      const duplicated: Note = {
        ...baseNote,
        id: tempId,
        title: baseNote.title ? `${baseNote.title} (Copy)` : 'Copy of Note',
        created_at: nowIso,
        updated_at: nowIso,
        is_pinned: false,
      };
      setNotes((prev) => [duplicated, ...prev]);
      setSelectedNoteId(tempId);
      setMobileScreen('editor');
      unconfirmedCreatesRef.current.add(tempId);
      if (!token) {
        setSaveError('Not signed in — this note has not been saved.');
        return;
      }
      try {
        const created = await createEncryptedNote({ note: duplicated, token, userId, userEmail });
        unconfirmedCreatesRef.current.delete(tempId);
        setNotes((prev) => prev.map((n) => (n.id === tempId ? created : n)));
        setSelectedNoteId(created.id);
      } catch (err) {
        queueNoteSync(tempId);
        setSaveError(`Could not duplicate note on the server: ` + (err instanceof Error ? err.message : 'Unknown error'));
      }
    },
    [selectedNote, token, userId, userEmail, flushPendingSaves, queueNoteSync, savePendingRef, unconfirmedCreatesRef, setNotes, setSelectedNoteId, setMobileScreen, setSaveError]
  );
  return { handleNewNote, handleDuplicateNote };
}
