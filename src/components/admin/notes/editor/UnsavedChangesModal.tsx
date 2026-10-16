import React from 'react';
import { FiAlertCircle, FiSave, FiTrash2 } from 'react-icons/fi';
import modalStyles from '../NotesModal.module.scss';
import styles from '../NotesEditor.module.scss';
interface UnsavedChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDiscard: () => void;
  onSaveAndProceed: () => void;
}
export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  onClose,
  onDiscard,
  onSaveAndProceed,
}) => {
  if (!isOpen) return null;
  return (
    <div className={modalStyles.modalOverlay}>
      <div className={`${modalStyles.modalBox} ${modalStyles.modalBoxSm} ${styles.deleteModalBox}`}>
        <h3 className={`${modalStyles.modalTitle} ${styles.deleteModalTitle}`}>
          <FiAlertCircle size={20} className={styles.warningIcon} />
          Unsaved Changes
        </h3>
        <p className={`${modalStyles.helperText} ${styles.deleteModalText}`}>
          You have unsaved changes in this note. Would you like to save your edits before moving away, or discard them?
        </p>
        <div className={styles.modalActionsRow}>
          <button
            type="button"
            onClick={onClose}
            className={modalStyles.btnGhost}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className={`${modalStyles.btnGhost} ${styles.btnDangerMin38}`}
          >
            <FiTrash2 size={14} className={styles.iconMr025} />
            Discard
          </button>
          <button
            type="button"
            onClick={onSaveAndProceed}
            className={`${modalStyles.btnPrimary} ${styles.saveConfirmBtn}`}
          >
            <FiSave size={14} className={styles.iconMr025} />
            Save &amp; Proceed
          </button>
        </div>
      </div>
    </div>
  );
};
