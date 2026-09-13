'use client';
import React, { useMemo } from 'react';
import ValuePicker from './ValuePicker';
import { RT, StepAmountType } from '../types/types';
import styles from './RateTenurePicker.module.scss';
export type RateTenureState = RT;
export interface RateTenurePickerProps {
  rt?: RT;
  setRt?: React.Dispatch<React.SetStateAction<RT>> | ((newRt: RT) => void);
  roi?: string | number;
  onChangeRoi?: (newRoi: string) => void;
  tenure?: string | number;
  onChangeTenure?: (newTenure: string) => void;
  tenureFormat?: 'y' | 'm';
  onChangeTenureFormat?: (newFormat: 'y' | 'm') => void;
  rateTitle?: string;
  tenureTitle?: string;
  rateStepData?: StepAmountType[];
  tenureStepData?: StepAmountType[];
  className?: string;
  rateClassName?: string;
  tenureClassName?: string;
  showTenureSelect?: boolean;
}
const DEFAULT_ROI_STEPS: StepAmountType[] = [
  { id: 'roi-0.01', value: '0.01', title: '0.01%' },
  { id: 'roi-0.1', value: '0.1', title: '0.1%' },
  { id: 'roi-0.25', value: '0.25', title: '0.25%' },
  { id: 'roi-0.5', value: '0.5', title: '0.5%' },
  { id: 'roi-1', value: '1', title: '1%' },
  { id: 'roi-2', value: '2', title: '2%' },
  { id: 'roi-5', value: '5', title: '5%' },
  { id: 'roi-10', value: '10', title: '10%' },
  { id: 'roi-12', value: '12', title: '12%' },
];
const TENURE_STEP_VALUES = [1, 2, 5, 7, 10, 15, 20, 25, 30];
export const RateTenurePicker: React.FC<RateTenurePickerProps> = React.memo(({
  rt,
  setRt,
  roi: propRoi,
  onChangeRoi,
  tenure: propTenure,
  onChangeTenure,
  tenureFormat: propTenureFormat,
  onChangeTenureFormat,
  rateTitle = 'Rate',
  tenureTitle = 'Tenure',
  rateStepData = DEFAULT_ROI_STEPS,
  tenureStepData,
  className = '',
  rateClassName = '',
  tenureClassName = '',
  showTenureSelect = true,
}) => {
  const currentRoi = String(propRoi ?? rt?.roi ?? '8.5');
  const currentTenure = String(propTenure ?? rt?.tenure ?? '20');
  const currentFormat = (propTenureFormat ?? rt?.tenureFormat ?? 'y') as 'y' | 'm';
  const handleRoiChange = (newRate: string) => {
    if (onChangeRoi) {
      onChangeRoi(newRate);
    } else if (setRt && rt) {
      setRt({ ...rt, roi: newRate });
    }
  };
  const handleTenureChange = (newTenure: string) => {
    if (onChangeTenure) {
      onChangeTenure(newTenure);
    } else if (setRt && rt) {
      setRt({ ...rt, tenure: newTenure });
    }
  };
  const handleFormatChange = (newFormat: 'y' | 'm') => {
    if (onChangeTenureFormat) {
      onChangeTenureFormat(newFormat);
    } else if (setRt && rt) {
      setRt({ ...rt, tenureFormat: newFormat });
    }
  };
  const resolvedTenureSteps: StepAmountType[] = useMemo(() => {
    if (tenureStepData && tenureStepData.length > 0) {
      return tenureStepData;
    }
    const isYears = currentFormat === 'y';
    return TENURE_STEP_VALUES.map((val) => ({
      id: `tenure-${val}`,
      value: String(val),
      title: `${val} ${isYears ? (val === 1 ? 'year' : 'years') : (val === 1 ? 'month' : 'months')}`,
    }));
  }, [tenureStepData, currentFormat]);
  return (
    <div className={`${styles.container} ${className}`.trim()}>
      <ValuePicker
        className={rateClassName}
        title={rateTitle}
        titleStyle="merged"
        value={currentRoi}
        symbol="%"
        symbolBg={false}
        symbolPosition="right"
        onChange={handleRoiChange}
        stepData={rateStepData}
        showWords={false}
      />
      <ValuePicker
        className={tenureClassName}
        title={tenureTitle}
        titleStyle="merged"
        value={currentTenure}
        symbol={null}
        onChange={handleTenureChange}
        stepData={resolvedTenureSteps}
        endAdornment={
          showTenureSelect ? (
            <select
              className={styles.tenureFormatSelect}
              value={currentFormat}
              onChange={(e) => handleFormatChange(e.target.value as 'y' | 'm')}
              aria-label="Tenure Unit"
            >
              <option value="m">Months</option>
              <option value="y">Years</option>
            </select>
          ) : undefined
        }
        showWords={false}
      />
    </div>
  );
});
RateTenurePicker.displayName = 'RateTenurePicker';
export default RateTenurePicker;
