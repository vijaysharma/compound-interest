import React from 'react';
import Logo from '../../components/Logo';
import { LoginTab } from './types';
import styles from '../Login.module.scss';
interface LoginHeaderProps {
  activeTab: LoginTab;
  onTabChange: (tab: LoginTab) => void;
}
export const LoginHeader: React.FC<LoginHeaderProps> = ({ activeTab, onTabChange }) => {
  return (
    <>
      <div className={styles.brandHeader}>
        <div className={styles.brandLogo}>
          <Logo />
        </div>
        <h1 className={styles.brandTitle}>Rupee Calculators Suite</h1>
        <p className={styles.brandSubtitle}>
          Institutional financial suite with live AMFI mutual fund sync &amp; multi-country models.
        </p>
      </div>
      <div className={styles.tabSwitcher}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'signin' ? styles.tabBtnActive : ''}`}
          onClick={() => onTabChange('signin')}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'signup' ? styles.tabBtnActive : ''}`}
          onClick={() => onTabChange('signup')}
        >
          Sign Up with Google
        </button>
      </div>
    </>
  );
};
