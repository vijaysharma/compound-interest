'use client';
import { useState, useEffect } from 'react';
import { ViewMode, SortOption, SYSTEM_FOLDERS } from '../NotesTypes';
import { useNotesPersistence } from './useNotesPersistence';
import { useMobileBackHandler } from './useMobileBackHandler';
interface UseNotesNavigationProps {
  userId: string;
  hasSelectedNote: boolean;
}
export function useNotesNavigation({ userId, hasSelectedNote }: UseNotesNavigationProps) {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(
        userId !== 'default' ? `quick_notes_${userId}_last_note_id` : 'quick_notes_last_note_id'
      );
    } catch {
      return null;
    }
  });
  const [activeFolder, setActiveFolder] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(userId !== 'default' ? `quick_notes_${userId}_last_folder` : 'quick_notes_last_folder');
      return saved || SYSTEM_FOLDERS.ALL;
    } catch {
      return SYSTEM_FOLDERS.ALL;
    }
  });
  const [activeTag, setActiveTag] = useState<string | null>(() => {
    try {
      return localStorage.getItem(userId !== 'default' ? `quick_notes_${userId}_last_tag` : 'quick_notes_last_tag');
    } catch {
      return null;
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem(userId !== 'default' ? `quick_notes_${userId}_view_mode` : 'quick_notes_view_mode') as ViewMode;
      return saved === 'gallery' || saved === 'list' ? saved : 'list';
    } catch {
      return 'list';
    }
  });
  const [sortOption, setSortOption] = useState<SortOption>(() => {
    try {
      const saved = localStorage.getItem(userId !== 'default' ? `quick_notes_${userId}_sort_option` : 'quick_notes_sort_option') as SortOption;
      return saved || 'updated_desc';
    } catch {
      return 'updated_desc';
    }
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(userId !== 'default' ? `quick_notes_${userId}_sidebar_open` : 'quick_notes_sidebar_open');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [mobileScreen, setMobileScreen] = useState<'folders' | 'list' | 'editor'>(() => {
    try {
      const saved = localStorage.getItem(userId !== 'default' ? `quick_notes_${userId}_last_mobile_screen` : 'quick_notes_last_mobile_screen') as 'folders' | 'list' | 'editor' | null;
      if (saved === 'editor' || saved === 'folders' || saved === 'list') return saved;
      return 'list';
    } catch {
      return 'list';
    }
  });
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  useNotesPersistence({
    userId,
    selectedNoteId,
    activeFolder,
    activeTag,
    mobileScreen,
    viewMode,
    sortOption,
    isSidebarOpen,
  });
  useMobileBackHandler({
    isMobile,
    mobileScreen,
    setMobileScreen,
  });
  const effectiveMobileScreen: 'folders' | 'list' | 'editor' =
    isMobile && mobileScreen === 'editor' && !hasSelectedNote ? 'list' : mobileScreen;
  return {
    selectedNoteId,
    setSelectedNoteId,
    activeFolder,
    setActiveFolder,
    activeTag,
    setActiveTag,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    sortOption,
    setSortOption,
    isSidebarOpen,
    setIsSidebarOpen,
    mobileScreen,
    setMobileScreen,
    isMobile,
    effectiveMobileScreen,
  };
}
