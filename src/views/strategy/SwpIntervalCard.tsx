import React from 'react';
import { FiTrash2, FiClock, FiTrendingUp } from 'react-icons/fi';
import ValuePicker from '../../components/ValuePicker';
import JoinedButtonGroup from '../../components/JoinedButtonGroup';
import { SwpInterval, SwpFrequency, StepUpType } from './column1Types';
import { SWP_FREQ_BUTTONS, STEP_UP_TYPE_BUTTONS, SWP_AMOUNT_PRESETS } from './strategyPresets';
import styles from './StrategyCalculator.module.scss';
interface SwpIntervalCardProps {
  interval: SwpInterval;
  phaseNumber: number;
  onUpdate: (updated: SwpInterval) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}
export const SwpIntervalCard: React.FC<SwpIntervalCardProps> = ({
  interval,
  phaseNumber,
  onUpdate,
  onRemove,
  canRemove,
}) => {
  return (
    <div className={styles.intervalCard}>
      <div className={styles.intervalCardHeader}>
        <div className={styles.intervalTitleGroup}>
          <span className={styles.phaseBadge}><FiClock /> Phase {phaseNumber}</span>
          <span className={styles.intervalDateSpan}>{interval.fromDate || 'Start'} &rarr; {interval.toDate || 'End'}</span>
        </div>
        {canRemove && (
          <button type="button" className={styles.removeIntervalBtn} onClick={() => onRemove(interval.id)} title="Delete phase">
            <FiTrash2 />
          </button>
        )}
      </div>
      <div className={styles.intervalDateRow}>
        <div className={styles.dateSubField}>
          <label htmlFor={`from-${interval.id}`} className={styles.fieldLabel}>From Date</label>
          <input id={`from-${interval.id}`} type="date" className={styles.dateInput} value={interval.fromDate} onChange={(e) => onUpdate({ ...interval, fromDate: e.target.value })} />
        </div>
        <div className={styles.dateSubField}>
          <label htmlFor={`to-${interval.id}`} className={styles.fieldLabel}>To Date</label>
          <input id={`to-${interval.id}`} type="date" className={styles.dateInput} value={interval.toDate} onChange={(e) => onUpdate({ ...interval, toDate: e.target.value })} />
        </div>
      </div>
      <div className={styles.fieldGroup}>
        <label htmlFor={`amt-${interval.id}`} className={styles.fieldLabel}>Withdrawal Amount ({interval.frequency}) (₹)</label>
        <input
          id={`amt-${interval.id}`}
          type="number"
          className={styles.numInput}
          value={interval.amount || ''}
          onChange={(e) => onUpdate({ ...interval, amount: Math.max(0, parseFloat(e.target.value) || 0) })}
          min="0"
          placeholder="e.g. 35000"
        />
      </div>
      <ValuePicker
        value={String(interval.amount)}
        onChange={(val) => onUpdate({ ...interval, amount: Math.max(0, parseFloat(val) || 0) })}
        className={styles.fieldTight}
        title="Quick Amount Presets"
        singleRow={true}
        stepData={SWP_AMOUNT_PRESETS}
      />
      <JoinedButtonGroup<SwpFrequency>
        title="Withdrawal Frequency"
        data={SWP_FREQ_BUTTONS}
        selectedValue={interval.frequency}
        updateSelectedValue={(freq) => onUpdate({ ...interval, frequency: freq })}
        sizePrefix="sm"
      />
      <div className={styles.stepUpBox}>
        <div className={styles.checkboxRow}>
          <input
            id={`stepup-toggle-${interval.id}`}
            type="checkbox"
            checked={interval.enableStepUp}
            onChange={(e) => onUpdate({ ...interval, enableStepUp: e.target.checked })}
          />
          <label htmlFor={`stepup-toggle-${interval.id}`} className={styles.checkboxLabel}>
            <FiTrendingUp className={styles.inlineIcon} />
            <span>Enable Annual Step-Up / Yearly Increase</span>
          </label>
        </div>
        {interval.enableStepUp && (
          <div className={styles.stepUpContent}>
            <JoinedButtonGroup<StepUpType>
              title="Increase Mode"
              data={STEP_UP_TYPE_BUTTONS}
              selectedValue={interval.stepUpType}
              updateSelectedValue={(mode) => onUpdate({ ...interval, stepUpType: mode })}
              sizePrefix="sm"
            />
            <div className={styles.fieldGroup}>
              <label htmlFor={`stepval-${interval.id}`} className={styles.fieldLabel}>
                {interval.stepUpType === 'percentage' ? 'Yearly Increase (%)' : 'Yearly Increment (₹)'}
              </label>
              <input
                id={`stepval-${interval.id}`}
                type="number"
                className={styles.numInput}
                value={interval.stepUpValue}
                onChange={(e) => onUpdate({ ...interval, stepUpValue: Math.max(0, parseFloat(e.target.value) || 0) })}
                min="0"
                placeholder={interval.stepUpType === 'percentage' ? 'e.g. 5' : 'e.g. 5000'}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
