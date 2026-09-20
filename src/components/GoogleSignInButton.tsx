'use client';
import { useCallback, useState } from 'react';
import { useAuth } from '../context/useAuth';
import { GoogleIcon } from './google-auth/GoogleIcon';
import { GoogleAuthModal } from './google-auth/GoogleAuthModal';
import { useGoogleGsi } from './google-auth/useGoogleGsi';
import type { GoogleProfile, GoogleSignInButtonProps } from './google-auth/types';
import styles from './GoogleSignInButton.module.scss';
export type { GoogleProfile, GoogleSignInButtonProps };
const GoogleSignInButton = ({
  onSuccess,
  onProfileSelect,
  className = '',
  text = 'continue_with',
  modalTitle = 'Sign Up with Google',
}: GoogleSignInButtonProps) => {
  const { loading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const handleCredentialReceived = useCallback((profile: { email: string; name: string }) => {
    if (profile.email) setEmail(profile.email);
    if (profile.name) setName(profile.name);
    setIsModalOpen(true);
  }, []);
  const { buttonRef, hasValidClientId } = useGoogleGsi({
    text,
    onProfileSelect,
    onCredentialReceived: handleCredentialReceived,
  });
  return (
    <div className={`${styles.container} ${className}`}>
      {hasValidClientId ? (
        <div ref={buttonRef} className={styles.gsiButtonWrapper} />
      ) : (
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            setError(null);
            setIsModalOpen(true);
          }}
          className={styles.fallbackButton}
        >
          <GoogleIcon />
          <span>Sign up with Google</span>
        </button>
      )}
      {error && !isModalOpen && <p className={styles.errorText}>{error}</p>}
      <GoogleAuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialEmail={email}
        initialName={name}
        modalTitle={modalTitle}
        onSuccess={onSuccess}
      />
    </div>
  );
};
export default GoogleSignInButton;
