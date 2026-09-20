import React from 'react';
import Link from '../../components/PrefetchLink';
import styles from '../Home.module.scss';
export const HomeFooter: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerLinks}>
        <Link to="/about" className={styles.footerLink}>
          About
        </Link>
        <span className={styles.footerDot}>&bull;</span>
        <Link to="/privacy" className={styles.footerLink}>
          Privacy Policy
        </Link>
        <span className={styles.footerDot}>&bull;</span>
        <Link to="/disclaimer" className={styles.footerLink}>
          Disclaimer
        </Link>
      </div>
      <p className={styles.footerCopyright}>
        &copy; {new Date().getFullYear()} Rupee Calculator &bull; Educational and analytical
        purposes only.
      </p>
    </footer>
  );
};
