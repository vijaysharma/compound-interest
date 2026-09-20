'use client';
import { useEffect } from 'react';
import { ViewMode, SortOption } from '../NotesTypes';
interface UseNotesPersistenceProps {
  userId: string;
  selectedNoteId: string | null;
  activeFolder: string;
  activeTag: string | null;
  mobileScreen: 'folders' | 'list' | 'editor';
  viewMode: ViewMode;
  sortOption: SortOption;
  isSidebarOpen: boolean;
}
export function useNotesPersistence({
  userId,
  selectedNoteId,
  activeFolder,
  activeTag,
  mobileScreen,
  viewMode,
  sortOption,
  isSidebarOpen,
}: UseNotesPersistenceProps) {
  useEffect(() => {
    const key = userId !== 'default' ? `quick_notes_${userId}_last_note_id` : 'quick_notes_last_note_id';
    if (selectedNoteId) localStorage.setItem(key, selectedNoteId);
    else localStorage.removeItem(key);
  }, [selectedNoteId, userId]);
  useEffect(() => {
    const key = userId !== 'default' ? `quick_notes_${userId}_last_folder` : 'quick_notes_last_folder';
    if (activeFolder) localStorage.setItem(key, activeFolder);
  }, [activeFolder, userId]);
  useEffect(() => {
    const key = userId !== 'default' ? `quick_notes_${userId}_last_mobile_screen` : 'quick_notes_last_mobile_screen';
    localStorage.setItem(key, mobileScreen);
  }, [mobileScreen, userId]);
  useEffect(() => {
    const key = userId !== 'default' ? `quick_notes_${userId}_last_tag` : 'quick_notes_last_tag';
    if (activeTag) localStorage.setItem(key, activeTag);
    else localStorage.removeItem(key);
  }, [activeTag, userId]);
  useEffect(() => {
    const key = userId !== 'default' ? `quick_notes_${userId}_view_mode` : 'quick_notes_view_mode';
    localStorage.setItem(key, viewMode);
  }, [viewMode, userId]);
  useEffect(() => {
    const key = userId !== 'default' ? `quick_notes_${userId}_sort_option` : 'quick_notes_sort_option';
    localStorage.setItem(key, sortOption);
  }, [sortOption, userId]);
  useEffect(() => {
    const key = userId !== 'default' ? `quick_notes_${userId}_sidebar_open` : 'quick_notes_sidebar_open';
    localStorage.setItem(key, String(isSidebarOpen));
  }, [isSidebarOpen, userId]);
}
