import React, { useState } from 'react';
import { FiLock, FiUnlock, FiX, FiCheck } from 'react-icons/fi';
import { hashPasscode } from './NotesTypes';
import styles from './NotesModal.module.scss';
interface NotesLockModalProps {
  isOpen: boolean;
  isLocked: boolean;
  hasPasswordHash: boolean;
  expectedHash?: string;
  onClose: () => void;
  onSetPassword: (hash: string) => void;
  onRemoveLock: () => void;
  onUnlockSuccess: () => void;
}
export const NotesLockModal: React.FC<NotesLockModalProps> = ({
  isOpen,
  isLocked,
  hasPasswordHash,
  expectedHash,
  onClose,
  onSetPassword,
  onRemoveLock,
  onUnlockSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!isOpen) return null;
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
    <div className={styles.modalOverlay}>
      <div className={`${styles.modalBox} ${styles.modalBoxSm}`}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalIconBox}>
              <FiLock size={16} />
            </div>
            <h3 className={styles.modalTitle}>
              {isLocked ? 'Note Password' : 'Lock Note'}
            </h3>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <FiX size={16} />
          </button>
        </div>
        <div className={styles.modalBody}>
          {error && (
            <div className={styles.alertError}>
              <span>{error}</span>
            </div>
          )}
          {hasPasswordHash ? (
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={async () => {
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
                  }}
                  className={`${styles.btnGhost} ${styles.btnDanger}`}
                  disabled={busy}
                >
                  <FiUnlock size={12} />
                  <span>Remove Lock</span>
                </button>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
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
          ) : (
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.5rem' }}>
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
          )}
        </div>
      </div>
    </div>
  );
};
