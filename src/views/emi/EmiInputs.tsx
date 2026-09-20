import React from 'react';
import ValuePicker from '../../components/ValuePicker';
import { RT, StepAmountType } from '../../types/types';
import { DEFAULT_RATE_STEPS, getTenureStepData } from '../../data/valuePickerData';
import styles from '../EmiCalculator.module.scss';
interface EmiInputsProps {
  loanAmount: string;
  setLoanAmount: (val: string) => void;
  rt: RT;
  setRt: React.Dispatch<React.SetStateAction<RT>>;
  disbursementDate: string;
  onDisbursementDateChange: (newDate: string) => void;
  emiDate: number;
  setEmiDate: (val: number) => void;
  includePrincipalInFirstEmi: boolean;
  setIncludePrincipalInFirstEmi: (val: boolean) => void;
}
const stepData: StepAmountType[] = [
  { id: 'p1', value: '10000000', title: '1Cr' },
  { id: 'p2', value: '1000000', title: '10L' },
  { id: 'p3', value: '100000', title: '1L' },
  { id: 'p4', value: '10000', title: '10K' },
  { id: 'p5', value: '1000', title: '1K' },
  { id: 'p6', value: '100', title: '100' },
  { id: 'p7', value: '10', title: '10' },
];
export const EmiInputs: React.FC<EmiInputsProps> = ({
  loanAmount,
  setLoanAmount,
  rt,
  setRt,
  disbursementDate,
  onDisbursementDateChange,
  emiDate,
  setEmiDate,
  includePrincipalInFirstEmi,
  setIncludePrincipalInFirstEmi,
}) => {
  return (
    <div className={styles.inputsCol}>
      <div className={styles.inputSection}>
        <ValuePicker
          className={styles.fieldTight}
          value={loanAmount}
          symbolBg={false}
          onChange={setLoanAmount}
          title="Loan amount"
          titleStyle="merged"
          stepData={stepData}
          singleRow={true}
        />
        <ValuePicker
          className={styles.fieldTight}
          value={rt.roi}
          symbol="%"
          symbolBg={false}
          symbolPosition="right"
          onChange={(newRoi) => setRt((prev) => ({ ...prev, roi: newRoi }))}
          title="Interest rate"
          titleStyle="merged"
          stepData={DEFAULT_RATE_STEPS}
          showWords={false}
          singleRow={true}
        />
        <ValuePicker
          className={styles.fieldTight}
          value={rt.tenure}
          symbol={null}
          onChange={(newTenure) => setRt((prev) => ({ ...prev, tenure: newTenure }))}
          title="Loan tenure"
          titleStyle="merged"
          stepData={getTenureStepData(rt.tenureFormat)}
          endAdornment={
            <select
              className={styles.tenureFormatSelect}
              value={rt.tenureFormat}
              onChange={(e) =>
                setRt((prev) => ({ ...prev, tenureFormat: e.target.value as 'y' | 'm' }))
              }
              aria-label="Tenure Unit"
            >
              <option value="y">Years</option>
              <option value="m">Months</option>
            </select>
          }
          showWords={false}
          singleRow={true}
        />
        <ValuePicker
          variant="paired"
          sourceBadgeText="Disbursed"
          targetBadgeText="EMI Day"
          sourceSlot={
            <input
              id="disbursement-date"
              className={styles.dateInput}
              title="Disbursement Date"
              type="date"
              value={disbursementDate}
              onChange={(e) => onDisbursementDateChange(e.target.value)}
            />
          }
          targetSlot={
            <select
              id="emi-date"
              className={styles.dayInput}
              title="EMI Deduction Date (Day of Month)"
              value={emiDate}
              onChange={(e) => setEmiDate(Number(e.target.value))}
              aria-label="EMI Deduction Day"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          }
        />
        <label className={styles.advanceEmiLabel}>
          <input
            type="checkbox"
            title="Include Principal Payment in First EMI"
            className={styles.checkbox}
            checked={includePrincipalInFirstEmi}
            onChange={(e) => setIncludePrincipalInFirstEmi(e.target.checked)}
          />
          <span className={styles.checkboxText}>
            Include principal repayment in prorated first EMI
          </span>
        </label>
      </div>
    </div>
  );
};
