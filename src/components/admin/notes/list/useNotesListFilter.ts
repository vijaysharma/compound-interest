import { useMemo } from 'react';
import { Note, SortOption, SYSTEM_FOLDERS, extractHashtags, deriveAutoTitleFromHtml } from '../NotesTypes';
interface UseNotesListFilterProps {
  notes: Note[];
  activeFolder: string;
  activeTag: string | null;
  searchQuery: string;
  sortOption: SortOption;
}
export function useNotesListFilter({
  notes,
  activeFolder,
  activeTag,
  searchQuery,
  sortOption,
}: UseNotesListFilterProps) {
  const isTrash = activeFolder === SYSTEM_FOLDERS.TRASH;
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      if (isTrash) {
        if (!note.is_trashed) return false;
      } else {
        if (note.is_trashed) return false;
        if (activeFolder === SYSTEM_FOLDERS.PINNED) {
          if (!note.is_pinned) return false;
        } else if (activeFolder === SYSTEM_FOLDERS.QUICK_NOTES) {
          if (note.folder !== 'Quick Notes') return false;
        } else if (activeFolder !== SYSTEM_FOLDERS.ALL) {
          if (note.folder !== activeFolder) return false;
        }
      }
      if (activeTag) {
        const hashtags = extractHashtags(note.title + ' ' + note.content);
        const combined = new Set([...(note.tags || []), ...hashtags].map((t) => t.toLowerCase()));
        if (!combined.has(activeTag.toLowerCase())) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const displayTitle = (note.title?.trim() || deriveAutoTitleFromHtml(note.content)).toLowerCase();
        const titleMatch = displayTitle.includes(q);
        const contentMatch = (note.content || '').toLowerCase().includes(q);
        const folderMatch = (note.folder || '').toLowerCase().includes(q);
        const tagMatch = (note.tags || []).some((t) => t.toLowerCase().includes(q));
        return titleMatch || contentMatch || folderMatch || tagMatch;
      }
      return true;
    });
  }, [notes, isTrash, activeFolder, activeTag, searchQuery]);
  const sortedNotes = useMemo(() => {
    return [...filteredNotes].sort((a, b) => {
      if (sortOption !== 'title_asc') {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
      }
      if (sortOption === 'updated_desc') {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
      if (sortOption === 'created_desc') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortOption === 'title_asc') {
        const aTitle = a.title?.trim() || deriveAutoTitleFromHtml(a.content) || 'Untitled';
        const bTitle = b.title?.trim() || deriveAutoTitleFromHtml(b.content) || 'Untitled';
        return aTitle.localeCompare(bTitle);
      }
      return 0;
    });
  }, [filteredNotes, sortOption]);
  const pinnedNotes = useMemo(() => sortedNotes.filter((n) => n.is_pinned), [sortedNotes]);
  const unpinnedNotes = useMemo(() => sortedNotes.filter((n) => !n.is_pinned), [sortedNotes]);
  return {
    isTrash,
    filteredNotes,
    sortedNotes,
    pinnedNotes,
    unpinnedNotes,
  };
}
