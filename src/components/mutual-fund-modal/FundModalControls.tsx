import React from 'react';
import ValuePicker from '../ValuePicker';
import type { InvestmentType } from './types';
import styles from '../MutualFundDetailModal.module.scss';
const STEP_DATA = [
  { id: 'i1', value: 100, title: '100' },
  { id: 'i2', value: 1000, title: '1K' },
  { id: 'i3', value: 5000, title: '5K' },
  { id: 'i4', value: 50000, title: '50K' },
  { id: 'i5', value: 500000, title: '5L' },
  { id: 'i6', value: 10000000, title: '1CR' },
];
export interface FundModalControlsProps {
  startDateISO: string;
  endDateISO: string;
  minNavDateISO: string;
  setStartDateISO: (val: string) => void;
  setEndDateISO: (val: string) => void;
  investmentType: InvestmentType;
  setInvestmentType: (type: InvestmentType) => void;
  investmentValue: string;
  setInvestmentValue: (val: string) => void;
}
export const FundModalControls: React.FC<FundModalControlsProps> = React.memo(
  ({
    startDateISO,
    endDateISO,
    minNavDateISO,
    setStartDateISO,
    setEndDateISO,
    investmentType,
    setInvestmentType,
    investmentValue,
    setInvestmentValue,
  }) => (
    <div className={styles.controlsColumn}>
      <ValuePicker
        variant="date-range"
        startDate={startDateISO}
        endDate={endDateISO}
        setStartDate={setStartDateISO}
        setEndDate={setEndDateISO}
        startMinDate={minNavDateISO}
      />
      <ValuePicker
        activeTab={investmentType}
        onTabChange={(tabId) => {
          const nextType = tabId as InvestmentType;
          setInvestmentType(nextType);
          setInvestmentValue(nextType === 'sip' ? '5000' : '100000');
        }}
        tabs={[
          { id: 'lumpsum', title: 'Lumpsum' },
          { id: 'sip', title: 'Monthly SIP' },
        ]}
        value={investmentValue}
        onChange={setInvestmentValue}
        defaultStep={investmentType === 'sip' ? 500 : 5000}
        tabSize="sm"
        singleRow={true}
        stepData={STEP_DATA}
      />
    </div>
  )
);
FundModalControls.displayName = 'FundModalControls';
