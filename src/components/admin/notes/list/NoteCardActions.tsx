'use client';
import React from 'react';
import { FiFolder, FiCopy, FiRotateCcw, FiTrash2 } from 'react-icons/fi';
import { BsPinFill, BsPin } from 'react-icons/bs';
import { Note } from '../NotesTypes';
import styles from '../NotesList.module.scss';
interface NoteCardActionsProps {
  note: Note;
  isTrash: boolean;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  onDuplicateNote: (note: Note, e: React.MouseEvent) => void;
  onRestoreNote: (id: string, e: React.MouseEvent) => void;
  onOpenMoveModal: (note: Note) => void;
  onOpenDeleteModal: (note: Note) => void;
}
export const NoteCardActions: React.FC<NoteCardActionsProps> = ({
  note,
  isTrash,
  onTogglePin,
  onDuplicateNote,
  onRestoreNote,
  onOpenMoveModal,
  onOpenDeleteModal,
}) => {
  return (
    <div className={styles.floatingActions}>
      {!isTrash ? (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenMoveModal(note);
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDeleteModal(note);
            }}
            className={`${styles.floatingBtn} ${styles.danger}`}
            title="Move to Trash"
          >
            <FiTrash2 size={12} />
          </button>
        </>
      ) : (
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
              onOpenDeleteModal(note);
            }}
            className={`${styles.floatingBtn} ${styles.danger}`}
            title="Delete Permanently"
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
