import React from 'react';
import JoinedButtonGroup from '../JoinedButtonGroup';
import { DURATION_ROW_1, DURATION_ROW_2, DURATION_ROW_3 } from './mfDurationData';
import styles from '../../views/MutualFundAnalytics.module.scss';
export interface LumpsumDurationPickerProps {
  duration: string;
  onDurationChange: (val: string) => void;
}
export const LumpsumDurationPicker: React.FC<LumpsumDurationPickerProps> = React.memo(
  ({ duration, onDurationChange }) => (
    <div>
      <JoinedButtonGroup
        data={DURATION_ROW_1}
        selectedValue={duration}
        updateSelectedValue={onDurationChange}
        btnClass="rounded-bl-none rounded-br-none border-b-0"
        sizePrefix="sm"
      />
      <JoinedButtonGroup
        data={DURATION_ROW_2}
        selectedValue={duration}
        updateSelectedValue={onDurationChange}
        btnClass="rounded-l-none rounded-r-none border-b-0"
        sizePrefix="sm"
      />
      <JoinedButtonGroup
        data={DURATION_ROW_3}
        selectedValue={duration}
        updateSelectedValue={onDurationChange}
        sizePrefix="sm"
        className={styles.fieldTight}
        btnClass="rounded-tl-none rounded-tr-none"
      />
    </div>
  )
);
LumpsumDurationPicker.displayName = 'LumpsumDurationPicker';
