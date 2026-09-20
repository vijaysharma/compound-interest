import React from 'react';
import ValuePicker from '../../components/ValuePicker';
import type { RT } from '../../types/types';
import { DEFAULT_RATE_STEPS, getTenureStepData } from '../../data/valuePickerData';
import { STEP_AMOUNT } from '../../data/default_data';
import styles from '../CalculatorPage.module.scss';
interface FdInputsProps {
  pa: string;
  setPa: (val: string) => void;
  rt: RT;
  setRt: React.Dispatch<React.SetStateAction<RT>>;
  invType: string;
  setInvType: (val: string) => void;
}
export function FdInputs({ pa, setPa, rt, setRt, invType, setInvType }: FdInputsProps) {
  return (
    <div className={styles.inputsCol}>
      <div className={styles.formStack}>
        <ValuePicker
          className={styles.field}
          value={pa}
          onChange={setPa}
          activeTab={invType}
          onTabChange={setInvType}
          stepData={STEP_AMOUNT}
          tabs={[
            { id: 'inv', title: 'One time amount' },
            { id: 'tgt', title: 'Target amount' },
          ]}
          singleRow={true}
          tabSize="sm"
        />
        <ValuePicker
          className={styles.field}
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
          className={styles.field}
          value={rt.tenure}
          symbol={null}
          onChange={(newTenure) => setRt((prev) => ({ ...prev, tenure: newTenure }))}
          title="Tenure"
          titleStyle="merged"
          stepData={getTenureStepData(rt.tenureFormat)}
          endAdornment={
            <select
              className={styles.tenureFormatSelect}
              value={rt.tenureFormat}
              onChange={(e) => setRt((prev) => ({ ...prev, tenureFormat: e.target.value as 'y' | 'm' }))}
              aria-label="Tenure Unit"
            >
              <option value="m">Months</option>
              <option value="y">Years</option>
            </select>
          }
          showWords={false}
          singleRow={true}
        />
      </div>
    </div>
  );
}
