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
} from './NotesTypes';
import { MoveNoteModal } from './MoveNoteModal';
import { AiFillFileAdd } from 'react-icons/ai';
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
      const titleMatch = (note.title || '').toLowerCase().includes(q);
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
      return (a.title || 'Untitled').localeCompare(b.title || 'Untitled');
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
    const title = note.title?.trim() || 'New Note';
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
            {note.is_locked && (
              <span title="Locked Note" style={{ opacity: 0.6 }}>
                <BsLockFill size={14} />
              </span>
            )}
            {note.is_pinned && (
              <span title="Pinned Note" style={{ color: 'var(--color-primary)' }}>
                <BsPinFill size={14} />
              </span>
            )}
          </div>
        </div>
        <div className={styles.cardMeta}>
          <span
            className={styles.cardDate}
            style={{ color: isSelected ? 'var(--color-primary)' : undefined }}
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
                className={styles.floatingBtn}
                style={{ color: note.is_pinned ? 'var(--color-primary)' : undefined }}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
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
              <AiFillFileAdd
                onClick={onNewNote}
                className={styles.addIconBtn}
                title="Compose New Note"
              />
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
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
              style={{ color: '#ef4444', textDecoration: 'underline', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
            >
              Empty Trash
            </button>
          )}
          {!isTrash && onOpenSecurityModal && (
            <button
              type="button"
              onClick={onOpenSecurityModal}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '10.5px', color: '#16a34a', textDecoration: 'underline', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 500 }}
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
            <FiEdit3 size={32} style={{ opacity: 0.3 }} />
            <p style={{ margin: 0, fontWeight: 500 }}>
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
              const title = note.title?.trim() || 'New Note';
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.25rem', marginBottom: '0.25rem' }}>
                      <h4
                        className={`${styles.cardTitle} ${isSelected ? styles.cardTitleSelected : ''}`}
                        style={{ fontSize: '0.75rem' }}
                      >
                        {title}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                        {note.is_pinned && <BsPinFill size={12} style={{ color: 'var(--color-primary)' }} />}
                        {isTrash ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
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
                    <p style={{ fontSize: '11px', opacity: 0.5, margin: 0, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {snippet}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.25rem', paddingTop: '0.25rem', borderTop: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '10px', opacity: 0.5, fontWeight: 500 }}>
                      {formatNoteDate(note.updated_at || note.created_at)}
                    </span>
                    {!isTrash && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setNoteToMove(note);
                        }}
                        style={{ fontSize: '10px', color: 'var(--color-primary)', textDecoration: 'underline', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                        title="Move to Folder"
                      >
                        <FiFolder size={10} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60px' }}>
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
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ padding: '0.25rem 0.5rem', fontSize: '10px', fontWeight: 700, opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <BsPinFill size={10} style={{ color: 'var(--color-primary)' }} />
                  <span>Pinned</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {pinnedNotes.map(renderNoteCard)}
                </div>
              </div>
            )}
            {unpinnedNotes.length > 0 && (
              <div>
                {pinnedNotes.length > 0 && (
                  <div style={{ padding: '0.5rem 0.5rem 0.25rem', fontSize: '10px', fontWeight: 700, opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Notes
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {unpinnedNotes.map(renderNoteCard)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {noteToDelete && (
        <div className={modalStyles.modalOverlay}>
          <div className={`${modalStyles.modalBox} ${modalStyles.modalBoxSm}`} style={{ padding: '1.25rem' }}>
            <h3 className={modalStyles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
              <FiTrash2 size={20} />
              {isTrash ? 'Permanently Delete Note' : 'Move to Trash'}
            </h3>
            <p className={modalStyles.helperText} style={{ marginTop: '0.5rem' }}>
              {isTrash ? (
                <>
                  Are you sure you want to permanently delete{' '}
                  <strong>"{noteToDelete.title || 'Untitled Note'}"</strong>? This will remove it
                  completely from your database and cloud storage. This action cannot be undone.
                </>
              ) : (
                <>
                  Are you sure you want to move{' '}
                  <strong>"{noteToDelete.title || 'Untitled Note'}"</strong> to Recently Deleted?
                </>
              )}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                onClick={() => setNoteToDelete(null)}
                className={modalStyles.btnGhost}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className={modalStyles.btnPrimary}
                style={{ background: '#ef4444' }}
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
