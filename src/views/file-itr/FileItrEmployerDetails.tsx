import React from 'react';
import { Form16ExtractedData } from './types';
import styles from '../FileItr.module.scss';
interface FileItrEmployerDetailsProps {
  employerName: string;
  employerTan: string;
  employeePan: string;
  updateField: (field: keyof Form16ExtractedData, val: string | number) => void;
}
export const FileItrEmployerDetails: React.FC<FileItrEmployerDetailsProps> = ({
  employerName,
  employerTan,
  employeePan,
  updateField,
}) => {
  return (
    <div>
      <h4 className={styles.formSectionTitle}>
        Employer &amp; Employee Identification
      </h4>
      <div className={styles.formGrid2}>
        <div className={styles.formField}>
          <label className={styles.label}>Employer Name</label>
          <input
            type="text"
            className={styles.input}
            value={employerName}
            onChange={(e) => updateField('employerName', e.target.value)}
          />
        </div>
        <div className={`${styles.formGrid2} ${styles.gridGapSmall}`}>
          <div className={styles.formField}>
            <label className={styles.label}>Employer TAN</label>
            <input
              type="text"
              className={styles.input}
              value={employerTan}
              onChange={(e) => updateField('employerTan', e.target.value)}
            />
          </div>
          <div className={styles.formField}>
            <label className={styles.label}>Employee PAN</label>
            <input
              type="text"
              className={styles.input}
              value={employeePan}
              onChange={(e) => updateField('employeePan', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
