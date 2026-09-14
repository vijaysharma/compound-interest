'use client';
import React, { useState } from 'react';
import { FiFolder, FiFolderPlus, FiCheck, FiX } from 'react-icons/fi';
import { Note } from './NotesTypes';
import styles from './NotesModal.module.scss';
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
    <div className={styles.modalOverlay}>
      <div className={`${styles.modalBox} ${styles.modalBoxSm}`}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalIconBox}>
              <FiFolder size={16} />
            </div>
            <div>
              <h3 className={styles.modalTitle}>Move to Folder</h3>
              <p className={styles.modalSubtitle}>
                {note.title || 'Untitled Note'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <FiX size={16} />
          </button>
        </div>
        <div className={styles.modalBodyPadded}>
          <div className={styles.folderList}>
            {allFolderOptions.map((folder) => {
              const isCurrent = (note.folder || 'Quick Notes') === folder;
              return (
                <button
                  key={folder}
                  onClick={() => handleSelectFolder(folder)}
                  className={`${styles.folderOption} ${isCurrent ? styles.folderCurrent : ''}`}
                >
                  <span className={styles.folderItemLeft}>
                    <FiFolder
                      size={16}
                      className={isCurrent ? styles.primaryIcon : styles.secondaryIcon}
                    />
                    <span className={styles.folderItemName}>{folder}</span>
                  </span>
                  {isCurrent && <FiCheck size={16} className={styles.primaryIcon} />}
                </button>
              );
            })}
          </div>
        </div>
        <div className={styles.modalFooter}>
          {isCreating ? (
            <form onSubmit={handleCreateAndMove} className={styles.createFolderForm}>
              <input
                type="text"
                autoFocus
                placeholder="New folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className={styles.input}
              />
              <button
                type="submit"
                disabled={!newFolderName.trim()}
                className={styles.btnPrimary}
              >
                Move
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className={styles.btnGhost}
              >
                <FiX size={14} />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className={`${styles.btnGhost} ${styles.newFolderBtn}`}
            >
              <FiFolderPlus size={16} />
              Create New Folder &amp; Move
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
