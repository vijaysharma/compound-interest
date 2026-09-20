import React from 'react';
import { Form16ExtractedData } from './types';
import styles from '../FileItr.module.scss';
interface FileItrSalaryInputsProps {
  grossSalary: number;
  basicSalary: number;
  hraReceived: number;
  rentPaid: number;
  standardDeduction: number;
  professionalTax: number;
  updateField: (field: keyof Form16ExtractedData, val: string | number) => void;
}
export const FileItrSalaryInputs: React.FC<FileItrSalaryInputsProps> = ({
  grossSalary,
  basicSalary,
  hraReceived,
  rentPaid,
  standardDeduction,
  professionalTax,
  updateField,
}) => {
  return (
    <div>
      <h4 className={styles.formSectionTitle}>
        Salary &amp; Allowances (Section 17)
      </h4>
      <div className={styles.formGrid2}>
        <div className={styles.formField}>
          <label className={styles.label}>Gross Salary (Sec 17(1))</label>
          <input
            type="text"
            className={styles.input}
            value={grossSalary ? grossSalary.toLocaleString('en-IN') : ''}
            onChange={(e) => updateField('grossSalary', e.target.value)}
          />
        </div>
        <div className={styles.formField}>
          <label className={styles.label}>Basic Salary</label>
          <input
            type="text"
            className={styles.input}
            value={basicSalary ? basicSalary.toLocaleString('en-IN') : ''}
            onChange={(e) => updateField('basicSalary', e.target.value)}
          />
        </div>
        <div className={styles.formField}>
          <label className={styles.label}>HRA Received (Sec 10(13A))</label>
          <input
            type="text"
            className={styles.input}
            value={hraReceived ? hraReceived.toLocaleString('en-IN') : ''}
            onChange={(e) => updateField('hraReceived', e.target.value)}
          />
        </div>
        <div className={styles.formField}>
          <label className={styles.label}>Actual Rent Paid for Year</label>
          <input
            type="text"
            className={styles.input}
            value={rentPaid ? rentPaid.toLocaleString('en-IN') : ''}
            onChange={(e) => updateField('rentPaid', e.target.value)}
          />
        </div>
        <div className={styles.formField}>
          <label className={styles.label}>Standard Deduction (Sec 16(ia))</label>
          <input
            type="text"
            className={styles.input}
            value={standardDeduction ? standardDeduction.toLocaleString('en-IN') : ''}
            onChange={(e) => updateField('standardDeduction', e.target.value)}
          />
        </div>
        <div className={styles.formField}>
          <label className={styles.label}>Professional Tax (Sec 16(iii))</label>
          <input
            type="text"
            className={styles.input}
            value={professionalTax ? professionalTax.toLocaleString('en-IN') : ''}
            onChange={(e) => updateField('professionalTax', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};
