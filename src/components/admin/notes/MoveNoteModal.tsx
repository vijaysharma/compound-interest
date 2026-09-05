import React, { useState } from 'react';
import { FiFolder, FiFolderPlus, FiCheck, FiX } from 'react-icons/fi';
import { Note } from './NotesTypes';
interface MoveNoteModalProps {
  isOpen: boolean;
  note: Note | null;
  folders: string[];
  onClose: () => void;
  onMove: (noteId: string, folderName: string) => void;
  onCreateFolder: (name: string) => void;
}
export const MoveNoteModal: React.FC<MoveNoteModalProps> = ({
  isOpen,
  note,
  folders,
  onClose,
  onMove,
  onCreateFolder,
}) => {
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  if (!isOpen || !note) return null;
  // Combine system folders and custom folders
  const allFolderOptions = Array.from(new Set(['Quick Notes', ...folders]));
  const handleSelectFolder = (folder: string) => {
    onMove(note.id, folder);
    onClose();
  };
  const handleCreateAndMove = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newFolderName.trim();
    if (!clean) return;
    onCreateFolder(clean);
    onMove(note.id, clean);
    setNewFolderName('');
    setIsCreating(false);
    onClose();
  };
  return (
    <div className="modal modal-open z-50">
      <div className="modal-box max-w-sm rounded-2xl bg-base-100 p-5 shadow-2xl border border-base-300">
        <div className="flex items-center justify-between pb-3 border-b border-base-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
              <FiFolder className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-base-content leading-tight">Move to Folder</h3>
              <p className="text-[11px] text-base-content/60 truncate max-w-[200px]">
                {note.title || 'Untitled Note'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-xs btn-circle">
            <FiX className="w-4 h-4" />
          </button>
        </div>
        <div className="py-3 space-y-1 max-h-60 overflow-y-auto qn-scrollbar">
          {allFolderOptions.map((folder) => {
            const isCurrent = (note.folder || 'Quick Notes') === folder;
            return (
              <button
                key={folder}
                onClick={() => handleSelectFolder(folder)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isCurrent
                    ? 'bg-primary/15 text-primary font-semibold'
                    : 'hover:bg-base-200 text-base-content'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <FiFolder className={`w-4 h-4 flex-shrink-0 ${isCurrent ? 'text-primary' : 'text-base-content/50'}`} />
                  <span className="truncate">{folder}</span>
                </span>
                {isCurrent && <FiCheck className="w-4 h-4 text-primary flex-shrink-0" />}
              </button>
            );
          })}
        </div>
        <div className="pt-3 border-t border-base-200">
          {isCreating ? (
            <form onSubmit={handleCreateAndMove} className="flex items-center gap-1.5">
              <input
                type="text"
                autoFocus
                placeholder="New folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="input input-sm input-bordered input-primary flex-1 rounded-xl text-xs"
              />
              <button
                type="submit"
                disabled={!newFolderName.trim()}
                className="btn btn-primary btn-sm px-3 rounded-xl text-xs font-semibold"
              >
                Move
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="btn btn-ghost btn-sm px-2 rounded-xl text-xs"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="btn btn-ghost btn-sm w-full gap-2 text-xs text-primary font-semibold rounded-xl"
            >
              <FiFolderPlus className="w-4 h-4" />
              Create New Folder & Move
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
