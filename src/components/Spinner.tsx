import React from 'react';
import styles from './Spinner.module.scss';
export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
  label?: string;
  inline?: boolean;
}
export default function Spinner({
  size = 'md',
  color,
  className = '',
  label,
  inline = false,
}: SpinnerProps) {
  const spinnerStyle = color ? { borderTopColor: color } : undefined;
  return (
    <div
      className={`${styles.container} ${inline ? styles.inline : ''} ${className}`}
      role="status"
      aria-label={label || 'Loading...'}
    >
      <span
        className={`${styles.spinner} ${styles[size]}`}
        style={spinnerStyle}
      />
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}
