import { FormEvent } from 'react';
import { FiCheck } from 'react-icons/fi';
import styles from '../GoogleSignInButton.module.scss';
interface GoogleAuthFormProps {
  email: string;
  setEmail: (email: string) => void;
  name: string;
  setName: (name: string) => void;
  password: string;
  setPassword: (pwd: string) => void;
  confirmPassword: string;
  setConfirmPassword: (pwd: string) => void;
  isSubmitting: boolean;
  loading: boolean;
  isAdminCandidate: boolean;
  onSubmit: (e: FormEvent) => Promise<void>;
  onCancel: () => void;
}
export function GoogleAuthForm({
  email,
  setEmail,
  name,
  setName,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  isSubmitting,
  loading,
  isAdminCandidate,
  onSubmit,
  onCancel,
}: GoogleAuthFormProps) {
  return (
    <form onSubmit={(e) => void onSubmit(e)} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="google-email" className={styles.label}>
          Google Account Email
        </label>
        <div className={styles.inputWrapper}>
          <input
            id="google-email"
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@gmail.com or workspace account"
            className={`${styles.input} ${styles.inputWithIcon}`}
          />
          {email.includes('@') && (
            <span className={styles.checkIcon}>
              <FiCheck size={16} />
            </span>
          )}
        </div>
        {isAdminCandidate && (
          <p className={styles.adminNotice}>
            Administrator privileges detected for this email
          </p>
        )}
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="google-name" className={styles.label}>
          Display Name <span className={styles.labelOptional}>(optional)</span>
        </label>
        <input
          id="google-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. John Doe"
          className={styles.input}
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="google-password" className={styles.label}>
          Create Password
        </label>
        <input
          id="google-password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimum 6 characters"
          className={styles.input}
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="google-confirm-password" className={styles.label}>
          Confirm Password
        </label>
        <input
          id="google-confirm-password"
          type="password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter password"
          className={styles.input}
        />
      </div>
      <div className={styles.buttonRow}>
        <button type="button" className={styles.cancelButton} onClick={onCancel}>
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || loading}
          className={styles.submitButton}
        >
          {isSubmitting ? (
            <>
              <span className={styles.spinner} />
              <span>Creating Account...</span>
            </>
          ) : (
            <>
              <span>Register &amp; Continue</span>
              <span>&rarr;</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
