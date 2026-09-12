'use client';
import React, { useState } from 'react';
import {
  FiFolder,
  FiFolderPlus,
  FiTrash2,
  FiTag,
  FiEdit2,
  FiX,
  FiCheck,
  FiChevronDown,
  FiChevronRight,
  FiEdit3,
  FiShield,
} from 'react-icons/fi';
import { BsPinFill, BsJournalBookmark, BsCloudArrowUp } from 'react-icons/bs';
import { Note, SYSTEM_FOLDERS, extractHashtags } from './NotesTypes';
import styles from './NotesSidebar.module.scss';
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
  onMoveNoteToFolder,
  isOpen,
  onClose,
  onCloseMobile,
  onOpenBackupModal,
  onOpenSecurityModal,
  onNewNote,
  isMobileScreen,
}) => {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [foldersCollapsed, setFoldersCollapsed] = useState(false);
  const [tagsCollapsed, setTagsCollapsed] = useState(false);
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
      const hashtags = extractHashtags(note.title + ' ' + note.content);
      const combined = Array.from(new Set([...(note.tags || []), ...hashtags]));
      combined.forEach((t) => {
        const clean = t.toLowerCase();
        tagCounts[clean] = (tagCounts[clean] || 0) + 1;
      });
    });
  const allTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    onCreateFolder(newFolderName.trim());
    setNewFolderName('');
    setIsCreatingFolder(false);
  };
  const handleSaveRename = (oldName: string) => {
    if (renameValue.trim() && renameValue.trim() !== oldName) {
      onRenameFolder(oldName, renameValue.trim());
    }
    setEditingFolder(null);
    setRenameValue('');
  };
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
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logoBox}>
            📝
          </div>
          <div>
            <span className={styles.title}>
              {isMobileScreen ? 'Folders' : 'Quick Notes'}
            </span>
            {isMobileScreen && (
              <span className={styles.subtitle}>All Folders &amp; Tags</span>
            )}
          </div>
        </div>
        <div className={styles.headerActions}>
          {onOpenBackupModal && (
            <button
              onClick={onOpenBackupModal}
              className={styles.iconBtn}
              title="Backup & Restore (Google Drive / OneDrive)"
            >
              <BsCloudArrowUp size={16} />
            </button>
          )}
          {(onClose || onCloseMobile) && (
            <button
              onClick={onClose || onCloseMobile}
              className={styles.closeBtn}
              title={isMobileScreen ? 'Back to notes' : 'Close sidebar'}
              aria-label={isMobileScreen ? 'Back to notes' : 'Close sidebar'}
            >
              <FiX size={16} />
            </button>
          )}
        </div>
      </div>
      <div className={`${styles.scrollContent} qn-scrollbar`}>
        <div className={styles.folderSection}>
          <button
            onClick={() => {
              onSelectFolder(SYSTEM_FOLDERS.ALL);
              onSelectTag(null);
            }}
            className={`${styles.navItem} ${activeFolder === SYSTEM_FOLDERS.ALL && !activeTag ? styles.navItemActive : ''}`}
          >
            <span className={styles.navLeft}>
              <BsJournalBookmark size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
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
            onDrop={(e) => handleFolderDrop(e, 'Quick Notes')}
            className={`${styles.navItem} ${
              dragOverFolder === 'Quick Notes'
                ? styles.dragOver
                : activeFolder === SYSTEM_FOLDERS.QUICK_NOTES && !activeTag
                  ? styles.navItemActive
                  : ''
            }`}
          >
            <span className={styles.navLeft}>
              <FiFolder size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
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
              <BsPinFill size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              <span>Pinned</span>
            </span>
            <span className={styles.navCount}>{pinnedCount}</span>
          </button>
        </div>
        <div>
          <div className={styles.sectionHeader}>
            <button
              onClick={() => setFoldersCollapsed(!foldersCollapsed)}
              className={styles.sectionToggle}
            >
              {foldersCollapsed ? (
                <FiChevronRight size={12} />
              ) : (
                <FiChevronDown size={12} />
              )}
              <span>Folders</span>
            </button>
            <button
              onClick={() => setIsCreatingFolder(true)}
              className={styles.folderActionBtn}
              title="New Folder"
            >
              <FiFolderPlus size={16} />
            </button>
          </div>
          {!foldersCollapsed && (
            <div className={styles.folderSection} style={{ marginTop: '0.25rem' }}>
              {isCreatingFolder && (
                <form onSubmit={handleCreateFolder} className={styles.folderForm}>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Folder name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className={styles.folderInput}
                    onKeyDown={(e) => e.key === 'Escape' && setIsCreatingFolder(false)}
                  />
                  <button type="submit" className={styles.folderConfirmBtn}>
                    <FiCheck size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingFolder(false)}
                    className={styles.folderCancelBtn}
                  >
                    <FiX size={16} />
                  </button>
                </form>
              )}
              {folders.map((folder) => {
                const isEditing = editingFolder === folder;
                const isCurrent = activeFolder === folder && !activeTag;
                const isDragOver = dragOverFolder === folder;
                const count = getFolderCount(folder);
                if (isEditing) {
                  return (
                    <div key={folder} className={styles.folderForm}>
                      <input
                        type="text"
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => handleSaveRename(folder)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(folder);
                          if (e.key === 'Escape') setEditingFolder(null);
                        }}
                        className={styles.folderInput}
                      />
                      <button
                        onClick={() => handleSaveRename(folder)}
                        className={styles.folderConfirmBtn}
                      >
                        <FiCheck size={14} />
                      </button>
                      <button
                        onClick={() => setEditingFolder(null)}
                        className={styles.folderCancelBtn}
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  );
                }
                return (
                  <div
                    key={folder}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      setDragOverFolder(folder);
                    }}
                    onDragLeave={() => setDragOverFolder(null)}
                    onDrop={(e) => handleFolderDrop(e, folder)}
                    className={`${styles.folderRow} ${
                      isDragOver
                        ? styles.dragOver
                        : isCurrent
                          ? styles.navItemActive
                          : ''
                    }`}
                  >
                    <button
                      onClick={() => {
                        onSelectFolder(folder);
                        onSelectTag(null);
                      }}
                      className={styles.folderRowBtn}
                    >
                      <FiFolder
                        size={16}
                        style={{ flexShrink: 0, color: isCurrent ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}
                      />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folder}</span>
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span className={styles.navCount}>
                        {count}
                      </span>
                      <div className={styles.folderHoverActions}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingFolder(folder);
                            setRenameValue(folder);
                          }}
                          className={styles.actionIcon}
                          title="Rename Folder"
                        >
                          <FiEdit2 size={12} />
                        </button>
                        {folder !== 'Notes' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                window.confirm(
                                  `Delete folder "${folder}"? Notes will move to Quick Notes.`
                                )
                              ) {
                                onDeleteFolder(folder);
                              }
                            }}
                            className={`${styles.actionIcon} ${styles.danger}`}
                            title="Delete Folder"
                          >
                            <FiTrash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {allTags.length > 0 && (
          <div>
            <div className={styles.sectionHeader}>
              <button
                onClick={() => setTagsCollapsed(!tagsCollapsed)}
                className={styles.sectionToggle}
              >
                {tagsCollapsed ? (
                  <FiChevronRight size={12} />
                ) : (
                  <FiChevronDown size={12} />
                )}
                <span>Tags</span>
              </button>
              <span style={{ fontSize: '10px', opacity: 0.4 }}>{allTags.length}</span>
            </div>
            {!tagsCollapsed && (
              <div className={styles.folderSection} style={{ marginTop: '0.25rem' }}>
                {allTags.map(([tag, count]) => {
                  const isCurrent = activeTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => onSelectTag(isCurrent ? null : tag)}
                      className={`${styles.navItem} ${isCurrent ? styles.navItemActive : ''}`}
                      style={{ fontSize: '0.75rem', minHeight: '36px' }}
                    >
                      <span className={styles.navLeft}>
                        <FiTag size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                        <span>#{tag}</span>
                      </span>
                      <span className={styles.navCount}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
        <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={() => {
              onSelectFolder(SYSTEM_FOLDERS.TRASH);
              onSelectTag(null);
            }}
            className={`${styles.navItem} ${styles.navItemDanger} ${activeFolder === SYSTEM_FOLDERS.TRASH && !activeTag ? styles.navItemActive : ''}`}
          >
            <span className={styles.navLeft}>
              <FiTrash2 size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
              <span>Recently Deleted</span>
            </span>
            {trashedCount > 0 && (
              <span className={`${styles.badge} ${styles.badgeError}`}>
                {trashedCount}
              </span>
            )}
          </button>
        </div>
        <div style={{ paddingTop: '0.625rem', borderTop: '1px solid var(--color-border)', marginTop: '0.25rem' }}>
          <button
            onClick={onOpenSecurityModal}
            className={styles.securityBanner}
            title="End-to-End Encrypted (AES-256-GCM): Click to view details"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 700, fontSize: '12px', color: '#16a34a' }}>
                <FiShield size={14} style={{ flexShrink: 0 }} />
                <span>End-to-End Encrypted</span>
              </span>
              <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                AES-256
              </span>
            </div>
            <p style={{ fontSize: '11px', lineHeight: 1.25, opacity: 0.7, margin: 0 }}>
              Notes are encrypted on your device before syncing. Only you hold the key.
            </p>
          </button>
        </div>
      </div>
      {isMobileScreen && onNewNote && (
        <button
          onClick={onNewNote}
          className={styles.newNoteBtn}
        >
          <FiEdit3 size={16} />
          New Note
        </button>
      )}
    </aside>
  );
};
