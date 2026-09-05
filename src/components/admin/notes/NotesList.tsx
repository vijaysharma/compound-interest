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
  onDuplicateNote: (note: Note, e: React.MouseEvent) => void;
  onRestoreNote: (id: string, e: React.MouseEvent) => void;
  onEmptyTrash: () => void;
  onMoveNoteToFolder: (noteId: string, targetFolder: string) => void;
  onCreateFolder: (name: string) => void;
  onBackToFolders?: () => void;
  onOpenBackupModal?: () => void;
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
  onDuplicateNote,
  onRestoreNote,
  onEmptyTrash,
  onMoveNoteToFolder,
  onCreateFolder,
  onBackToFolders,
  onOpenBackupModal,
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
      onDeleteNote(noteToDelete.id);
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
        className={`group relative p-3.5 rounded-xl cursor-pointer transition-all duration-150 border text-left select-none min-h-[58px] ${
          isSelected
            ? 'bg-primary/10 border-primary/40 shadow-xs'
            : 'bg-base-100 hover:bg-base-200/70 border-base-200 hover:border-base-300'
        }`}
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3
            className={`font-semibold text-sm sm:text-base truncate flex-1 ${
              isSelected ? 'text-primary font-bold' : 'text-base-content'
            }`}
          >
            {title}
          </h3>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {note.is_locked && (
              <span title="Locked Note" className="text-base-content/60">
                <BsLockFill className="w-3.5 h-3.5" />
              </span>
            )}
            {note.is_pinned && (
              <span title="Pinned Note" className="text-primary">
                <BsPinFill className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        </div>
        <div className="flex items-baseline gap-2 text-xs">
          <span
            className={`font-medium flex-shrink-0 ${
              isSelected ? 'text-primary' : 'text-base-content/60'
            }`}
          >
            {dateFormatted}
          </span>
          <span className="text-base-content/50 truncate flex-1">{snippet}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {displayFolder && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isTrash) setNoteToMove(note);
              }}
              className="badge badge-ghost badge-xs text-[10px] py-1 px-2 bg-base-300/60 hover:bg-primary/15 hover:text-primary rounded cursor-pointer transition-colors"
              title="Click to move folder"
            >
              📁 {displayFolder}
            </button>
          )}
          {noteTags.map((t) => (
            <span
              key={t}
              className="badge badge-ghost badge-xs text-[10px] py-1 px-2 text-primary bg-primary/10 rounded"
            >
              #{t}
            </span>
          ))}
        </div>
        <div className="absolute top-2 right-2 flex md:hidden md:group-hover:flex items-center gap-1 bg-base-100/95 px-1.5 py-0.5 rounded-lg shadow-xs border border-base-300">
          {!isTrash && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setNoteToMove(note);
                }}
                className="p-1 hover:text-primary text-base-content/60 rounded transition-colors"
                title="Move to Folder"
              >
                <FiFolder className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => onTogglePin(note.id, e)}
                className={`p-1 hover:text-primary rounded transition-colors ${
                  note.is_pinned ? 'text-primary' : 'text-base-content/60'
                }`}
                title={note.is_pinned ? 'Unpin' : 'Pin to top'}
              >
                {note.is_pinned ? <BsPinFill className="w-3 h-3" /> : <BsPin className="w-3 h-3" />}
              </button>
              <button
                onClick={(e) => onDuplicateNote(note, e)}
                className="p-1 hover:text-primary text-base-content/60 rounded transition-colors"
                title="Duplicate note"
              >
                <FiCopy className="w-3 h-3" />
              </button>
            </>
          )}
          {isTrash ? (
            <button
              onClick={(e) => onRestoreNote(note.id, e)}
              className="p-1 hover:text-success text-base-content/60 rounded transition-colors"
              title="Restore Note"
            >
              <FiRotateCcw className="w-3 h-3" />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setNoteToDelete(note);
              }}
              className="p-1 hover:text-error text-base-content/60 rounded transition-colors"
              title="Move to Trash"
            >
              <FiTrash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  };
  return (
    <div
      className={`flex flex-col h-full bg-base-100/60 select-none overflow-hidden ${
        isMobileScreen ? 'w-full' : 'w-full md:w-80 lg:w-88 flex-shrink-0'
      }`}
      aria-label="Notes List Column"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 truncate">
            {onBackToFolders && isMobileScreen && (
              <button
                onClick={onBackToFolders}
                className="btn btn-ghost btn-sm px-1.5 flex items-center gap-0.5 text-primary font-semibold min-h-[44px]"
              >
                <FiChevronLeft className="w-5 h-5" />
                <span>Folders</span>
              </button>
            )}
            <h2 className="font-bold text-base sm:text-lg text-base-content tracking-tight truncate">
              {getHeaderTitle()}
            </h2>
            <span className="badge badge-sm badge-ghost text-xs font-semibold">
              {filteredNotes.length}
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {onOpenBackupModal && (
              <button
                onClick={onOpenBackupModal}
                className="btn btn-ghost btn-xs btn-square text-primary hover:bg-primary/10 min-h-[36px] min-w-[36px]"
                title="Backup & Restore (Google Drive / OneDrive)"
              >
                <BsCloudArrowUp className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onViewModeChange(viewMode === 'list' ? 'gallery' : 'list')}
              className="btn btn-ghost btn-xs btn-square min-h-[36px] min-w-[36px]"
              title={viewMode === 'list' ? 'Switch to Gallery view' : 'Switch to List view'}
            >
              {viewMode === 'list' ? <FiGrid className="w-4 h-4" /> : <FiList className="w-4 h-4" />}
            </button>
            {!isTrash && (
              <button
                onClick={onNewNote}
                className="btn btn-primary btn-xs btn-square min-h-[36px] min-w-[36px]"
                title="Compose New Note"
              >
                <FiEdit3 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <div className="relative flex items-center">
          <FiSearch className="absolute left-3 w-4 h-4 text-base-content/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Search all notes, tags, checklists..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input input-sm input-bordered input-primary w-full pl-9 pr-8 rounded-xl bg-base-200/60 focus:bg-base-100 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 text-base-content/50 hover:text-base-content p-1"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between text-[11px] text-base-content/60 pt-0.5">
          <div className="flex items-center gap-2">
            <span className="grow w-[80px]">Sort by:</span>
            <select
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="select select-ghost select-xs text-[11px] font-semibold py-0 h-6 min-h-0 pl-1 pr-6"
            >
              <option value="updated_desc">Date Edited</option>
              <option value="created_desc">Date Created</option>
              <option value="title_asc">Title</option>
            </select>
          </div>
          {isTrash && filteredNotes.length > 0 && (
            <button
              onClick={onEmptyTrash}
              className="text-error hover:underline text-[11px] font-semibold"
            >
              Empty Trash
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto qn-scrollbar space-y-1">
        {filteredNotes.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-base-content/40 space-y-2">
            <FiEdit3 className="w-8 h-8 opacity-30" />
            <p className="text-sm font-medium">
              {searchQuery
                ? 'No matching notes found'
                : isTrash
                  ? 'Trash is empty'
                  : 'No notes in this folder'}
            </p>
            {!isTrash && !searchQuery && (
              <button
                onClick={onNewNote}
                className="btn btn-primary btn-xs mt-1"
              >
                Create a Note
              </button>
            )}
          </div>
        ) : viewMode === 'gallery' ? (
          <div className="grid grid-cols-2 gap-2 p-1">
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
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all aspect-square flex flex-col justify-between ${
                    isSelected
                      ? 'bg-primary/10 border-primary/40 shadow-xs'
                      : 'bg-base-100 hover:bg-base-200/70 border-base-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4
                        className={`font-semibold text-xs truncate ${
                          isSelected ? 'text-primary' : 'text-base-content'
                        }`}
                      >
                        {title}
                      </h4>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {note.is_pinned && <BsPinFill className="w-3 h-3 text-primary" />}
                        {!isTrash && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setNoteToDelete(note);
                            }}
                            className="p-0.5 text-base-content/40 hover:text-error rounded"
                            title="Delete note"
                          >
                            <FiTrash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-base-content/50 line-clamp-3 leading-snug">
                      {snippet}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-base-200/40">
                    <span className="text-[10px] text-base-content/40 font-medium">
                      {formatNoteDate(note.updated_at || note.created_at)}
                    </span>
                    {!isTrash && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setNoteToMove(note);
                        }}
                        className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                        title="Move to Folder"
                      >
                        <FiFolder className="w-2.5 h-2.5" />
                        <span className="truncate max-w-[60px]">{note.folder || 'Quick Notes'}</span>
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
              <div className="space-y-1 mb-3">
                <div className="px-2 pt-1 pb-0.5 text-[10px] font-bold text-base-content/40 uppercase tracking-wider flex items-center gap-1">
                  <BsPinFill className="w-2.5 h-2.5 text-primary" />
                  <span>Pinned</span>
                </div>
                {pinnedNotes.map(renderNoteCard)}
              </div>
            )}
            {unpinnedNotes.length > 0 && (
              <div className="space-y-1">
                {pinnedNotes.length > 0 && (
                  <div className="px-2 pt-2 pb-0.5 text-[10px] font-bold text-base-content/40 uppercase tracking-wider">
                    Notes
                  </div>
                )}
                {unpinnedNotes.map(renderNoteCard)}
              </div>
            )}
          </>
        )}
      </div>
      {noteToDelete && (
        <div className="modal modal-open z-50">
          <div className="modal-box max-w-sm rounded-2xl bg-base-100 p-5 shadow-2xl border border-base-300">
            <h3 className="font-bold text-base text-base-content flex items-center gap-2">
              <FiTrash2 className="text-error w-5 h-5" /> Move to Trash
            </h3>
            <p className="text-xs text-base-content/70 mt-2">
              Are you sure you want to move <strong>"{noteToDelete.title || 'Untitled Note'}"</strong> to Recently Deleted?
            </p>
            <div className="modal-action mt-4 flex justify-end gap-2">
              <button
                onClick={() => setNoteToDelete(null)}
                className="btn btn-ghost btn-sm text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="btn btn-error btn-sm text-xs text-white rounded-xl"
              >
                Move to Trash
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
