import React from 'react';
import ValuePicker from '../../components/ValuePicker';
import { RT } from '../../types/types';
import { DEFAULT_RATE_STEPS, getTenureStepData } from '../../data/valuePickerData';
import styles from '../CalculatorPage.module.scss';
interface FixedRateSipInputsProps {
  title?: string;
  pa: string;
  setPa: (val: string) => void;
  rt: RT;
  setRt: React.Dispatch<React.SetStateAction<RT>>;
  invType: string;
  setInvType: (val: string) => void;
}
const stepData = [
  { id: 'p1', value: '50000000', title: '5Cr' },
  { id: 'p2', value: '5000000', title: '50L' },
  { id: 'p3', value: '500000', title: '5L' },
  { id: 'p4', value: '50000', title: '50K' },
  { id: 'p5', value: '5000', title: '5K' },
  { id: 'p6', value: '500', title: '500' },
  { id: 'p7', value: '50', title: '50' },
];
export const FixedRateSipInputs: React.FC<FixedRateSipInputsProps> = ({
  title,
  pa,
  setPa,
  rt,
  setRt,
  invType,
  setInvType,
}) => {
  return (
    <div className={styles.inputsCol}>
      <div className={styles.formStack}>
        {title && <h5 className={styles.sectionTitle}>{title}</h5>}
        <ValuePicker
          className={styles.field}
          value={pa}
          onChange={setPa}
          activeTab={invType}
          onTabChange={setInvType}
          stepData={stepData}
          tabs={[
            { id: 'my', title: 'Monthly amount' },
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
          title="Expected return rate (p.a)"
          titleStyle="merged"
          stepData={DEFAULT_RATE_STEPS}
          showWords={false}
          singleRow={true}
        />
        <ValuePicker
          className={styles.fieldLast}
          value={rt.tenure}
          symbol={null}
          onChange={(newTenure) => setRt((prev) => ({ ...prev, tenure: newTenure }))}
          title="Time period"
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
      </div>
    </div>
  );
};
