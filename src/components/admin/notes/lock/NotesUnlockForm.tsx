'use client';
import React, { useState } from 'react';
import { FiUnlock } from 'react-icons/fi';
import { hashPasscode } from '../NotesTypes';
import styles from '../NotesModal.module.scss';
interface NotesUnlockFormProps {
  expectedHash?: string;
  onClose: () => void;
  onRemoveLock: () => void;
  onUnlockSuccess: () => void;
  setError: (err: string | null) => void;
}
export const NotesUnlockForm: React.FC<NotesUnlockFormProps> = ({
  expectedHash,
  onClose,
  onRemoveLock,
  onUnlockSuccess,
  setError,
}) => {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Password is required');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const computedHash = await hashPasscode(password.trim());
      if (expectedHash && computedHash !== expectedHash) {
        setError('Incorrect password');
        setBusy(false);
        return;
      }
      setPassword('');
      onUnlockSuccess();
      onClose();
    } catch {
      setError('Failed to verify password');
    } finally {
      setBusy(false);
    }
  };
  const handleRemoveLock = async () => {
    if (!password.trim()) {
      setError('Enter password first to remove lock');
      return;
    }
    const computedHash = await hashPasscode(password.trim());
    if (expectedHash && computedHash !== expectedHash) {
      setError('Incorrect password');
      return;
    }
    onRemoveLock();
    onClose();
  };
  return (
    <form onSubmit={handleUnlock}>
      <p className={styles.helperText}>
        Enter the passcode for this note to view or modify its lock settings.
      </p>
      <div className={styles.fieldGroup}>
        <input
          type="password"
          autoFocus
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
        />
      </div>
      <div className={styles.lockActionsBetween}>
        <button
          type="button"
          onClick={handleRemoveLock}
          className={`${styles.btnGhost} ${styles.btnDanger}`}
          disabled={busy}
        >
          <FiUnlock size={12} />
          <span>Remove Lock</span>
        </button>
        <div className={styles.btnGroup}>
          <button
            type="button"
            onClick={onClose}
            className={styles.btnGhost}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !password.trim()}
            className={styles.btnPrimary}
          >
            {busy ? 'Verifying...' : 'Unlock'}
          </button>
        </div>
      </div>
    </form>
  );
};
