'use client';
import React from 'react';
import { FiFolder } from 'react-icons/fi';
import { BsPinFill, BsJournalBookmark } from 'react-icons/bs';
import { SYSTEM_FOLDERS } from '../NotesTypes';
import styles from '../NotesSidebar.module.scss';
interface SidebarSystemFoldersProps {
  activeFolder: string;
  activeTag: string | null;
  allCount: number;
  quickNotesCount: number;
  pinnedCount: number;
  dragOverFolder: string | null;
  setDragOverFolder: (folder: string | null) => void;
  onSelectFolder: (folder: string) => void;
  onSelectTag: (tag: string | null) => void;
  onFolderDrop: (e: React.DragEvent, targetFolder: string) => void;
}
export const SidebarSystemFolders: React.FC<SidebarSystemFoldersProps> = ({
  activeFolder,
  activeTag,
  allCount,
  quickNotesCount,
  pinnedCount,
  dragOverFolder,
  setDragOverFolder,
  onSelectFolder,
  onSelectTag,
  onFolderDrop,
}) => {
  return (
    <div className={styles.folderSection}>
      <button
        onClick={() => {
          onSelectFolder(SYSTEM_FOLDERS.ALL);
          onSelectTag(null);
        }}
        className={`${styles.navItem} ${activeFolder === SYSTEM_FOLDERS.ALL && !activeTag ? styles.navItemActive : ''}`}
      >
        <span className={styles.navLeft}>
          <BsJournalBookmark size={16} className={styles.primaryIcon} />
          <span>All Notes</span>
        </span>
        <span className={styles.navCount}>{allCount}</span>
      </button>
      <button
        onClick={() => {
          onSelectFolder(SYSTEM_FOLDERS.QUICK_NOTES);
          onSelectTag(null);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          setDragOverFolder('Quick Notes');
        }}
        onDragLeave={() => setDragOverFolder(null)}
        onDrop={(e) => onFolderDrop(e, 'Quick Notes')}
        className={`${styles.navItem} ${
          dragOverFolder === 'Quick Notes'
            ? styles.dragOver
            : activeFolder === SYSTEM_FOLDERS.QUICK_NOTES && !activeTag
              ? styles.navItemActive
              : ''
        }`}
      >
        <span className={styles.navLeft}>
          <FiFolder size={16} className={styles.primaryIcon} />
          <span>Quick Notes</span>
        </span>
        <span className={styles.navCount}>{quickNotesCount}</span>
      </button>
      <button
        onClick={() => {
          onSelectFolder(SYSTEM_FOLDERS.PINNED);
          onSelectTag(null);
        }}
        className={`${styles.navItem} ${activeFolder === SYSTEM_FOLDERS.PINNED && !activeTag ? styles.navItemActive : ''}`}
      >
        <span className={styles.navLeft}>
          <BsPinFill size={16} className={styles.primaryIcon} />
          <span>Pinned</span>
        </span>
        <span className={styles.navCount}>{pinnedCount}</span>
      </button>
    </div>
  );
};
