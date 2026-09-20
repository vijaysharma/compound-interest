import React from 'react';
import ValuePicker from '../../components/ValuePicker';
import JoinedButtonGroup from '../../components/JoinedButtonGroup';
import { DEFAULT_AMOUNT_STEPS } from '../../data/valuePickerData';
import { FREQUENCY_BUTTON_DATA, MAX_SIP_FUNDS } from './strategyPresets';
import { StrategyFundSelector } from './StrategyFundSelector';
import { SipConfig, SelectedFund } from './types';
import styles from './StrategyCalculator.module.scss';
interface SipConfigSubColumnProps {
  sipConfig: SipConfig;
  onUpdateSipConfig: (config: SipConfig) => void;
  sipFunds: SelectedFund[];
  onUpdateSipFunds: (funds: SelectedFund[]) => void;
}
export const SipConfigSubColumn: React.FC<SipConfigSubColumnProps> = ({
  sipConfig,
  onUpdateSipConfig,
  sipFunds,
  onUpdateSipFunds,
}) => {
  return (
    <div className={styles.configSubColumn}>
      <div className={styles.sipHeaderRow}>
        <h3 className={styles.subColumnTitle}>Parallel SIP Accumulation</h3>
        <label className={styles.toggleSwitch}>
          <input
            type="checkbox"
            checked={sipConfig.enabled}
            onChange={(e) => onUpdateSipConfig({ ...sipConfig, enabled: e.target.checked })}
          />
          <span className={styles.slider} />
        </label>
      </div>
      {sipConfig.enabled && (
        <div className={styles.sipFieldsWrap}>
          <div className={styles.checkboxRow}>
            <input
              id="link-swp-toggle"
              type="checkbox"
              checked={sipConfig.linkToSwp}
              onChange={(e) => onUpdateSipConfig({ ...sipConfig, linkToSwp: e.target.checked })}
            />
            <label htmlFor="link-swp-toggle" className={styles.checkboxLabel}>
              Link SIP directly to Net SWP proceeds
            </label>
          </div>
          {!sipConfig.linkToSwp && (
            <>
              <ValuePicker
                value={String(sipConfig.amount)}
                onChange={(val) => onUpdateSipConfig({ ...sipConfig, amount: parseFloat(val) || 0 })}
                className={styles.fieldTight}
                title="Parallel SIP Amount (₹/mo)"
                singleRow={true}
                stepData={DEFAULT_AMOUNT_STEPS}
              />
              <JoinedButtonGroup
                title="Step-Up Frequency"
                data={FREQUENCY_BUTTON_DATA}
                selectedValue={sipConfig.stepUpFrequency}
                updateSelectedValue={(val) => onUpdateSipConfig({ ...sipConfig, stepUpFrequency: val })}
                sizePrefix="sm"
              />
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="sip-step-percent">Periodic Step-Up (%)</label>
                <input
                  id="sip-step-percent"
                  type="number"
                  className={styles.numInput}
                  value={sipConfig.stepUpPercent}
                  onChange={(e) => onUpdateSipConfig({ ...sipConfig, stepUpPercent: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </>
          )}
          <StrategyFundSelector
            title="Select Destination SIP Portfolio Funds"
            funds={sipFunds}
            maxFunds={MAX_SIP_FUNDS}
            onUpdateFunds={onUpdateSipFunds}
          />
        </div>
      )}
    </div>
  );
};
