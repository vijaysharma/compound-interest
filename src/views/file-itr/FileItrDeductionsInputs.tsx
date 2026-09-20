import React from 'react';
import { Form16ExtractedData } from './types';
import styles from '../FileItr.module.scss';
interface FileItrDeductionsInputsProps {
  section80C: number;
  section80Ccd1b: number;
  section80D: number;
  section80Tta: number;
  tdsDeducted: number;
  updateField: (field: keyof Form16ExtractedData, val: string | number) => void;
}
export const FileItrDeductionsInputs: React.FC<FileItrDeductionsInputsProps> = ({
  section80C,
  section80Ccd1b,
  section80D,
  section80Tta,
  tdsDeducted,
  updateField,
}) => {
  return (
    <>
      <div>
        <h4 className={styles.formSectionTitle}>
          Chapter VI-A Deductions &amp; Investments
        </h4>
        <div className={styles.formGrid2}>
          <div className={styles.formField}>
            <label className={styles.label}>Section 80C (PPF, EPF, ELSS - Max ₹1.5L)</label>
            <input
              type="text"
              className={styles.input}
              value={section80C ? section80C.toLocaleString('en-IN') : ''}
              onChange={(e) => updateField('section80C', e.target.value)}
            />
          </div>
          <div className={styles.formField}>
            <label className={styles.label}>Section 80CCD(1B) (NPS Self - Max ₹50K)</label>
            <input
              type="text"
              className={styles.input}
              value={section80Ccd1b ? section80Ccd1b.toLocaleString('en-IN') : ''}
              onChange={(e) => updateField('section80Ccd1b', e.target.value)}
            />
          </div>
          <div className={styles.formField}>
            <label className={styles.label}>Section 80D (Health Insurance)</label>
            <input
              type="text"
              className={styles.input}
              value={section80D ? section80D.toLocaleString('en-IN') : ''}
              onChange={(e) => updateField('section80D', e.target.value)}
            />
          </div>
          <div className={styles.formField}>
            <label className={styles.label}>Savings Interest (Sec 80TTA)</label>
            <input
              type="text"
              className={styles.input}
              value={section80Tta ? section80Tta.toLocaleString('en-IN') : ''}
              onChange={(e) => updateField('section80Tta', e.target.value)}
            />
          </div>
        </div>
      </div>
      <div>
        <h4 className={styles.formSectionTitleGreen}>
          Tax Deducted at Source (TDS Paid)
        </h4>
        <div className={styles.formField}>
          <label className={styles.label}>Total TDS Deducted by Employer (₹)</label>
          <input
            type="text"
            className={`${styles.input} ${styles.highlightGreenInput}`}
            value={tdsDeducted ? tdsDeducted.toLocaleString('en-IN') : ''}
            onChange={(e) => updateField('tdsDeducted', e.target.value)}
          />
        </div>
      </div>
    </>
  );
};
