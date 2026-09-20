'use client';
import { useCallback } from 'react';
import { Note } from '../NotesTypes';
interface UseNotesMutateActionsProps {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  selectedNoteId: string | null;
  queueNoteSync: (id: string) => void;
}
export function useNotesMutateActions({
  notes,
  setNotes,
  selectedNoteId,
  queueNoteSync,
}: UseNotesMutateActionsProps) {
  const handleUpdateNote = useCallback(
    (updatedFields: Partial<Note>) => {
      if (!selectedNoteId) return;
      const updatedTime = new Date().toISOString();
      const payload: Partial<Note> = {
        ...updatedFields,
        updated_at: updatedFields.updated_at || updatedTime,
      };
      setNotes((prevNotes) => prevNotes.map((n) => (n.id === selectedNoteId ? { ...n, ...payload } : n)));
      queueNoteSync(selectedNoteId);
    },
    [selectedNoteId, queueNoteSync, setNotes]
  );
  const handleTogglePin = useCallback(
    (id?: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      const targetId = id || selectedNoteId;
      if (!targetId) return;
      const target = notes.find((n) => n.id === targetId);
      if (!target) return;
      const newPinState = !target.is_pinned;
      const updatedTime = new Date().toISOString();
      setNotes((prev) => prev.map((n) => (n.id === targetId ? { ...n, is_pinned: newPinState, updated_at: updatedTime } : n)));
      queueNoteSync(targetId);
    },
    [notes, selectedNoteId, queueNoteSync, setNotes]
  );
  const handleMoveNoteToFolder = useCallback(
    (noteId: string, targetFolder: string) => {
      const updatedTime = new Date().toISOString();
      setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, folder: targetFolder, updated_at: updatedTime } : n)));
      queueNoteSync(noteId);
    },
    [queueNoteSync, setNotes]
  );
  return {
    handleUpdateNote,
    handleTogglePin,
    handleMoveNoteToFolder,
  };
}
