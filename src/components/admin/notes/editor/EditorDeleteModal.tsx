import React from 'react';
import { FiTrash2 } from 'react-icons/fi';
import modalStyles from '../NotesModal.module.scss';
import styles from '../NotesEditor.module.scss';
interface EditorDeleteModalProps {
  isOpen: boolean;
  isTrash: boolean;
  noteTitle: string;
  onClose: () => void;
  onConfirm: () => void;
}
export const EditorDeleteModal: React.FC<EditorDeleteModalProps> = ({
  isOpen,
  isTrash,
  noteTitle,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;
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
              <strong>"{noteTitle || 'Untitled Note'}"</strong>? This will remove it completely
              from the database and cloud storage. This action cannot be undone.
            </>
          ) : (
            <>
              Are you sure you want to move <strong>"{noteTitle || 'Untitled Note'}"</strong> to
              Recently Deleted?
            </>
          )}
        </p>
        <div className={styles.modalActionsRow}>
          <button onClick={onClose} className={modalStyles.btnGhost}>
            Cancel
          </button>
          <button
            onClick={() => {
              onClose();
              onConfirm();
            }}
            className={`${modalStyles.btnPrimary} ${styles.deleteConfirmBtn}`}
          >
            {isTrash ? 'Delete Permanently' : 'Move to Trash'}
          </button>
        </div>
      </div>
    </div>
  );
};
