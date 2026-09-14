'use client';
import React, { useState } from 'react';
import {
  FiSearch,
  FiX,
  FiList,
  FiGrid,
  FiEdit3,
  FiTrash2,
  FiCopy,
  FiRotateCcw,
  FiChevronLeft,
  FiFolder,
  FiShield,
  FiMenu,
} from 'react-icons/fi';
import { BsPinFill, BsPin, BsLockFill, BsCloudArrowUp } from 'react-icons/bs';
import {
  Note,
  ViewMode,
  SortOption,
  SYSTEM_FOLDERS,
  formatNoteDate,
  extractSnippet,
  extractHashtags,
  deriveAutoTitleFromHtml,
} from './NotesTypes';
import { MoveNoteModal } from './MoveNoteModal';
import styles from './NotesList.module.scss';
import modalStyles from './NotesModal.module.scss';
interface NotesListProps {
  notes: Note[];
  selectedNoteId: string | null;
  activeFolder: string;
  activeTag: string | null;
  searchQuery: string;
  viewMode: ViewMode;
  sortOption: SortOption;
  folders: string[];
  onSelectNote: (note: Note) => void;
  onNewNote: () => void;
  onSearchChange: (query: string) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onSortChange: (sort: SortOption) => void;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  onDeleteNote: (id: string, e?: React.MouseEvent) => void;
  onPermanentDelete?: (id: string) => void;
  onDuplicateNote: (note: Note, e: React.MouseEvent) => void;
  onRestoreNote: (id: string, e: React.MouseEvent) => void;
  onEmptyTrash: () => void;
  onMoveNoteToFolder: (noteId: string, targetFolder: string) => void;
  onCreateFolder: (name: string) => void;
  onBackToFolders?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  onOpenBackupModal?: () => void;
  onOpenSecurityModal?: () => void;
  isMobileScreen?: boolean;
}
export const NotesList: React.FC<NotesListProps> = ({
  notes,
  selectedNoteId,
  activeFolder,
  activeTag,
  searchQuery,
  viewMode,
  sortOption,
  folders,
  onSelectNote,
  onNewNote,
  onSearchChange,
  onViewModeChange,
  onSortChange,
  onTogglePin,
  onDeleteNote,
  onPermanentDelete,
  onDuplicateNote,
  onRestoreNote,
  onEmptyTrash,
  onMoveNoteToFolder,
  onCreateFolder,
  onBackToFolders,
  onToggleSidebar,
  isSidebarOpen,
  onOpenBackupModal,
  onOpenSecurityModal,
  isMobileScreen,
}) => {
  const isTrash = activeFolder === SYSTEM_FOLDERS.TRASH;
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [noteToMove, setNoteToMove] = useState<Note | null>(null);
  const filteredNotes = notes.filter((note) => {
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
  const sortedNotes = [...filteredNotes].sort((a, b) => {
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
  const pinnedNotes = sortedNotes.filter((n) => n.is_pinned);
  const unpinnedNotes = sortedNotes.filter((n) => !n.is_pinned);
  const getHeaderTitle = () => {
    if (activeTag) return `#${activeTag}`;
    if (activeFolder === SYSTEM_FOLDERS.ALL) return 'All Notes';
    if (activeFolder === SYSTEM_FOLDERS.QUICK_NOTES) return 'Quick Notes';
    if (activeFolder === SYSTEM_FOLDERS.PINNED) return 'Pinned Notes';
    if (activeFolder === SYSTEM_FOLDERS.TRASH) return 'Recently Deleted';
    return activeFolder;
  };
  const handleConfirmDelete = () => {
    if (noteToDelete) {
      if (isTrash) {
        if (onPermanentDelete) {
          onPermanentDelete(noteToDelete.id);
        } else {
          onDeleteNote(noteToDelete.id);
        }
      } else {
        onDeleteNote(noteToDelete.id);
      }
      setNoteToDelete(null);
    }
  };
  const renderNoteCard = (note: Note) => {
    const isSelected = note.id === selectedNoteId;
    const title = note.title?.trim() || deriveAutoTitleFromHtml(note.content) || 'New Note';
    const snippet = note.is_locked ? 'Locked Note' : extractSnippet(note.content);
    const dateFormatted = formatNoteDate(note.updated_at || note.created_at);
    const hashtags = extractHashtags(note.title + ' ' + note.content);
    const noteTags = Array.from(new Set([...(note.tags || []), ...hashtags])).slice(0, 3);
    const displayFolder = note.folder || 'Quick Notes';
    return (
      <div
        key={note.id}
        draggable={!note.is_trashed}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', note.id);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onClick={() => onSelectNote(note)}
        className={`${styles.noteCard} ${isSelected ? styles.noteCardSelected : ''}`}
      >
        <div className={styles.cardHeader}>
          <h3
            className={`${styles.cardTitle} ${isSelected ? styles.cardTitleSelected : ''}`}
          >
            {title}
          </h3>
          <div className={styles.cardHeaderIcons}>
            {note.is_locked && (
              <span title="Locked Note" className={styles.lockIcon}>
                <BsLockFill size={14} />
              </span>
            )}
            {note.is_pinned && (
              <span title="Pinned Note" className={styles.pinIcon}>
                <BsPinFill size={14} />
              </span>
            )}
          </div>
        </div>
        <div className={styles.cardMeta}>
          <span
            className={`${styles.cardDate} ${isSelected ? styles.cardDateSelected : ''}`}
          >
            {dateFormatted}
          </span>
          <span className={styles.cardSnippet}>{snippet}</span>
        </div>
        <div className={styles.cardTagsRow}>
          {displayFolder && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isTrash) setNoteToMove(note);
              }}
              className={styles.folderBadge}
              title="Click to move folder"
            >
              📁 {displayFolder}
            </button>
          )}
          {noteTags.map((t) => (
            <span
              key={t}
              className={styles.tagBadge}
            >
              #{t}
            </span>
          ))}
        </div>
        <div className={styles.floatingActions}>
          {!isTrash && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setNoteToMove(note);
                }}
                className={styles.floatingBtn}
                title="Move to Folder"
              >
                <FiFolder size={12} />
              </button>
              <button
                onClick={(e) => onTogglePin(note.id, e)}
                className={`${styles.floatingBtn} ${note.is_pinned ? styles.pinnedFloatingBtn : ''}`}
                title={note.is_pinned ? 'Unpin' : 'Pin to top'}
              >
                {note.is_pinned ? <BsPinFill size={12} /> : <BsPin size={12} />}
              </button>
              <button
                onClick={(e) => onDuplicateNote(note, e)}
                className={styles.floatingBtn}
                title="Duplicate note"
              >
                <FiCopy size={12} />
              </button>
            </>
          )}
          {isTrash ? (
            <div className={styles.trashActions}>
              <button
                onClick={(e) => onRestoreNote(note.id, e)}
                className={`${styles.floatingBtn} ${styles.success}`}
                title="Restore Note"
              >
                <FiRotateCcw size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setNoteToDelete(note);
                }}
                className={`${styles.floatingBtn} ${styles.danger}`}
                title="Delete Permanently"
              >
                <FiTrash2 size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setNoteToDelete(note);
              }}
              className={`${styles.floatingBtn} ${styles.danger}`}
              title="Move to Trash"
            >
              <FiTrash2 size={12} />
            </button>
          )}
        </div>
      </div>
    );
  };
  return (
    <div
      className={`${styles.container} ${isMobileScreen ? styles.mobile : styles.desktop}`}
      aria-label="Notes List Column"
    >
      <div className={styles.topBar}>
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            {onBackToFolders && isMobileScreen && (
              <button
                onClick={onBackToFolders}
                className={styles.backBtn}
              >
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
            <h2 className={styles.headerTitle}>
              {getHeaderTitle()}
            </h2>
            <span className={styles.badge}>
              {filteredNotes.length}
            </span>
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
              {viewMode === 'list' ? (
                <FiGrid size={16} />
              ) : (
                <FiList size={16} />
              )}
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
        <div className={styles.searchBox}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search all notes, tags, checklists..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className={styles.clearBtn}
            >
              <FiX size={14} />
            </button>
          )}
        </div>
        <div className={styles.subBar}>
          <div className={styles.sortWrapper}>
            <span>Sort by:</span>
            <select
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className={styles.sortSelect}
            >
              <option value="updated_desc">Date Edited</option>
              <option value="created_desc">Date Created</option>
              <option value="title_asc">Title</option>
            </select>
          </div>
          {isTrash && filteredNotes.length > 0 && (
            <button
              onClick={onEmptyTrash}
              className={styles.emptyTrashBtn}
            >
              Empty Trash
            </button>
          )}
          {!isTrash && onOpenSecurityModal && (
            <button
              type="button"
              onClick={onOpenSecurityModal}
              className={styles.securityBtn}
              title="End-to-End Encrypted with AES-256-GCM: Zero-Knowledge Privacy"
            >
              <FiShield size={12} />
              <span>E2E Encrypted</span>
            </button>
          )}
        </div>
      </div>
      <div className={`${styles.listContent} qn-scrollbar`}>
        {filteredNotes.length === 0 ? (
          <div className={styles.emptyState}>
            <FiEdit3 size={32} className={styles.emptyStateIcon} />
            <p className={styles.emptyStateText}>
              {searchQuery
                ? 'No matching notes found'
                : isTrash
                  ? 'Trash is empty'
                  : 'No notes in this folder'}
            </p>
            {!isTrash && !searchQuery && (
              <button onClick={onNewNote} className={modalStyles.btnPrimary}>
                Create a Note
              </button>
            )}
          </div>
        ) : viewMode === 'gallery' ? (
          <div className={styles.galleryGrid}>
            {sortedNotes.map((note) => {
              const isSelected = note.id === selectedNoteId;
              const title = note.title?.trim() || deriveAutoTitleFromHtml(note.content) || 'New Note';
              const snippet = note.is_locked ? 'Locked Note' : extractSnippet(note.content);
              return (
                <div
                  key={note.id}
                  draggable={!note.is_trashed}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', note.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onClick={() => onSelectNote(note)}
                  className={`${styles.galleryCard} ${isSelected ? styles.gallerySelected : ''}`}
                >
                  <div>
                    <div className={styles.galleryCardHeader}>
                      <h4
                        className={`${styles.cardTitle} ${styles.galleryCardTitle} ${isSelected ? styles.cardTitleSelected : ''}`}
                      >
                        {title}
                      </h4>
                      <div className={styles.galleryCardHeaderActions}>
                        {note.is_pinned && <BsPinFill size={12} className={styles.pinIcon} />}
                        {isTrash ? (
                          <div className={styles.trashActions}>
                            <button
                              onClick={(e) => onRestoreNote(note.id, e)}
                              className={`${styles.floatingBtn} ${styles.success}`}
                              title="Restore Note"
                            >
                              <FiRotateCcw size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setNoteToDelete(note);
                              }}
                              className={`${styles.floatingBtn} ${styles.danger}`}
                              title="Delete Permanently"
                            >
                              <FiTrash2 size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setNoteToDelete(note);
                            }}
                            className={`${styles.floatingBtn} ${styles.danger}`}
                            title="Delete note"
                          >
                            <FiTrash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className={styles.gallerySnippet}>
                      {snippet}
                    </p>
                  </div>
                  <div className={styles.galleryFooter}>
                    <span className={styles.galleryDate}>
                      {formatNoteDate(note.updated_at || note.created_at)}
                    </span>
                    {!isTrash && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setNoteToMove(note);
                        }}
                        className={styles.galleryFolderBtn}
                        title="Move to Folder"
                      >
                        <FiFolder size={10} />
                        <span className={styles.galleryFolderText}>
                          {note.folder || 'Quick Notes'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <>
            {pinnedNotes.length > 0 && (
              <div className={styles.pinnedSection}>
                <div className={styles.sectionTitleHeader}>
                  <BsPinFill size={10} className={styles.pinIcon} />
                  <span>Pinned</span>
                </div>
                <div className={styles.notesColumn}>
                  {pinnedNotes.map(renderNoteCard)}
                </div>
              </div>
            )}
            {unpinnedNotes.length > 0 && (
              <div>
                {pinnedNotes.length > 0 && (
                  <div className={styles.notesSectionHeader}>
                    Notes
                  </div>
                )}
                <div className={styles.notesColumn}>
                  {unpinnedNotes.map(renderNoteCard)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {noteToDelete && (
        <div className={modalStyles.modalOverlay}>
          <div className={`${modalStyles.modalBox} ${modalStyles.modalBoxSm} ${styles.deleteModalBox}`}>
            <h3 className={`${modalStyles.modalTitle} ${styles.deleteModalTitle}`}>
              <FiTrash2 size={20} />
              {isTrash ? 'Permanently Delete Note' : 'Move to Trash'}
            </h3>
            <p className={`${modalStyles.helperText} ${styles.deleteModalText}`}>
              {isTrash ? (
                <>
                  Are you sure you want to permanently delete{' '}
                  <strong>"{noteToDelete.title || deriveAutoTitleFromHtml(noteToDelete.content) || 'Untitled Note'}"</strong>? This will remove it
                  completely from your database and cloud storage. This action cannot be undone.
                </>
              ) : (
                <>
                  Are you sure you want to move{' '}
                  <strong>"{noteToDelete.title || deriveAutoTitleFromHtml(noteToDelete.content) || 'Untitled Note'}"</strong> to Recently Deleted?
                </>
              )}
            </p>
            <div className={styles.modalActionsRow}>
              <button
                onClick={() => setNoteToDelete(null)}
                className={modalStyles.btnGhost}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className={`${modalStyles.btnPrimary} ${styles.deleteConfirmBtn}`}
              >
                {isTrash ? 'Delete Permanently' : 'Move to Trash'}
              </button>
            </div>
          </div>
        </div>
      )}
      <MoveNoteModal
        isOpen={Boolean(noteToMove)}
        note={noteToMove}
        folders={folders}
        onClose={() => setNoteToMove(null)}
        onMove={(id, targetFolder) => onMoveNoteToFolder(id, targetFolder)}
        onCreateFolder={onCreateFolder}
      />
    </div>
  );
};
