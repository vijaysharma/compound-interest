import React from 'react';
import styles from './ErrorPage.module.scss';
interface ErrorBannerProps {
  onRetry: () => void;
}
export const ErrorBanner: React.FC<ErrorBannerProps> = ({ onRetry }) => {
  return (
    <div className={styles.headerBanner}>
      <div className={styles.svgContainer}>
        <svg
          width="180"
          height="60"
          viewBox="0 0 180 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={styles.svgCircuit}
        >
          <path
            d="M 10 30 Q 50 10 90 30 T 170 30"
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="2.5"
            strokeDasharray="4 4"
            fill="none"
          />
          <path
            d="M 10 30 C 40 45, 60 15, 90 30 C 120 45, 140 15, 170 30"
            stroke="color-mix(in srgb, var(--color-primary-content) 60%, transparent)"
            strokeWidth="2"
            fill="none"
          />
          <circle cx="20" cy="30" r="5" fill="var(--color-primary-content)" />
          <g className={styles.shieldG} onClick={onRetry}>
            <title>Click to retry</title>
            <circle cx="90" cy="30" r="22" className={styles.shieldCircleOuter} />
            <circle cx="90" cy="30" r="16" className={styles.shieldCircleInner} />
            <text x="90" y="36" className={styles.shieldText}>
              ₹
            </text>
          </g>
          <circle cx="160" cy="30" r="5" fill="var(--color-primary-content)" />
        </svg>
      </div>
      <div className={styles.badge}>
        <span className={styles.dot} />
        Calculation Paused
      </div>
      <h1 className={styles.title}>Something Interrupted Your Calculation</h1>
      <p className={styles.description}>
        Your input data and cached values remain safe in your browser. We have paused the calculation to prevent inaccuracies.
      </p>
    </div>
  );
};
