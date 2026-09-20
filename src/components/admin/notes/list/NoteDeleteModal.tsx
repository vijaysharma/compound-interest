'use client';
import React from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { Note, deriveAutoTitleFromHtml } from '../NotesTypes';
import styles from '../NotesList.module.scss';
import modalStyles from '../NotesModal.module.scss';
interface NoteDeleteModalProps {
  note: Note | null;
  isTrash: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
}
export const NoteDeleteModal: React.FC<NoteDeleteModalProps> = ({
  note,
  isTrash,
  onClose,
  onConfirmDelete,
}) => {
  if (!note) return null;
  const title = note.title || deriveAutoTitleFromHtml(note.content) || 'Untitled Note';
  return (
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
              <strong>"{title}"</strong>? This will remove it completely from your database and cloud storage. This action cannot be undone.
            </>
          ) : (
            <>
              Are you sure you want to move <strong>"{title}"</strong> to Recently Deleted?
            </>
          )}
        </p>
        <div className={styles.modalActionsRow}>
          <button onClick={onClose} className={modalStyles.btnGhost}>
            Cancel
          </button>
          <button
            onClick={onConfirmDelete}
            className={`${modalStyles.btnPrimary} ${styles.deleteConfirmBtn}`}
          >
            {isTrash ? 'Delete Permanently' : 'Move to Trash'}
          </button>
        </div>
      </div>
    </div>
  );
};
