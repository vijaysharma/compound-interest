import React from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import styles from '../IncomeTaxCalculator.module.scss';
interface CustomDeductionsListProps {
  customDeductionsList: Array<{ id: string; name: string; amount: string }>;
  onAddCustomDeduction: () => void;
  onUpdateCustomDeduction: (id: string, field: 'name' | 'amount', value: string) => void;
  onRemoveCustomDeduction: (id: string) => void;
}
export const CustomDeductionsList: React.FC<CustomDeductionsListProps> = ({
  customDeductionsList,
  onAddCustomDeduction,
  onUpdateCustomDeduction,
  onRemoveCustomDeduction,
}) => {
  return (
    <div className={styles.customDeductionsContainer}>
      <div className={styles.customDeductionsHeader}>
        <div>
          <h4 className={styles.customDeductionsTitle}>Custom Tax Deductions</h4>
          <p className={styles.customDeductionsSub}>
            Add any personalized deductions or state-specific exemptions not listed above.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddCustomDeduction}
          className={styles.addDeductionBtn}
        >
          <FiPlus size={14} /> Add Custom Deduction
        </button>
      </div>
      {customDeductionsList.map((item) => (
        <div key={item.id} className={styles.customDeductionRow}>
          <input
            type="text"
            value={item.name}
            onChange={(e) => onUpdateCustomDeduction(item.id, 'name', e.target.value)}
            placeholder="Deduction Name / Section"
            className={`${styles.input} ${styles.inputFlex2}`}
          />
          <input
            type="text"
            value={item.amount}
            onChange={(e) => onUpdateCustomDeduction(item.id, 'amount', e.target.value)}
            placeholder="Amount (₹)"
            className={`${styles.input} ${styles.inputFlex1}`}
          />
          <button
            type="button"
            onClick={() => onRemoveCustomDeduction(item.id)}
            className={styles.deleteDeductionBtn}
            title="Remove custom deduction"
            aria-label="Remove deduction"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
