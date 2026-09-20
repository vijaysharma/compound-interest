import React from 'react';
import { FiFileText } from 'react-icons/fi';
import { Form16ExtractedData } from './types';
import { FileItrEmployerDetails } from './FileItrEmployerDetails';
import { FileItrSalaryInputs } from './FileItrSalaryInputs';
import { FileItrDeductionsInputs } from './FileItrDeductionsInputs';
import styles from '../FileItr.module.scss';
interface FileItrDetailsCardProps {
  formData: Form16ExtractedData;
  updateField: (field: keyof Form16ExtractedData, val: string | number) => void;
}
export const FileItrDetailsCard: React.FC<FileItrDetailsCardProps> = ({
  formData,
  updateField,
}) => {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h3 className={styles.cardTitle}>
            <FiFileText /> Form 16 Extracted Details
          </h3>
          <p className={styles.cardSub}>
            Review or edit extracted figures to recalculate taxes in real time.
          </p>
        </div>
      </div>
      <div className={styles.columnGap125}>
        <FileItrEmployerDetails
          employerName={formData.employerName}
          employerTan={formData.employerTan}
          employeePan={formData.employeePan}
          updateField={updateField}
        />
        <FileItrSalaryInputs
          grossSalary={formData.grossSalary}
          basicSalary={formData.basicSalary}
          hraReceived={formData.hraReceived}
          rentPaid={formData.rentPaid}
          standardDeduction={formData.standardDeduction}
          professionalTax={formData.professionalTax}
          updateField={updateField}
        />
        <FileItrDeductionsInputs
          section80C={formData.section80C}
          section80Ccd1b={formData.section80Ccd1b}
          section80D={formData.section80D}
          section80Tta={formData.section80Tta}
          tdsDeducted={formData.tdsDeducted}
          updateField={updateField}
        />
      </div>
    </div>
  );
};
