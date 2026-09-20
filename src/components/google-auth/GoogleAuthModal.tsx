'use client';
import { FiX } from 'react-icons/fi';
import { useScrollLock } from '../../utilities/useScrollLock';
import { GoogleIcon } from './GoogleIcon';
import { useGoogleRegistration } from './useGoogleRegistration';
import { GoogleAuthForm } from './GoogleAuthForm';
import styles from '../GoogleSignInButton.module.scss';
interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail: string;
  initialName: string;
  modalTitle: string;
  onSuccess?: () => void;
}
export function GoogleAuthModal({
  isOpen,
  onClose,
  initialEmail,
  initialName,
  modalTitle,
  onSuccess,
}: GoogleAuthModalProps) {
  useScrollLock(isOpen);
  const {
    email,
    setEmail,
    name,
    setName,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    isSubmitting,
    loading,
    isAdminCandidate,
    handleAuthorizeSubmit,
  } = useGoogleRegistration({
    initialEmail,
    initialName,
    onSuccess,
    onClose,
  });
  if (!isOpen) return null;
  return (
    <div className={styles.modalOverlay}>
      <div
        className={styles.modalCard}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close dialog"
        >
          <FiX size={16} />
        </button>
        <div className={styles.modalHeader}>
          <div className={styles.iconWrapper}>
            <GoogleIcon />
          </div>
          <div>
            <h3 id="auth-modal-title" className={styles.modalTitle}>
              {modalTitle}
            </h3>
            <p className={styles.modalSubtitle}>
              Create password to complete Google registration
            </p>
          </div>
        </div>
        {error && (
          <div className={styles.alertError}>
            <span>{error}</span>
          </div>
        )}
        <GoogleAuthForm
          email={email}
          setEmail={setEmail}
          name={name}
          setName={setName}
          password={password}
          setPassword={setPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          isSubmitting={isSubmitting}
          loading={loading}
          isAdminCandidate={isAdminCandidate}
          onSubmit={handleAuthorizeSubmit}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
