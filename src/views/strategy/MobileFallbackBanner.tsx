import React from 'react';
import { FiMonitor } from 'react-icons/fi';
import styles from './StrategyCalculator.module.scss';
export const MobileFallbackBanner: React.FC = () => {
  return (
    <div className={styles.mobileFallbackContainer} role="region" aria-label="Desktop viewport requirement">
      <div className={styles.mobileFallbackCard}>
        <div className={styles.mobileFallbackIconWrap}>
          <FiMonitor className={styles.mobileFallbackIcon} />
        </div>
        <span className={styles.mobileFallbackBadge}>Desktop Viewport Only</span>
        <h2 className={styles.mobileFallbackTitle}>Advanced Strategy Builder</h2>
        <p className={styles.mobileFallbackText}>
          This advanced strategy builder is optimized for desktop viewports. Please switch to the
          web version on a desktop screen for the best experience and interaction.
        </p>
      </div>
    </div>
  );
};
