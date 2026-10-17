'use client';
import React, { useState } from 'react';
import { Note } from './NotesTypes';
import styles from './NotesSidebar.module.scss';
import { SidebarHeader } from './sidebar/SidebarHeader';
import { SidebarSystemFolders } from './sidebar/SidebarSystemFolders';
import { SidebarCustomFolders } from './sidebar/SidebarCustomFolders';
import { SidebarTags } from './sidebar/SidebarTags';
import { SidebarFooter } from './sidebar/SidebarFooter';
interface NotesSidebarProps {
  activeFolder: string;
  activeTag: string | null;
  folders: string[];
  notes: Note[];
  trashedCount: number;
  onSelectFolder: (folder: string) => void;
  onSelectTag: (tag: string | null) => void;
  onCreateFolder: (name: string) => void;
  onRenameFolder: (oldName: string, newName: string) => void;
  onDeleteFolder: (name: string) => void;
  onMoveFolder?: (folderName: string, direction: 'up' | 'down') => void;
  onMoveNoteToFolder?: (noteId: string, folder: string) => void;
  isOpen: boolean;
  onClose?: () => void;
  onCloseMobile?: () => void;
  onOpenBackupModal?: () => void;
  onOpenSecurityModal?: () => void;
  onNewNote?: () => void;
  isMobileScreen?: boolean;
}
export const NotesSidebar: React.FC<NotesSidebarProps> = ({
  activeFolder,
  activeTag,
  folders,
  notes,
  trashedCount,
  onSelectFolder,
  onSelectTag,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveFolder,
  onMoveNoteToFolder,
  isOpen,
  onClose,
  onCloseMobile,
  onOpenBackupModal,
  onOpenSecurityModal,
  onNewNote,
  isMobileScreen,
}) => {
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const allCount = notes.filter((n) => !n.is_trashed).length;
  const quickNotesCount = notes.filter((n) => !n.is_trashed && n.folder === 'Quick Notes').length;
  const pinnedCount = notes.filter((n) => !n.is_trashed && n.is_pinned).length;
  const getFolderCount = (folderName: string) => {
    return notes.filter((n) => !n.is_trashed && n.folder === folderName).length;
  };
  const tagCounts: Record<string, number> = {};
  notes
    .filter((n) => !n.is_trashed)
    .forEach((note) => {
      (note.tags || []).forEach((t) => {
        const clean = t.toLowerCase();
        tagCounts[clean] = (tagCounts[clean] || 0) + 1;
      });
    });
  const allTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  const handleFolderDrop = (e: React.DragEvent, targetFolder: string) => {
    e.preventDefault();
    const noteId = e.dataTransfer.getData('text/plain');
    if (noteId && onMoveNoteToFolder) {
      onMoveNoteToFolder(noteId, targetFolder);
    }
    setDragOverFolder(null);
  };
  if (!isOpen) return null;
  return (
    <aside
      className={`${styles.sidebar} ${isMobileScreen ? styles.mobile : styles.desktop}`}
      aria-label="Notes Folders Sidebar"
    >
      <SidebarHeader
        isMobileScreen={isMobileScreen}
        onOpenBackupModal={onOpenBackupModal}
        onClose={onClose}
        onCloseMobile={onCloseMobile}
      />
      <div className={`${styles.scrollContent} qn-scrollbar`}>
        <SidebarSystemFolders
          activeFolder={activeFolder}
          activeTag={activeTag}
          allCount={allCount}
          quickNotesCount={quickNotesCount}
          pinnedCount={pinnedCount}
          dragOverFolder={dragOverFolder}
          setDragOverFolder={setDragOverFolder}
          onSelectFolder={onSelectFolder}
          onSelectTag={onSelectTag}
          onFolderDrop={handleFolderDrop}
        />
        <SidebarCustomFolders
          folders={folders}
          activeFolder={activeFolder}
          activeTag={activeTag}
          dragOverFolder={dragOverFolder}
          setDragOverFolder={setDragOverFolder}
          onSelectFolder={onSelectFolder}
          onSelectTag={onSelectTag}
          onCreateFolder={onCreateFolder}
          onRenameFolder={onRenameFolder}
          onDeleteFolder={onDeleteFolder}
          onMoveFolder={onMoveFolder}
          onFolderDrop={handleFolderDrop}
          getFolderCount={getFolderCount}
        />
        <SidebarTags
          allTags={allTags}
          activeTag={activeTag}
          onSelectTag={onSelectTag}
        />
        <SidebarFooter
          activeFolder={activeFolder}
          activeTag={activeTag}
          trashedCount={trashedCount}
          isMobileScreen={isMobileScreen}
          onSelectFolder={onSelectFolder}
          onSelectTag={onSelectTag}
          onOpenSecurityModal={onOpenSecurityModal}
          onNewNote={onNewNote}
        />
      </div>
    </aside>
  );
};
