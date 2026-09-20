import React, { FormEvent } from 'react';
import { FiCheckCircle } from 'react-icons/fi';
import { GoogleProfile } from './types';
import styles from '../Login.module.scss';
interface GoogleSignUpStepTwoProps {
  googleProfile: GoogleProfile;
  onChangeProfile: () => void;
  signupPassword: string;
  setSignupPassword: (v: string) => void;
  signupConfirmPassword: string;
  setSignupConfirmPassword: (v: string) => void;
  isSubmitting: boolean;
  loading: boolean;
  onSubmit: (e: FormEvent) => void;
}
export const GoogleSignUpStepTwo: React.FC<GoogleSignUpStepTwoProps> = ({
  googleProfile,
  onChangeProfile,
  signupPassword,
  setSignupPassword,
  signupConfirmPassword,
  setSignupConfirmPassword,
  isSubmitting,
  loading,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <div className={styles.verifiedCard}>
        {googleProfile.picture ? (
          <img
            src={googleProfile.picture}
            alt={googleProfile.name || googleProfile.email}
            className={styles.avatarImg}
          />
        ) : (
          <div className={styles.avatarFallback}>
            {googleProfile.email.charAt(0).toUpperCase()}
          </div>
        )}
        <div className={styles.verifiedTextGroup}>
          <div className={styles.verifiedBadge}>
            <FiCheckCircle />
            <span>Verified Google Account</span>
          </div>
          <div className={styles.verifiedEmail}>{googleProfile.email}</div>
          {googleProfile.name && (
            <div className={styles.verifiedName}>{googleProfile.name}</div>
          )}
        </div>
        <button
          type="button"
          onClick={onChangeProfile}
          className={styles.ghostBtn}
        >
          Change
        </button>
      </div>
      <div className={styles.field}>
        <label htmlFor="signup-password" className={styles.fieldLabel}>
          Create Account Password
        </label>
        <input
          id="signup-password"
          type="password"
          required
          autoFocus
          minLength={6}
          value={signupPassword}
          onChange={(e) => setSignupPassword(e.target.value)}
          placeholder="Minimum 6 characters"
          className={styles.input}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="signup-confirm-password" className={styles.fieldLabel}>
          Confirm Password
        </label>
        <input
          id="signup-confirm-password"
          type="password"
          required
          minLength={6}
          value={signupConfirmPassword}
          onChange={(e) => setSignupConfirmPassword(e.target.value)}
          placeholder="Re-enter password"
          className={styles.input}
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting || loading}
        className={styles.primaryBtn}
      >
        {isSubmitting ? (
          <>
            <span className={styles.spinner} />
            <span>Completing Registration...</span>
          </>
        ) : (
          <span>Register &amp; Unlock Free Access &rarr;</span>
        )}
      </button>
    </form>
  );
};
