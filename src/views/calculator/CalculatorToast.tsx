import React from 'react';
import { FiCheck } from 'react-icons/fi';
import styles from '../Calculator.module.scss';
interface CalculatorToastProps {
  message: string | null;
}
export const CalculatorToast: React.FC<CalculatorToastProps> = ({ message }) => {
  if (!message) return null;
  return (
    <div className={styles.toastWrapper}>
      <div className={styles.toastBadge}>
        <FiCheck className={styles.toastSuccessIcon} /> {message}
      </div>
    </div>
  );
};
