'use client';
import React, { useState } from 'react';
import { FiCheck } from 'react-icons/fi';
import { hashPasscode } from '../NotesTypes';
import styles from '../NotesModal.module.scss';
interface NotesSetPasswordFormProps {
  onClose: () => void;
  onSetPassword: (hash: string) => void;
  setError: (err: string | null) => void;
}
export const NotesSetPasswordForm: React.FC<NotesSetPasswordFormProps> = ({
  onClose,
  onSetPassword,
  setError,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Password is required');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const hash = await hashPasscode(password.trim());
      setPassword('');
      setConfirmPassword('');
      onSetPassword(hash);
      onClose();
    } catch {
      setError('Failed to set password');
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={handleSetPassword}>
      <p className={styles.helperText}>
        Create a password to lock this note. You will need this password to view or edit the note.
      </p>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          Password
        </label>
        <input
          type="password"
          autoFocus
          placeholder="Choose password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          Confirm Password
        </label>
        <input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={styles.input}
        />
      </div>
      <div className={styles.lockActionsEnd}>
        <button
          type="button"
          onClick={onClose}
          className={styles.btnGhost}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy || !password.trim() || !confirmPassword.trim()}
          className={styles.btnPrimary}
        >
          <FiCheck size={14} />
          {busy ? 'Saving...' : 'Set Lock'}
        </button>
      </div>
    </form>
  );
};
