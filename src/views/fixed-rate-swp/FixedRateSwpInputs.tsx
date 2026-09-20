import React from 'react';
import ValuePicker from '../../components/ValuePicker';
import JoinedButtonGroup from '../../components/JoinedButtonGroup';
import { RT } from '../../types/types';
import { DEFAULT_RATE_STEPS, getTenureStepData } from '../../data/valuePickerData';
import styles from '../CalculatorPage.module.scss';
interface FixedRateSwpInputsProps {
  title?: string;
  pa: string;
  setPa: (v: string) => void;
  wa: string;
  setWa: (v: string) => void;
  rt: string;
  setRt: (v: string) => void;
  t: RT;
  setT: React.Dispatch<React.SetStateAction<RT>>;
  irt: string;
  setIRt: (v: string) => void;
  inflationFreq: string;
  setInflationFreq: (v: string) => void;
}
const invStepData = [
  { id: 'ip1', value: '50000000', title: '5Cr' },
  { id: 'ip2', value: '5000000', title: '50L' },
  { id: 'ip3', value: '500000', title: '5L' },
  { id: 'ip4', value: '50000', title: '50K' },
  { id: 'ip5', value: '5000', title: '5K' },
  { id: 'ip6', value: '500', title: '500' },
  { id: 'ip7', value: '50', title: '50' },
];
const wdStepData = [
  { id: 'wp1', value: '1000000', title: '10L' },
  { id: 'wp2', value: '100000', title: '1L' },
  { id: 'wp3', value: '50000', title: '50K' },
  { id: 'wp4', value: '10000', title: '10K' },
  { id: 'wp5', value: '1000', title: '1K' },
  { id: 'wp6', value: '100', title: '100' },
  { id: 'wp7', value: '10', title: '10' },
];
const inflationFreqData = [
  { id: 'ir1', title: '6M', value: '6' },
  { id: 'ir2', title: '1Y', value: '12' },
  { id: 'ir3', title: '2Y', value: '24' },
  { id: 'ir4', title: '3Y', value: '36' },
  { id: 'ir5', title: '4Y', value: '48' },
  { id: 'ir6', title: '5Y', value: '60' },
];
export const FixedRateSwpInputs: React.FC<FixedRateSwpInputsProps> = ({
  title,
  pa,
  setPa,
  wa,
  setWa,
  rt,
  setRt,
  t,
  setT,
  irt,
  setIRt,
  inflationFreq,
  setInflationFreq,
}) => {
  return (
    <div className={styles.inputsCol}>
      <div className={styles.formStack}>
        {title && <h5 className={styles.sectionTitle}>{title}</h5>}
        <ValuePicker
          className={styles.field}
          value={pa}
          onChange={setPa}
          title="Invested Amount"
          stepData={invStepData}
          singleRow={true}
        />
        <ValuePicker
          className={styles.field}
          value={wa}
          onChange={setWa}
          stepData={wdStepData}
          title="Withdrawal amount per month"
          singleRow={true}
        />
        <ValuePicker
          className={styles.field}
          value={rt}
          symbol="%"
          symbolBg={false}
          symbolPosition="right"
          onChange={setRt}
          title="Expected return rate (p.a.)"
          titleStyle="merged"
          stepData={DEFAULT_RATE_STEPS}
          showWords={false}
          singleRow={true}
        />
        <ValuePicker
          className={styles.field}
          value={t.tenure}
          symbol={null}
          onChange={(newT) => setT((prev) => ({ ...prev, tenure: newT }))}
          title="Time period"
          titleStyle="merged"
          stepData={getTenureStepData(t.tenureFormat)}
          endAdornment={
            <select
              className={styles.tenureFormatSelect}
              value={t.tenureFormat}
              onChange={(e) =>
                setT((prev) => ({ ...prev, tenureFormat: e.target.value as 'y' | 'm' }))
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
          className={styles.field}
          title="Inflation rate"
          symbol="%"
          value={irt}
          stepData={DEFAULT_RATE_STEPS}
          singleRow={true}
          defaultStep={0.5}
          showWords={false}
          onChange={setIRt}
        />
        <JoinedButtonGroup
          title="Inflation calculated per"
          className={styles.fieldLast}
          selectedValue={inflationFreq}
          updateSelectedValue={setInflationFreq}
          sizePrefix="sm"
          data={inflationFreqData}
        />
      </div>
    </div>
  );
};
