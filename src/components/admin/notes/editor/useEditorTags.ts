import { useState, useCallback, FormEvent, ChangeEvent, MutableRefObject } from 'react';
import { Note, extractHashtags } from '../NotesTypes';
import { sanitizePlainInput } from '../sanitizeHtml';
interface UseEditorTagsParams {
  note: Note | null;
  hasManualTitleRef: MutableRefObject<boolean>;
  onUpdateNote: (updated: Partial<Note>) => void;
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
  const handleTitleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!note) return;
      const newTitle = sanitizePlainInput(e.target.value, 250);
      hasManualTitleRef.current = Boolean(newTitle.trim());
      calculateStats(newTitle + ' ' + (note.content || ''));
      const contentTags = extractHashtags(newTitle + ' ' + (note.content || ''));
      const combinedTags = Array.from(new Set([...(note.tags || []), ...contentTags]));
      onUpdateNote({ title: newTitle, tags: combinedTags });
    },
    [note, hasManualTitleRef, calculateStats, onUpdateNote]
  );
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
    newTagInput,
    setNewTagInput,
    isAddingTag,
    setIsAddingTag,
    handleTitleChange,
    handleAddTag,
    handleRemoveTag,
  };
}
