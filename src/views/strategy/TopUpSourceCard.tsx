import React from 'react';
import { FiTrash2, FiLayers } from 'react-icons/fi';
import ValuePicker from '../../components/ValuePicker';
import JoinedButtonGroup from '../../components/JoinedButtonGroup';
import { RecurringTopUpSource, TopUpFrequency } from './column1Types';
import { TOPUP_FREQ_BUTTONS, TOPUP_AMOUNT_PRESETS } from './strategyPresets';
import styles from './StrategyCalculator.module.scss';
interface TopUpSourceCardProps {
  source: RecurringTopUpSource;
  sourceIndex: number;
  onUpdate: (updated: RecurringTopUpSource) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}
export const TopUpSourceCard: React.FC<TopUpSourceCardProps> = ({
  source,
  sourceIndex,
  onUpdate,
  onRemove,
  canRemove,
}) => {
  return (
    <div className={`${styles.intervalCard} ${!source.enabled ? styles.disabledSourceCard : ''}`}>
      <div className={styles.intervalCardHeader}>
        <div className={styles.intervalTitleGroup}>
          <span className={styles.sourceIndexBadge}>
            <FiLayers /> Source {sourceIndex + 1}
          </span>
          <input
            type="text"
            className={styles.sourceNameInlineInput}
            value={source.name}
            onChange={(e) => onUpdate({ ...source, name: e.target.value })}
            placeholder="Source Name (e.g. Quarterly Bonus)..."
          />
        </div>
        <div className={styles.sourceActionButtons}>
          <label className={styles.toggleCheckboxWrap}>
            <input
              type="checkbox"
              checked={source.enabled}
              onChange={(e) => onUpdate({ ...source, enabled: e.target.checked })}
            />
            <span className={styles.toggleText}>{source.enabled ? 'Active' : 'Paused'}</span>
          </label>
          {canRemove && (
            <button
              type="button"
              className={styles.removeIntervalBtn}
              onClick={() => onRemove(source.id)}
              title="Delete source"
            >
              <FiTrash2 />
            </button>
          )}
        </div>
      </div>
      <div className={styles.fieldGroup}>
        <label htmlFor={`tu-amt-${source.id}`} className={styles.fieldLabel}>
          Recurring Cash Infusion Amount (₹)
        </label>
        <input
          id={`tu-amt-${source.id}`}
          type="number"
          className={styles.numInput}
          value={source.amount || ''}
          onChange={(e) => onUpdate({ ...source, amount: Math.max(0, parseFloat(e.target.value) || 0) })}
          min="0"
          placeholder="e.g. 50000"
        />
      </div>
      <ValuePicker
        value={String(source.amount)}
        onChange={(val) => onUpdate({ ...source, amount: Math.max(0, parseFloat(val) || 0) })}
        className={styles.fieldTight}
        title="Top-Up Presets"
        singleRow={true}
        stepData={TOPUP_AMOUNT_PRESETS}
      />
      <JoinedButtonGroup<TopUpFrequency>
        title="Infusion Frequency"
        data={TOPUP_FREQ_BUTTONS}
        selectedValue={source.frequency}
        updateSelectedValue={(freq) => onUpdate({ ...source, frequency: freq })}
        sizePrefix="sm"
      />
      <div className={styles.intervalDateRow}>
        <div className={styles.dateSubField}>
          <label htmlFor={`tu-start-${source.id}`} className={styles.fieldLabel}>
            Infusion Start Date
          </label>
          <input
            id={`tu-start-${source.id}`}
            type="date"
            className={styles.dateInput}
            value={source.startDate}
            onChange={(e) => onUpdate({ ...source, startDate: e.target.value })}
          />
        </div>
        <div className={styles.dateSubField}>
          <label htmlFor={`tu-end-${source.id}`} className={styles.fieldLabel}>
            End Date (Optional)
          </label>
          <input
            id={`tu-end-${source.id}`}
            type="date"
            className={styles.dateInput}
            value={source.endDate || ''}
            onChange={(e) => onUpdate({ ...source, endDate: e.target.value || undefined })}
            placeholder="Continuous if blank"
          />
        </div>
      </div>
    </div>
  );
};
