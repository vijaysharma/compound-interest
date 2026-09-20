import React from 'react';
import { TbTrash } from 'react-icons/tb';
import JoinedButtonGroup from '../../components/JoinedButtonGroup';
import { RateChange } from './types';
import styles from '../EmiCalculator.module.scss';
interface EmiRateChangesCardProps {
  rateChanges: RateChange[];
  onAddRateChange: () => void;
  isAddRateChangeDisabled: boolean;
  onRemoveRateChange: (idx: number) => void;
  onUpdateRateChange: <K extends keyof RateChange>(idx: number, field: K, val: RateChange[K]) => void;
  disbursementDate: string;
}
export const EmiRateChangesCard: React.FC<EmiRateChangesCardProps> = ({
  rateChanges,
  onAddRateChange,
  isAddRateChangeDisabled,
  onRemoveRateChange,
  onUpdateRateChange,
  disbursementDate,
}) => {
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <p className={styles.cardEyebrow}>Repo Rate Shifts</p>
          <h2 className={styles.cardHeading}>Floating Interest Rate Changes</h2>
        </div>
        <button
          type="button"
          onClick={onAddRateChange}
          disabled={isAddRateChangeDisabled}
          className={styles.primaryButton}
        >
          + Add Rate Change
        </button>
      </div>
      <div className={styles.inputSection}>
        {rateChanges.length === 0 && (
          <p className={styles.emptyStateText}>
            No rate changes added yet. Model RBI rate increases or decreases during the loan tenure.
          </p>
        )}
        {rateChanges.map((r, idx) => (
          <div
            key={idx}
            className={`${styles.prepaymentItem} ${
              r.enabled ? styles.prepaymentItemEnabled : styles.prepaymentItemDisabled
            }`}
          >
            <div className={styles.prepaymentItemHeader}>
              <label className={styles.includeToggle}>
                <input
                  type="checkbox"
                  checked={r.enabled}
                  onChange={(e) => onUpdateRateChange(idx, 'enabled', e.target.checked)}
                  className={styles.checkbox}
                />
                <span className={styles.itemIndex}>Rate change #{idx + 1}</span>
              </label>
              <button
                type="button"
                onClick={() => onRemoveRateChange(idx)}
                className={styles.deleteButton}
                title={`Remove rate change #${idx + 1}`}
                aria-label={`Remove rate change #${idx + 1}`}
              >
                <TbTrash size={18} />
              </button>
            </div>
            <div className={styles.prepaymentFieldGrid}>
              <label className={styles.fieldLabelled}>
                <span className={styles.fieldLabelText}>New rate (%)</span>
                <input
                  className={styles.textInput}
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  placeholder="e.g. 8.5"
                  value={r.rate || ''}
                  min="0"
                  max="100"
                  onChange={(e) =>
                    onUpdateRateChange(
                      idx,
                      'rate',
                      Math.max(0, Math.min(100, Number(e.target.value) || 0))
                    )
                  }
                  disabled={!r.enabled}
                />
              </label>
              <label className={styles.fieldLabelled}>
                <span className={styles.fieldLabelText}>Effective from</span>
                <input
                  className={styles.textInput}
                  type="date"
                  min={disbursementDate || undefined}
                  value={r.date}
                  onChange={(e) => onUpdateRateChange(idx, 'date', e.target.value)}
                  disabled={!r.enabled}
                />
              </label>
            </div>
            <JoinedButtonGroup<'emi' | 'tenure'>
              title="Absorb the change by"
              className={styles.prepaymentModeGroup}
              sizePrefix="xs"
              compact={true}
              data={[
                { id: `rc-${idx}-emi`, value: 'emi', title: 'Adjust EMI' },
                { id: `rc-${idx}-tenure`, value: 'tenure', title: 'Adjust Tenure' },
              ]}
              selectedValue={r.mode}
              updateSelectedValue={(value) => onUpdateRateChange(idx, 'mode', value)}
            />
          </div>
        ))}
      </div>
    </section>
  );
};
