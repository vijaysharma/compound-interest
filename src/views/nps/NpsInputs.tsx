import React from 'react';
import ValuePicker from '../../components/ValuePicker';
import { DEFAULT_RATE_STEPS } from '../../data/valuePickerData';
import { NPS_MONTHLY_STEPS } from './types';
import type { NPSCalculationResult } from '../../utilities/npsCalculations';
import { getAnnuityTitle, getAnnuitySteps } from './npsInputHelpers';
import { NpsAgePicker } from './NpsAgePicker';
import styles from '../NpsCalculator.module.scss';
interface NpsInputsProps {
  currentAge: number;
  setCurrentAge: (age: number) => void;
  retirementAge: number;
  setRetirementAge: (age: number) => void;
  monthlyContribution: string;
  setMonthlyContribution: (val: string) => void;
  hasEmployerContribution: boolean;
  setHasEmployerContribution: (val: boolean) => void;
  employerMonthly: string;
  setEmployerMonthly: (val: string) => void;
  expectedRoi: number;
  setExpectedRoi: (val: number) => void;
  setAnnuityPercent: (val: number) => void;
  annuityRate: number;
  setAnnuityRate: (val: number) => void;
  npsResult: NPSCalculationResult;
}
export function NpsInputs({
  currentAge, setCurrentAge, retirementAge, setRetirementAge,
  monthlyContribution, setMonthlyContribution,
  hasEmployerContribution, setHasEmployerContribution,
  employerMonthly, setEmployerMonthly, expectedRoi, setExpectedRoi,
  setAnnuityPercent, annuityRate, setAnnuityRate, npsResult,
}: NpsInputsProps) {
  const annuityTitle = getAnnuityTitle(npsResult);
  const annuitySteps = getAnnuitySteps(npsResult);
  return (
    <div className={styles.inputsCol}>
      <div className={styles.fieldGroup}>
        <ValuePicker
          title="Your Monthly Investment in NPS Tier-1"
          value={monthlyContribution}
          onChange={setMonthlyContribution}
          stepData={NPS_MONTHLY_STEPS}
          min={500}
          max={500000}
          singleRow={true}
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={`${styles.fieldLabel} ${styles.checkboxLabel}`}>
          <span>
            <input
              type="checkbox"
              checked={hasEmployerContribution}
              onChange={(e) => setHasEmployerContribution(e.target.checked)}
              className={styles.checkboxInput}
            />
            Add Employer Contribution (Section 80CCD(2))
          </span>
        </label>
        {hasEmployerContribution && (
          <div className={styles.employerWrapper}>
            <ValuePicker
              title="Employer Monthly Contribution"
              value={employerMonthly}
              onChange={setEmployerMonthly}
              stepData={NPS_MONTHLY_STEPS}
              min={500}
              max={500000}
              singleRow={true}
            />
            <p className={styles.noteText}>
              Corporate employer contributions up to 10% of Basic + DA are tax-exempt under both Old and New Tax Regimes.
            </p>
          </div>
        )}
      </div>
      <NpsAgePicker
        currentAge={currentAge}
        setCurrentAge={setCurrentAge}
        retirementAge={retirementAge}
        setRetirementAge={setRetirementAge}
      />
      <div className={styles.fieldGroup}>
        <ValuePicker
          value={expectedRoi}
          symbol="%"
          symbolBg={false}
          symbolPosition="right"
          onChange={(v) => setExpectedRoi(parseFloat(v) || 10.0)}
          title="Expected Return (CAGR %)"
          titleStyle="merged"
          stepData={DEFAULT_RATE_STEPS}
          showWords={false}
          singleRow={true}
        />
      </div>
      <div className={styles.fieldGroup}>
        <ValuePicker
          title={annuityTitle}
          symbol="%"
          value={npsResult.annuityPercent}
          min={npsResult.minAnnuityPercent}
          max={100}
          defaultStep={5}
          stepData={annuitySteps}
          singleRow={true}
          showWords={false}
          onChange={(v) => {
            const num = parseInt(v, 10);
            const safeNum = Number.isFinite(num) ? num : npsResult.minAnnuityPercent;
            setAnnuityPercent(Math.min(100, Math.max(npsResult.minAnnuityPercent, safeNum)));
          }}
        />
        <p className={styles.annuitySplitNote}>
          {npsResult.annuityPercent}% Annuity / {npsResult.lumpSumPercent}% Lump Sum
        </p>
      </div>
      <div className={styles.fieldGroup}>
        <ValuePicker
          title="Expected Annuity Return Rate (Pension Yield %)"
          symbol="%"
          value={annuityRate}
          min={1}
          max={15}
          defaultStep={0.5}
          stepData={DEFAULT_RATE_STEPS}
          singleRow={true}
          showWords={false}
          onChange={(v) => setAnnuityRate(parseFloat(v) || 6.0)}
        />
      </div>
    </div>
  );
}
