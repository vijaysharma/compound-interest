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
  onReorderFolders?: (folders: string[]) => void;
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
  onReorderFolders,
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
  const folderCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();
  let allCount = 0;
  let quickNotesCount = 0;
  let pinnedCount = 0;
  for (const note of notes) {
    if (note.is_trashed) continue;
    allCount += 1;
    if (note.folder) folderCounts.set(note.folder, (folderCounts.get(note.folder) || 0) + 1);
    if (note.folder === 'Quick Notes') quickNotesCount += 1;
    if (note.is_pinned) pinnedCount += 1;
    for (const tag of note.tags || []) {
      const clean = tag.toLowerCase();
      tagCounts.set(clean, (tagCounts.get(clean) || 0) + 1);
    }
  }
  const getFolderCount = (folderName: string) => folderCounts.get(folderName) || 0;
  const allTags = Array.from(tagCounts).sort((a, b) => b[1] - a[1]);
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
          onReorderFolders={onReorderFolders}
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
