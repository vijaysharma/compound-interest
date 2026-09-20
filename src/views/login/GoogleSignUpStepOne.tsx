import React from 'react';
import GoogleSignInButton from '../../components/GoogleSignInButton';
import { GoogleProfile } from './types';
import styles from '../Login.module.scss';
interface GoogleSignUpStepOneProps {
  onProfileSelect: (p: GoogleProfile) => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}
export const GoogleSignUpStepOne: React.FC<GoogleSignUpStepOneProps> = ({
  onProfileSelect,
  onSuccess,
  onError,
}) => {
  return (
    <div className={styles.form}>
      <div className={styles.stepCard}>
        <div className={styles.stepEyebrow}>
          Step 1 of 2: Verify Your Google / Gmail Account
        </div>
        <p className={styles.stepDesc}>
          Includes 48-hour trial with 15 live Mutual Fund, Inflation &amp; PPP calculation runs.
          Suite tools remain free post-48 hours.
        </p>
      </div>
      <div className={styles.googleBtnWrapper}>
        <GoogleSignInButton
          text="signup_with"
          modalTitle="Verify Google Account"
          onProfileSelect={onProfileSelect}
          onSuccess={onSuccess}
        />
      </div>
      <div className={styles.divider}>or continue with email</div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const clean =
            (e.currentTarget.elements.namedItem('direct_gmail') as HTMLInputElement)
              ?.value
              ?.trim()
              .toLowerCase() || '';
          if (
            !clean ||
            (!clean.endsWith('@gmail.com') && !clean.endsWith('@googlemail.com'))
          ) {
            onError('Only valid @gmail.com or @googlemail.com addresses are permitted.');
            return;
          }
          onProfileSelect({
            email: clean,
            name: clean.split('@')[0],
          });
        }}
        className={styles.formTight}
      >
        <div className={styles.field}>
          <label htmlFor="direct-gmail" className={styles.fieldLabel}>
            Gmail Address
          </label>
          <input
            id="direct-gmail"
            name="direct_gmail"
            type="email"
            required
            placeholder="e.g. yourname@gmail.com"
            className={styles.input}
          />
        </div>
        <button type="submit" className={styles.outlineBtn}>
          <span>Continue to Set Password &rarr;</span>
        </button>
      </form>
    </div>
  );
};
