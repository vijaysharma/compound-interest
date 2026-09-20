import React from 'react';
import ValuePicker from '../../components/ValuePicker';
import JoinedButtonGroup from '../../components/JoinedButtonGroup';
import { DEFAULT_AMOUNT_STEPS } from '../../data/valuePickerData';
import { CHANGE_TYPE_BUTTONS } from './strategyPresets';
import { SwpConfig } from './types';
import styles from './StrategyCalculator.module.scss';
interface SwpConfigSubColumnProps {
  swpConfig: SwpConfig;
  onUpdateSwpConfig: (config: SwpConfig) => void;
}
export const SwpConfigSubColumn: React.FC<SwpConfigSubColumnProps> = ({
  swpConfig,
  onUpdateSwpConfig,
}) => {
  return (
    <div className={styles.configSubColumn}>
      <h3 className={styles.subColumnTitle}>SWP Withdrawal Strategy</h3>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor="swp-start-date">SWP Start Date</label>
        <input
          id="swp-start-date"
          type="date"
          className={styles.dateInput}
          value={swpConfig.startDate}
          onChange={(e) => onUpdateSwpConfig({ ...swpConfig, startDate: e.target.value })}
        />
      </div>
      <ValuePicker
        value={String(swpConfig.baseAmount)}
        onChange={(val) => onUpdateSwpConfig({ ...swpConfig, baseAmount: parseFloat(val) || 0 })}
        className={styles.fieldTight}
        title="Base SWP Withdrawal (₹/mo)"
        singleRow={true}
        stepData={DEFAULT_AMOUNT_STEPS}
      />
      <div className={styles.stepUpBox}>
        <div className={styles.checkboxRow}>
          <input
            id="swp-change-toggle"
            type="checkbox"
            checked={swpConfig.hasChange}
            onChange={(e) => onUpdateSwpConfig({ ...swpConfig, hasChange: e.target.checked })}
          />
          <label htmlFor="swp-change-toggle" className={styles.checkboxLabel}>
            Configure SWP Amount Change / Step-Up
          </label>
        </div>
        {swpConfig.hasChange && (
          <div className={styles.stepUpContent}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="swp-change-date">Effective From Date</label>
              <input
                id="swp-change-date"
                type="date"
                className={styles.dateInput}
                value={swpConfig.changeDate}
                onChange={(e) => onUpdateSwpConfig({ ...swpConfig, changeDate: e.target.value })}
              />
            </div>
            <JoinedButtonGroup
              title="Change Logic"
              data={CHANGE_TYPE_BUTTONS}
              selectedValue={swpConfig.changeType}
              updateSelectedValue={(val) => onUpdateSwpConfig({ ...swpConfig, changeType: val })}
              sizePrefix="sm"
            />
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="swp-change-val">
                {swpConfig.changeType === 'percentage' ? 'Percentage Increase (%)' : 'Fixed Increment (₹)'}
              </label>
              <input
                id="swp-change-val"
                type="number"
                className={styles.numInput}
                value={swpConfig.changeValue}
                onChange={(e) => onUpdateSwpConfig({ ...swpConfig, changeValue: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
