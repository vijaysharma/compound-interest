import React from 'react';
import ValuePicker from '../../components/ValuePicker';
import { STRATEGY_AMOUNT_PRESETS, MAX_INITIAL_FUNDS } from './strategyPresets';
import { StrategyFundSelector } from './StrategyFundSelector';
import { SelectedFund } from './types';
import styles from './StrategyCalculator.module.scss';
interface StepALumpsumSectionProps {
  investmentDate: string;
  onInvestmentDateChange: (date: string) => void;
  investmentAmount: string;
  onInvestmentAmountChange: (amount: string) => void;
  sourceFunds: SelectedFund[];
  onUpdateSourceFunds: (funds: SelectedFund[]) => void;
}
export const StepALumpsumSection: React.FC<StepALumpsumSectionProps> = ({
  investmentDate,
  onInvestmentDateChange,
  investmentAmount,
  onInvestmentAmountChange,
  sourceFunds,
  onUpdateSourceFunds,
}) => {
  return (
    <section className={styles.stageCard}>
      <div className={styles.stageHeader}>
        <div className={styles.stageNumber}>Step A</div>
        <div className={styles.stageTitleGroup}>
          <h2 className={styles.stageTitle}>Initial Lumpsum Deployment</h2>
          <span className={styles.stageSubtitle}>Core wealth allocation across primary mutual funds</span>
        </div>
      </div>
      <div className={styles.stageFields}>
        <div className={styles.datePickerGroup}>
          <label className={styles.fieldLabel} htmlFor="initial-inv-date">Investment Start Date</label>
          <input
            id="initial-inv-date"
            type="date"
            className={styles.dateInput}
            value={investmentDate}
            onChange={(e) => onInvestmentDateChange(e.target.value)}
          />
        </div>
        <ValuePicker
          value={investmentAmount}
          onChange={onInvestmentAmountChange}
          className={styles.fieldTight}
          title="Initial Investment Amount"
          singleRow={true}
          stepData={STRATEGY_AMOUNT_PRESETS}
        />
        <StrategyFundSelector
          title="Select Primary Portfolio Funds"
          funds={sourceFunds}
          maxFunds={MAX_INITIAL_FUNDS}
          onUpdateFunds={onUpdateSourceFunds}
        />
      </div>
    </section>
  );
};
