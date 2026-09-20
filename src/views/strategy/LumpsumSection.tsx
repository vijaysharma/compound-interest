import React from 'react';
import ValuePicker from '../../components/ValuePicker';
import { STRATEGY_AMOUNT_PRESETS } from './strategyPresets';
import styles from './StrategyCalculator.module.scss';
interface LumpsumSectionProps {
  investmentDate: string;
  onInvestmentDateChange: (date: string) => void;
  investmentAmount: number;
  onInvestmentAmountChange: (amount: number) => void;
}
export const LumpsumSection: React.FC<LumpsumSectionProps> = ({
  investmentDate,
  onInvestmentDateChange,
  investmentAmount,
  onInvestmentAmountChange,
}) => {
  return (
    <section className={styles.stageCard}>
      <div className={styles.stageHeader}>
        <div className={styles.stageNumber}>01</div>
        <div className={styles.stageTitleGroup}>
          <h3 className={styles.stageTitle}>Initial Lumpsum Deployment</h3>
          <span className={styles.stageSubtitle}>Core capital allocation and inception date</span>
        </div>
      </div>
      <div className={styles.stageFields}>
        <div className={styles.datePickerGroup}>
          <label className={styles.fieldLabel} htmlFor="initial-lumpsum-date">
            Investment Purchase Date
          </label>
          <input
            id="initial-lumpsum-date"
            type="date"
            className={styles.dateInput}
            value={investmentDate}
            onChange={(e) => onInvestmentDateChange(e.target.value)}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="initial-lumpsum-amount">
            Investment Principal Amount (₹)
          </label>
          <input
            id="initial-lumpsum-amount"
            type="number"
            className={styles.numInput}
            value={investmentAmount || ''}
            onChange={(e) => onInvestmentAmountChange(Math.max(0, parseFloat(e.target.value) || 0))}
            placeholder="e.g. 5000000"
            min="0"
          />
        </div>
        <ValuePicker
          value={String(investmentAmount)}
          onChange={(val) => onInvestmentAmountChange(Math.max(0, parseFloat(val) || 0))}
          className={styles.fieldTight}
          title="Quick Amount Presets"
          singleRow={true}
          stepData={STRATEGY_AMOUNT_PRESETS}
        />
      </div>
    </section>
  );
};
