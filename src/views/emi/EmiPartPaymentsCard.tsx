import React from 'react';
import { TbTrash } from 'react-icons/tb';
import JoinedButtonGroup from '../../components/JoinedButtonGroup';
import { PartPayment } from './types';
import styles from '../EmiCalculator.module.scss';
interface EmiPartPaymentsCardProps {
  partPayments: PartPayment[];
  onAddPartPayment: () => void;
  isAddPartPaymentDisabled: boolean;
  onRemovePartPayment: (idx: number) => void;
  onUpdatePartPayment: <K extends keyof PartPayment>(idx: number, field: K, val: PartPayment[K]) => void;
  disbursementDate: string;
}
export const EmiPartPaymentsCard: React.FC<EmiPartPaymentsCardProps> = ({
  partPayments,
  onAddPartPayment,
  isAddPartPaymentDisabled,
  onRemovePartPayment,
  onUpdatePartPayment,
  disbursementDate,
}) => {
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <p className={styles.cardEyebrow}>Prepayment Optimizer</p>
          <h2 className={styles.cardHeading}>Lump-Sum Part Payments</h2>
        </div>
        <button
          type="button"
          onClick={onAddPartPayment}
          disabled={isAddPartPaymentDisabled}
          className={styles.primaryButton}
        >
          + Add Part Payment
        </button>
      </div>
      <div className={styles.inputSection}>
        {partPayments.length === 0 && (
          <p className={styles.emptyStateText}>
            No part payments added yet. Click &quot;Add Part Payment&quot; above to simulate prepayments.
          </p>
        )}
        {partPayments.map((p, idx) => (
          <div
            key={idx}
            className={`${styles.prepaymentItem} ${
              p.enabled ? styles.prepaymentItemEnabled : styles.prepaymentItemDisabled
            }`}
          >
            <div className={styles.prepaymentItemHeader}>
              <label className={styles.includeToggle}>
                <input
                  type="checkbox"
                  checked={p.enabled}
                  onChange={(e) => onUpdatePartPayment(idx, 'enabled', e.target.checked)}
                  className={styles.checkbox}
                />
                <span className={styles.itemIndex}>Payment #{idx + 1}</span>
              </label>
              <button
                type="button"
                onClick={() => onRemovePartPayment(idx)}
                className={styles.deleteButton}
                title={`Remove part payment #${idx + 1}`}
                aria-label={`Remove part payment #${idx + 1}`}
              >
                <TbTrash size={18} />
              </button>
            </div>
            <div className={styles.prepaymentFieldGrid}>
              <label className={styles.fieldLabelled}>
                <span className={styles.fieldLabelText}>Amount (₹)</span>
                <input
                  className={styles.textInput}
                  type="number"
                  inputMode="numeric"
                  placeholder="e.g. 200000"
                  value={p.amount || ''}
                  onChange={(e) =>
                    onUpdatePartPayment(idx, 'amount', Math.max(0, Number(e.target.value) || 0))
                  }
                  disabled={!p.enabled}
                />
              </label>
              <label className={styles.fieldLabelled}>
                <span className={styles.fieldLabelText}>Payment date</span>
                <input
                  className={styles.textInput}
                  type="date"
                  min={disbursementDate || undefined}
                  value={p.date}
                  onChange={(e) => onUpdatePartPayment(idx, 'date', e.target.value)}
                  disabled={!p.enabled}
                />
              </label>
            </div>
            <JoinedButtonGroup<'emi' | 'tenure'>
              title="Apply the saving to"
              className={styles.prepaymentModeGroup}
              sizePrefix="xs"
              compact={true}
              data={[
                { id: `pp-${idx}-emi`, value: 'emi', title: 'Reduce EMI' },
                { id: `pp-${idx}-tenure`, value: 'tenure', title: 'Reduce Tenure' },
              ]}
              selectedValue={p.mode}
              updateSelectedValue={(value) => onUpdatePartPayment(idx, 'mode', value)}
            />
          </div>
        ))}
      </div>
    </section>
  );
};
