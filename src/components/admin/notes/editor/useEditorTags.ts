import { useState, useCallback, useRef, useEffect, FormEvent, ChangeEvent, MutableRefObject } from 'react';
import { Note } from '../NotesTypes';
import { sanitizePlainInput } from '../sanitizeHtml';
interface UseEditorTagsParams {
  note: Note | null;
  hasManualTitleRef: MutableRefObject<boolean>;
  onUpdateNote: (updated: Partial<Note>, targetId?: string) => void;
  calculateStats: (text: string) => void;
}
export function useEditorTags({
  note,
  hasManualTitleRef,
  onUpdateNote,
  calculateStats,
}: UseEditorTagsParams) {
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [titleValue, setTitleValue] = useState(note?.title || '');
  const titleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTitleRef = useRef<string | null>(null);
  const noteIdRef = useRef<string | undefined>(note?.id);
  const onUpdateNoteRef = useRef(onUpdateNote);
  useEffect(() => {
    onUpdateNoteRef.current = onUpdateNote;
  }, [onUpdateNote]);
  const flushTitle = useCallback(() => {
    if (titleTimerRef.current) {
      clearTimeout(titleTimerRef.current);
      titleTimerRef.current = null;
    }
    if (pendingTitleRef.current !== null && noteIdRef.current) {
      const titleToSave = pendingTitleRef.current;
      pendingTitleRef.current = null;
      onUpdateNoteRef.current({ title: titleToSave }, noteIdRef.current);
    }
  }, []);
  useEffect(() => {
    if (note?.id !== noteIdRef.current) {
      flushTitle();
      noteIdRef.current = note?.id;
      setTitleValue(note?.title || '');
    } else if (pendingTitleRef.current === null && (note?.title || '') !== titleValue) {
      setTitleValue(note?.title || '');
    }
  }, [note?.id, note?.title, flushTitle, titleValue]);
  useEffect(() => {
    return () => {
      flushTitle();
    };
  }, [flushTitle]);
  const handleTitleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const rawVal = e.target.value;
      const newTitle = sanitizePlainInput(rawVal, 250, false);
      setTitleValue(newTitle);
      pendingTitleRef.current = newTitle;
      hasManualTitleRef.current = Boolean(newTitle.trim());
      calculateStats(newTitle + ' ' + (note?.content || ''));
      if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
      titleTimerRef.current = setTimeout(() => {
        flushTitle();
      }, 350);
    },
    [note?.content, hasManualTitleRef, calculateStats, flushTitle]
  );
  const handleTitleBlur = useCallback(() => {
    flushTitle();
  }, [flushTitle]);
  const handleAddTag = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!newTagInput.trim() || !note) return;
      const cleanTag = newTagInput
        .trim()
        .replace(/^#+/, '')
        .replace(/[^\w-]/g, '')
        .slice(0, 30)
        .toLowerCase();
      if (!cleanTag) return;
      const updated = Array.from(new Set([...(note.tags || []), cleanTag]));
      onUpdateNote({ tags: updated });
      setNewTagInput('');
      setIsAddingTag(false);
    },
    [newTagInput, note, onUpdateNote]
  );
  const handleRemoveTag = useCallback(
    (tagToRemove: string) => {
      if (!note) return;
      const updated = (note.tags || []).filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase());
      onUpdateNote({ tags: updated });
    },
    [note, onUpdateNote]
  );
  return {
    titleValue,
    newTagInput,
    setNewTagInput,
    isAddingTag,
    setIsAddingTag,
    handleTitleChange,
    handleTitleBlur,
    handleAddTag,
    handleRemoveTag,
  };
}
