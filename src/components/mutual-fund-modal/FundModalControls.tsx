import React, { useCallback } from 'react';
import { FiX } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import type { InvestmentType } from './types';
import styles from '../MutualFundDetailModal.module.scss';

const STEP_BUTTONS = [
  { label: '+100', value: 100 },
  { label: '+1K', value: 1000 },
  { label: '+5K', value: 5000 },
  { label: '+50K', value: 50000 },
  { label: '+5L', value: 500000 },
  { label: '+1Cr', value: 10000000 },
];

export interface FundModalControlsProps {
  investmentType: InvestmentType;
  setInvestmentType: (type: InvestmentType) => void;
  investmentValue: string;
  setInvestmentValue: (val: string) => void;
}

export const FundModalControls: React.FC<FundModalControlsProps> = React.memo(
  ({
    investmentType,
    setInvestmentType,
    investmentValue,
    setInvestmentValue,
  }) => {
    const numericVal = parseFloat(investmentValue) || 0;

    const handleStepAdd = useCallback(
      (addVal: number) => {
        const next = Math.max(100, numericVal + addVal);
        setInvestmentValue(String(next));
      },
      [numericVal, setInvestmentValue]
    );

    const handleClear = useCallback(() => {
      setInvestmentValue('0');
    }, [setInvestmentValue]);

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        // Strip out commas and non-digits
        const raw = e.target.value.replace(/[^\d]/g, '');
        setInvestmentValue(raw);
      },
      [setInvestmentValue]
    );

    const formattedDisplayValue = numericVal > 0 ? numericVal.toLocaleString('en-IN') : investmentValue === '' ? '' : '0';

    return (
      <div className={styles.investmentCard}>
        <div className={styles.investmentCardHeader}>
          <h3 className={styles.investmentCardTitle}>Investment</h3>
        </div>

        {/* Tab pill toggle */}
        <div className={styles.investmentTabPillWrap} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={investmentType === 'lumpsum'}
            className={`${styles.investmentTabPill} ${
              investmentType === 'lumpsum' ? styles.investmentTabPillActive : ''
            }`}
            onClick={() => {
              if (investmentType !== 'lumpsum') {
                setInvestmentType('lumpsum');
                if (numericVal < 1000) setInvestmentValue('100000');
              }
            }}
          >
            Lumpsum
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={investmentType === 'sip'}
            className={`${styles.investmentTabPill} ${
              investmentType === 'sip' ? styles.investmentTabPillActive : ''
            }`}
            onClick={() => {
              if (investmentType !== 'sip') {
                setInvestmentType('sip');
                if (numericVal > 50000) setInvestmentValue('5000');
              }
            }}
          >
            Monthly SIP
          </button>
        </div>

        {/* Input section */}
        <div className={styles.investmentInputGroup}>
          <label className={styles.investmentInputLabel} htmlFor="investment-amount-input">
            Investment amount (₹)
          </label>
          <div className={styles.investmentInputBoxWrap}>
            <span className={styles.investmentCurrencyPrefix} aria-hidden="true">
              <FaRupeeSign />
            </span>
            <input
              id="investment-amount-input"
              type="text"
              inputMode="numeric"
              className={styles.investmentAmountInput}
              value={formattedDisplayValue}
              onChange={handleInputChange}
              placeholder="0"
            />
            {numericVal > 0 && (
              <button
                type="button"
                className={styles.investmentClearBtn}
                onClick={handleClear}
                aria-label="Clear amount"
              >
                <FiX />
              </button>
            )}
          </div>
        </div>

        {/* Quick add step pills */}
        <div className={styles.investmentStepPillsRow}>
          {STEP_BUTTONS.map((btn) => (
            <button
              key={btn.label}
              type="button"
              className={styles.investmentStepPill}
              onClick={() => handleStepAdd(btn.value)}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    );
  }
);

FundModalControls.displayName = 'FundModalControls';
