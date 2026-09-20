import React, { useState } from 'react';
import { FiChevronLeft, FiTrash2 } from 'react-icons/fi';
import { BsLockFill } from 'react-icons/bs';
import { Note, hashPasscode } from '../NotesTypes';
import styles from '../NotesEditor.module.scss';
interface EditorLockedScreenProps {
  note: Note;
  folderTitle?: string;
  onBackMobile?: () => void;
  onUnlockSession: () => void;
  onDeleteRequest: () => void;
}
export const EditorLockedScreen: React.FC<EditorLockedScreenProps> = ({
  note,
  folderTitle,
  onBackMobile,
  onUnlockSession,
  onDeleteRequest,
}) => {
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const handleUnlockNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockPassword.trim()) return;
    try {
      const hash = await hashPasscode(unlockPassword.trim());
      if (note.lock_password_hash && hash !== note.lock_password_hash) {
        setUnlockError('Incorrect password');
        return;
      }
      setUnlockPassword('');
      setUnlockError(null);
      onUnlockSession();
    } catch {
      setUnlockError('Verification failed');
    }
  };
  return (
    <div className={styles.lockedContainer}>
      <div className={styles.lockedTopBar}>
        <div className={styles.lockedTopBarLeft}>
          {onBackMobile && (
            <button onClick={onBackMobile} className={styles.backBtn}>
              <FiChevronLeft size={20} />
              <span>{folderTitle || 'Notes'}</span>
            </button>
          )}
          <span className={styles.lockedNoteTitle}>Locked Note</span>
        </div>
        <button
          onClick={onDeleteRequest}
          className={`${styles.iconBtn} ${styles.danger}`}
          title="Delete Note"
        >
          <FiTrash2 size={16} />
        </button>
      </div>
      <div className={styles.lockedCenter}>
        <div className={styles.lockedIconBox}>
          <BsLockFill size={32} />
        </div>
        <h3 className={`${styles.emptyTitle} ${styles.mb025}`}>This note is locked</h3>
        <p className={`${styles.emptyText} ${styles.mb15}`}>
          Enter the password for this note to view its contents.
        </p>
        {unlockError && (
          <div className={styles.errorAlert}>
            <span>{unlockError}</span>
          </div>
        )}
        <form onSubmit={handleUnlockNote} className={styles.wFull}>
          <input
            type="password"
            autoFocus
            placeholder="Enter password"
            value={unlockPassword}
            onChange={(e) => setUnlockPassword(e.target.value)}
            className={styles.lockedInput}
          />
          <button type="submit" disabled={!unlockPassword.trim()} className={styles.lockedSubmitBtn}>
            View Note
          </button>
        </form>
      </div>
    </div>
  );
};
