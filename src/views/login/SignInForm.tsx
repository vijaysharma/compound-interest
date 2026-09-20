import React, { FormEvent } from 'react';
import styles from '../Login.module.scss';
interface SignInFormProps {
  loginEmail: string;
  setLoginEmail: (v: string) => void;
  loginPassword: string;
  setLoginPassword: (v: string) => void;
  isSubmitting: boolean;
  loading: boolean;
  onSubmit: (e: FormEvent) => void;
  onSwitchToSignup: () => void;
}
export const SignInForm: React.FC<SignInFormProps> = ({
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  isSubmitting,
  loading,
  onSubmit,
  onSwitchToSignup,
}) => {
  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="signin-email" className={styles.fieldLabel}>
          Email Address
        </label>
        <input
          id="signin-email"
          type="email"
          required
          autoFocus
          value={loginEmail}
          onChange={(e) => setLoginEmail(e.target.value)}
          placeholder="you@gmail.com"
          className={styles.input}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="signin-password" className={styles.fieldLabel}>
          Password
        </label>
        <input
          id="signin-password"
          type="password"
          required
          value={loginPassword}
          onChange={(e) => setLoginPassword(e.target.value)}
          placeholder="••••••••"
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
            <span>Signing In...</span>
          </>
        ) : (
          <span>Sign In with Password &rarr;</span>
        )}
      </button>
      <div className={styles.footerLinkText}>
        <span>New to Rupee Calculator? </span>
        <button
          type="button"
          onClick={onSwitchToSignup}
          className={styles.linkBtn}
        >
          Sign Up with Google &rarr;
        </button>
      </div>
    </form>
  );
};
