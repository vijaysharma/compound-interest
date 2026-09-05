import React, { useState } from 'react';
import { FiLock, FiUnlock, FiX, FiCheck } from 'react-icons/fi';
import { hashPasscode } from './NotesTypes';
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
    <div className="modal modal-open z-50">
      <div className="modal-box max-w-sm rounded-2xl bg-base-100 p-6 shadow-2xl border border-base-300">
        <div className="flex items-center justify-between pb-3 border-b border-base-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <FiLock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base">
              {isLocked ? 'Note Password' : 'Lock Note'}
            </h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-xs btn-circle">
            <FiX className="w-4 h-4" />
          </button>
        </div>
        {error && (
          <div className="alert alert-error text-xs py-2 px-3 mt-3 rounded-lg">
            <span>{error}</span>
          </div>
        )}
        {hasPasswordHash ? (
          <form onSubmit={handleUnlock} className="space-y-4 mt-4">
            <p className="text-xs text-base-content/70">
              Enter the passcode for this note to view or modify its lock settings.
            </p>
            <div>
              <input
                type="password"
                autoFocus
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input input-bordered input-primary w-full input-sm rounded-lg text-sm"
              />
            </div>
            <div className="flex items-center justify-between pt-2">
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
                className="btn btn-ghost btn-xs text-error"
                disabled={busy}
              >
                <FiUnlock className="w-3 h-3 mr-1" />
                Remove Lock
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-ghost btn-sm text-xs rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy || !password.trim()}
                  className="btn btn-primary btn-sm text-xs font-semibold rounded-lg"
                >
                  {busy ? 'Verifying...' : 'Unlock'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSetPassword} className="space-y-3 mt-4">
            <p className="text-xs text-base-content/70">
              Create a password to lock this note. You will need this password to view or edit the note.
            </p>
            <div>
              <label className="text-[11px] font-semibold text-base-content/60 block mb-1">
                Password
              </label>
              <input
                type="password"
                autoFocus
                placeholder="Choose password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input input-bordered input-primary w-full input-sm rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-base-content/60 block mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input input-bordered input-primary w-full input-sm rounded-lg text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost btn-sm text-xs rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy || !password.trim() || !confirmPassword.trim()}
                className="btn btn-primary btn-sm text-xs font-semibold rounded-lg"
              >
                <FiCheck className="w-3.5 h-3.5 mr-1" />
                {busy ? 'Saving...' : 'Set Lock'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
