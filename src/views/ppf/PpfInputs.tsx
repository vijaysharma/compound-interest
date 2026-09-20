import React from 'react';
import ValuePicker from '../../components/ValuePicker';
import { DEFAULT_RATE_STEPS } from '../../data/valuePickerData';
import {
  CURRENT_PPF_RATE,
  MAX_PPF_ANNUAL_DEPOSIT,
  MIN_PPF_ANNUAL_DEPOSIT,
} from '../../data/ppfRates';
import {
  PPF_STEPS_ANNUAL,
  PPF_STEPS_MONTHLY,
  PPF_START_YEAR_OPTIONS,
} from './constants';
import { PpfTimingOptions } from './PpfTimingOptions';
import type {
  PPFDepositTiming,
  PPFExtensionMode,
  PPFFrequency,
} from '../../utilities/ppfCalculations';
import styles from '../PpfCalculator.module.scss';
interface PpfInputsProps {
  frequency: PPFFrequency;
  setFrequency: (freq: PPFFrequency) => void;
  depositAmount: string;
  setDepositAmount: (val: string) => void;
  depositTiming: PPFDepositTiming;
  setDepositTiming: (timing: PPFDepositTiming) => void;
  startYear: number;
  setStartYear: (year: number) => void;
  extensionBlocks: number;
  setExtensionBlocks: (blocks: number) => void;
  extensionMode: PPFExtensionMode;
  setExtensionMode: (mode: PPFExtensionMode) => void;
  projectedRate: number;
  setProjectedRate: (rate: number) => void;
}
export function PpfInputs({
  frequency, setFrequency, depositAmount, setDepositAmount,
  depositTiming, setDepositTiming, startYear, setStartYear,
  extensionBlocks, setExtensionBlocks, extensionMode, setExtensionMode,
  projectedRate, setProjectedRate,
}: PpfInputsProps) {
  return (
    <div className={styles.inputsCol}>
      <div className={styles.fieldGroup}>
        <ValuePicker
          value={depositAmount}
          onChange={setDepositAmount}
          activeTab={frequency}
          symbolBg={false}
          onTabChange={(tabId) => {
            const newFreq = tabId as PPFFrequency;
            setFrequency(newFreq);
            setDepositAmount(newFreq === 'monthly' ? '12500' : '150000');
          }}
          stepData={frequency === 'yearly' ? PPF_STEPS_ANNUAL : PPF_STEPS_MONTHLY}
          tabs={[
            { id: 'yearly', title: 'Annual deposit' },
            { id: 'monthly', title: 'Monthly deposit' },
          ]}
          min={frequency === 'yearly' ? MIN_PPF_ANNUAL_DEPOSIT : 100}
          max={frequency === 'yearly' ? MAX_PPF_ANNUAL_DEPOSIT : 12500}
          singleRow={true}
          tabSize="sm"
        />
      </div>
      <PpfTimingOptions
        depositTiming={depositTiming}
        setDepositTiming={setDepositTiming}
      />
      <ValuePicker
        variant="paired"
        sourceBadgeText="Account Opening Financial Year"
        targetBadgeText="Account Tenure &amp; Extensions"
        sourceSlot={
          <select
            id="ppf-start-year"
            value={startYear}
            onChange={(e) => setStartYear(Number(e.target.value))}
            className={styles.numberInput}
            aria-label="PPF Start Year"
          >
            {PPF_START_YEAR_OPTIONS.map((opt) => (
              <option key={opt.year} value={opt.year}>{opt.label}</option>
            ))}
          </select>
        }
        targetSlot={
          <select
            id="ppf-extensions"
            value={extensionBlocks}
            onChange={(e) => setExtensionBlocks(Number(e.target.value))}
            className={styles.numberInput}
            aria-label="PPF Extension Blocks"
          >
            <option value={0}>15 Years (Base Tenure)</option>
            <option value={1}>20 Years (1 Extension — 5 Yrs)</option>
            <option value={2}>25 Years (2 Extensions — 10 Yrs)</option>
            <option value={3}>30 Years (3 Extensions — 15 Yrs)</option>
            <option value={4}>35 Years (4 Extensions — 20 Yrs)</option>
            <option value={5}>40 Years (5 Extensions — 25 Yrs)</option>
          </select>
        }
      />
      {extensionBlocks > 0 && (
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Extension Investment Mode</label>
          <div className={styles.timingGrid}>
            <button
              type="button"
              className={`${styles.timingBtn} ${extensionMode === 'with_contribution' ? styles.timingBtnActive : ''}`}
              onClick={() => setExtensionMode('with_contribution')}
            >
              <span>With Ongoing Deposits</span>
              <span>Continue contributing annually</span>
            </button>
            <button
              type="button"
              className={`${styles.timingBtn} ${extensionMode === 'without_contribution' ? styles.timingBtnActive : ''}`}
              onClick={() => setExtensionMode('without_contribution')}
            >
              <span>Without Investing More</span>
              <span>Earn interest on accumulated balance only</span>
            </button>
          </div>
        </div>
      )}
      <div className={styles.fieldGroup}>
        <ValuePicker
          title={`Projected Future Rate (Current: ${CURRENT_PPF_RATE}%)`}
          symbol="%"
          value={projectedRate}
          min={1}
          max={15}
          defaultStep={0.1}
          stepData={DEFAULT_RATE_STEPS}
          singleRow={true}
          showWords={false}
          onChange={(v) => setProjectedRate(parseFloat(v) || 7.1)}
        />
      </div>
    </div>
  );
}
