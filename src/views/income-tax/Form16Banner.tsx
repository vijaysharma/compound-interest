import React from 'react';
import { FiUploadCloud } from 'react-icons/fi';
import styles from '../IncomeTaxCalculator.module.scss';
interface Form16BannerProps {
  onNavigateFileItr: () => void;
}
export const Form16Banner: React.FC<Form16BannerProps> = ({ onNavigateFileItr }) => {
  return (
    <div className={styles.form16Banner}>
      <div className={styles.form16Content}>
        <div className={styles.form16IconBox}>
          <FiUploadCloud size={20} />
        </div>
        <div>
          <h3 className={styles.form16Title}>Have Form 16? Auto-fill &amp; Prepare ITR Filing</h3>
          <p className={styles.form16Desc}>
            Upload your Form 16 PDF or text to extract salary, TDS, exemptions, and deductions,
            compare regimes, and prepare your return.
          </p>
        </div>
      </div>
      <button
        type="button"
        className={styles.form16Btn}
        onClick={onNavigateFileItr}
      >
        <FiUploadCloud size={14} /> Upload Form 16 &rarr;
      </button>
    </div>
  );
};
