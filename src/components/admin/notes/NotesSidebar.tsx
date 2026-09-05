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
      className={`flex flex-col h-full select-none transition-all duration-200 z-20 ${
        isMobileScreen ? 'w-full' : 'w-64 sm:w-60 md:w-64 flex-shrink-0'
      }`}
      aria-label="Notes Folders Sidebar"
    >
      <div className="flex mt-2 mb-4 items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-content shadow-xs font-bold text-sm">
            📝
          </div>
          <div>
            <span className="font-bold text-base tracking-tight block leading-tight">
              {isMobileScreen ? 'Folders' : 'Quick Notes'}
            </span>
            {isMobileScreen && (
              <span className="text-[11px] text-base-content/50">All Folders & Tags</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {onOpenBackupModal && (
            <button
              onClick={onOpenBackupModal}
              className="btn btn-ghost btn-sm btn-circle text-primary hover:bg-primary/10"
              title="Backup & Restore (Google Drive / OneDrive)"
            >
              <BsCloudArrowUp className="w-4 h-4" />
            </button>
          )}
          {onCloseMobile && !isMobileScreen && (
            <button
              onClick={onCloseMobile}
              className="btn btn-ghost btn-xs btn-circle lg:hidden"
              title="Close sidebar"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 mb-4 overflow-y-auto qn-scrollbar space-y-4">
        <div className="space-y-1">
          <button
            onClick={() => {
              onSelectFolder(SYSTEM_FOLDERS.ALL);
              onSelectTag(null);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm font-medium transition-colors ${
              activeFolder === SYSTEM_FOLDERS.ALL && !activeTag
                ? 'bg-primary/15 text-primary font-semibold shadow-xs'
                : 'hover:bg-base-300/60 text-base-content/85'
            }`}
          >
            <span className="flex items-center gap-3">
              <BsJournalBookmark className="w-4 h-4 text-primary flex-shrink-0" />
              <span>All Notes</span>
            </span>
            <span className="text-xs text-base-content/50 font-semibold">{allCount}</span>
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
            className={`w-full flex items-center justify-between px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm font-medium transition-colors ${
              dragOverFolder === 'Quick Notes'
                ? 'ring-2 ring-primary ring-inset bg-primary/25 scale-[1.02]'
                : activeFolder === SYSTEM_FOLDERS.QUICK_NOTES && !activeTag
                  ? 'bg-primary/15 text-primary font-semibold shadow-xs'
                  : 'hover:bg-base-300/60 text-base-content/85'
            }`}
          >
            <span className="flex items-center gap-3">
              <FiFolder className="w-4 h-4 text-primary flex-shrink-0" />
              <span>Quick Notes</span>
            </span>
            <span className="text-xs text-base-content/50 font-semibold">{quickNotesCount}</span>
          </button>
          <button
            onClick={() => {
              onSelectFolder(SYSTEM_FOLDERS.PINNED);
              onSelectTag(null);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm font-medium transition-colors ${
              activeFolder === SYSTEM_FOLDERS.PINNED && !activeTag
                ? 'bg-primary/15 text-primary font-semibold shadow-xs'
                : 'hover:bg-base-300/60 text-base-content/85'
            }`}
          >
            <span className="flex items-center gap-3">
              <BsPinFill className="w-4 h-4 text-primary flex-shrink-0" />
              <span>Pinned</span>
            </span>
            <span className="text-xs text-base-content/50 font-semibold">{pinnedCount}</span>
          </button>
        </div>
        <div>
          <div className="flex items-center justify-between px-2.5 py-1 text-xs font-semibold text-base-content/50 uppercase tracking-wider">
            <button
              onClick={() => setFoldersCollapsed(!foldersCollapsed)}
              className="flex items-center gap-1 hover:text-base-content transition-colors min-h-[32px]"
            >
              {foldersCollapsed ? (
                <FiChevronRight className="w-3 h-3" />
              ) : (
                <FiChevronDown className="w-3 h-3" />
              )}
              <span>Folders</span>
            </button>
            <button
              onClick={() => setIsCreatingFolder(true)}
              className="hover:text-primary transition-colors p-1.5 rounded-lg min-h-[32px] min-w-[32px] flex items-center justify-center"
              title="New Folder"
            >
              <FiFolderPlus className="w-4 h-4" />
            </button>
          </div>
          {!foldersCollapsed && (
            <div className="space-y-1 mt-1">
              {isCreatingFolder && (
                <form onSubmit={handleCreateFolder} className="px-2 py-1 flex items-center gap-1.5">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Folder name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="input input-sm input-bordered input-primary w-full rounded-lg text-sm"
                    onKeyDown={(e) => e.key === 'Escape' && setIsCreatingFolder(false)}
                  />
                  <button type="submit" className="btn btn-ghost btn-sm px-2 text-success">
                    <FiCheck className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingFolder(false)}
                    className="btn btn-ghost btn-sm px-2 text-error"
                  >
                    <FiX className="w-4 h-4" />
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
                    <div key={folder} className="px-2 py-1 flex items-center gap-1">
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
                        className="input input-sm input-bordered input-primary w-full rounded-lg text-sm"
                      />
                      <button
                        onClick={() => handleSaveRename(folder)}
                        className="btn btn-ghost btn-xs text-success"
                      >
                        <FiCheck className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingFolder(null)}
                        className="btn btn-ghost btn-xs text-error"
                      >
                        <FiX className="w-3.5 h-3.5" />
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
                    className={`group flex items-center justify-between px-3.5 py-2 min-h-[42px] rounded-xl text-sm font-medium transition-colors ${
                      isDragOver
                        ? 'ring-2 ring-primary ring-inset bg-primary/25 scale-[1.02]'
                        : isCurrent
                          ? 'bg-primary/15 text-primary font-semibold shadow-xs'
                          : 'hover:bg-base-300/60 text-base-content/85'
                    }`}
                  >
                    <button
                      onClick={() => {
                        onSelectFolder(folder);
                        onSelectTag(null);
                      }}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left truncate"
                    >
                      <FiFolder
                        className={`w-4 h-4 flex-shrink-0 ${isCurrent ? 'text-primary' : 'text-base-content/60'}`}
                      />
                      <span className="truncate">{folder}</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-base-content/50 font-semibold group-hover:hidden">
                        {count}
                      </span>
                      <div className="hidden group-hover:flex items-center gap-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingFolder(folder);
                            setRenameValue(folder);
                          }}
                          className="p-1 hover:text-primary rounded"
                          title="Rename Folder"
                        >
                          <FiEdit2 className="w-3 h-3" />
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
                            className="p-1 hover:text-error rounded"
                            title="Delete Folder"
                          >
                            <FiTrash2 className="w-3 h-3" />
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
            <div className="flex items-center justify-between px-2.5 py-1 text-xs font-semibold text-base-content/50 uppercase tracking-wider">
              <button
                onClick={() => setTagsCollapsed(!tagsCollapsed)}
                className="flex items-center gap-1 hover:text-base-content transition-colors min-h-[32px]"
              >
                {tagsCollapsed ? (
                  <FiChevronRight className="w-3 h-3" />
                ) : (
                  <FiChevronDown className="w-3 h-3" />
                )}
                <span>Tags</span>
              </button>
              <span className="text-[10px] text-base-content/40">{allTags.length}</span>
            </div>
            {!tagsCollapsed && (
              <div className="space-y-1 mt-1">
                {allTags.map(([tag, count]) => {
                  const isCurrent = activeTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => onSelectTag(isCurrent ? null : tag)}
                      className={`w-full flex items-center justify-between px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-medium transition-colors ${
                        isCurrent
                          ? 'bg-primary/15 text-primary font-semibold shadow-xs'
                          : 'hover:bg-base-300/60 text-base-content/80'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <FiTag className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="truncate">#{tag}</span>
                      </span>
                      <span className="text-[11px] text-base-content/50 font-semibold">{count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
        <div className="pt-2 border-t border-base-300/60">
          <button
            onClick={() => {
              onSelectFolder(SYSTEM_FOLDERS.TRASH);
              onSelectTag(null);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 min-h-[42px] rounded-xl text-sm font-medium transition-colors ${
              activeFolder === SYSTEM_FOLDERS.TRASH && !activeTag
                ? 'bg-error/15 text-error font-semibold shadow-xs'
                : 'hover:bg-base-300/60 text-base-content/75'
            }`}
          >
            <span className="flex items-center gap-3">
              <FiTrash2 className="w-4 h-4 text-error/80 flex-shrink-0" />
              <span>Recently Deleted</span>
            </span>
            {trashedCount > 0 && (
              <span className="badge badge-sm badge-error badge-outline text-[11px] font-bold">
                {trashedCount}
              </span>
            )}
          </button>
        </div>
        <div className="pt-2.5 border-t border-base-300/60 mt-1">
          <button
            onClick={onOpenSecurityModal}
            className="w-full text-left p-2.5 rounded-xl bg-success/10 hover:bg-success/15 border border-success/20 transition-all group cursor-pointer"
            title="End-to-End Encrypted (AES-256-GCM): Click to view details"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5 font-bold text-xs text-success">
                <FiShield className="w-3.5 h-3.5 flex-shrink-0" />
                <span>End-to-End Encrypted</span>
              </span>
              <span className="badge badge-success badge-xs text-[9px] font-bold">AES-256</span>
            </div>
            <p className="text-[11px] leading-tight text-base-content/70">
              Notes are encrypted on your device before syncing. Only you hold the key.
            </p>
          </button>
        </div>
      </div>
      {isMobileScreen && onNewNote && (
        <button
          onClick={onNewNote}
          className="btn btn-primary w-full gap-2 rounded-xl text-sm font-semibold shadow-sm"
        >
          <FiEdit3 className="w-4 h-4" />
          New Note
        </button>
      )}
    </aside>
  );
};
