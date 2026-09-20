'use client';
import React from 'react';
import {
  FiList,
  FiGrid,
  FiEdit3,
  FiChevronLeft,
  FiShield,
  FiMenu,
} from 'react-icons/fi';
import { BsCloudArrowUp } from 'react-icons/bs';
import { ViewMode, SortOption, SYSTEM_FOLDERS } from '../NotesTypes';
import styles from '../NotesList.module.scss';
import { NotesListSubBar } from './NotesListSubBar';
import { NotesListSearchBar } from './NotesListSearchBar';
interface NotesListHeaderProps {
  activeFolder: string;
  activeTag: string | null;
  count: number;
  searchQuery: string;
  viewMode: ViewMode;
  sortOption: SortOption;
  isTrash: boolean;
  isSidebarOpen?: boolean;
  isMobileScreen?: boolean;
  onSearchChange: (q: string) => void;
  onViewModeChange: (m: ViewMode) => void;
  onSortChange: (s: SortOption) => void;
  onNewNote: () => void;
  onEmptyTrash: () => void;
  onBackToFolders?: () => void;
  onToggleSidebar?: () => void;
  onOpenBackupModal?: () => void;
  onOpenSecurityModal?: () => void;
}
export const NotesListHeader: React.FC<NotesListHeaderProps> = ({
  activeFolder,
  activeTag,
  count,
  searchQuery,
  viewMode,
  sortOption,
  isTrash,
  isSidebarOpen,
  isMobileScreen,
  onSearchChange,
  onViewModeChange,
  onSortChange,
  onNewNote,
  onEmptyTrash,
  onBackToFolders,
  onToggleSidebar,
  onOpenBackupModal,
  onOpenSecurityModal,
}) => {
  const getHeaderTitle = () => {
    if (activeTag) return `#${activeTag}`;
    if (activeFolder === SYSTEM_FOLDERS.ALL) return 'All Notes';
    if (activeFolder === SYSTEM_FOLDERS.QUICK_NOTES) return 'Quick Notes';
    if (activeFolder === SYSTEM_FOLDERS.PINNED) return 'Pinned Notes';
    if (activeFolder === SYSTEM_FOLDERS.TRASH) return 'Recently Deleted';
    return activeFolder;
  };
  return (
    <div className={styles.topBar}>
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          {onBackToFolders && isMobileScreen && (
            <button onClick={onBackToFolders} className={styles.backBtn}>
              <FiChevronLeft size={20} />
              <span>Folders</span>
            </button>
          )}
          {!isMobileScreen && !isSidebarOpen && onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className={styles.backBtn}
              title="Open Folders sidebar"
              aria-label="Open Folders sidebar"
            >
              <FiMenu size={16} />
              <span>Folders</span>
            </button>
          )}
          <h2 className={styles.headerTitle}>{getHeaderTitle()}</h2>
          <span className={styles.badge}>{count}</span>
        </div>
        <div className={styles.headerActions}>
          {onOpenSecurityModal && (
            <button
              onClick={onOpenSecurityModal}
              className={`${styles.iconBtn} ${styles.btnSuccess}`}
              title="End-to-End Encrypted (AES-256-GCM): Security Details"
            >
              <FiShield size={16} />
            </button>
          )}
          {onOpenBackupModal && (
            <button
              onClick={onOpenBackupModal}
              className={`${styles.iconBtn} ${styles.btnPrimary}`}
              title="Backup & Restore (Google Drive / OneDrive)"
            >
              <BsCloudArrowUp size={16} />
            </button>
          )}
          <button
            onClick={() => onViewModeChange(viewMode === 'list' ? 'gallery' : 'list')}
            className={styles.iconBtn}
            title={viewMode === 'list' ? 'Switch to Gallery view' : 'Switch to List view'}
          >
            {viewMode === 'list' ? <FiGrid size={16} /> : <FiList size={16} />}
          </button>
          {!isTrash && (
            <button
              type="button"
              onClick={onNewNote}
              className={styles.addIconBtn}
              title="Compose New Note (Cmd+N)"
              aria-label="Compose New Note"
            >
              <FiEdit3 size={15} />
            </button>
          )}
        </div>
      </div>
      <NotesListSearchBar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
      />
      <NotesListSubBar
        sortOption={sortOption}
        onSortChange={onSortChange}
        isTrash={isTrash}
        count={count}
        onEmptyTrash={onEmptyTrash}
        onOpenSecurityModal={onOpenSecurityModal}
      />
    </div>
  );
};
