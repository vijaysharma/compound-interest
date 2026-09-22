import React from 'react';
import { FiBarChart2 } from 'react-icons/fi';
import ValuePicker from '../../components/ValuePicker';
import { LumpsumDurationPicker } from '../../components/mutual-fund/LumpsumDurationPicker';
import styles from '../MutualFundAnalytics.module.scss';
export interface LumpsumControlsProps {
  pinnedCount: number;
  onOpenSelector: () => void;
  showDate: boolean;
  onToggleShowDate: () => void;
  viewChart: boolean;
  onToggleViewChart: () => void;
  duration: string;
  onDurationChange: (val: string) => void;
  startDate: string | null;
  endDate: string | null;
  onStartDateChange: (val: string | null) => void;
  onEndDateChange: (val: string | null) => void;
  invAmt: string;
  onInvAmtChange: (val: string) => void;
}
export const LumpsumControls: React.FC<LumpsumControlsProps> = React.memo(
  ({
    pinnedCount,
    onOpenSelector,
    showDate,
    onToggleShowDate,
    viewChart,
    onToggleViewChart,
    duration,
    onDurationChange,
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    invAmt,
    onInvAmtChange,
  }) => (
    <div className={styles.controlsCol}>
      <div className={styles.actionButtonGroup}>
        <button type="button" className={styles.primaryButton} onClick={onOpenSelector}>
          Select mutual funds ({pinnedCount}/8)
        </button>
        <button type="button" className={styles.outlineButton} onClick={onToggleShowDate}>
          {showDate ? 'Time Slots' : 'Date Picker'}
        </button>
        <button
          type="button"
          className={`${styles.chartIconButton} ${viewChart ? styles.chartIconActive : ''}`}
          onClick={onToggleViewChart}
          title={viewChart ? 'Hide Chart' : 'Show Chart'}
          aria-label={viewChart ? 'Hide Chart' : 'Show Chart'}
        >
          <FiBarChart2 />
        </button>
      </div>
      {!showDate && (
        <LumpsumDurationPicker
          duration={duration}
          onDurationChange={onDurationChange}
        />
      )}
      {showDate && (
        <ValuePicker
          variant="date-range"
          startDate={startDate}
          endDate={endDate}
          setStartDate={onStartDateChange}
          setEndDate={onEndDateChange}
        />
      )}
      <ValuePicker
        value={invAmt}
        onChange={onInvAmtChange}
        className={styles.fieldTight}
        title="Invested"
      />
    </div>
  )
);
LumpsumControls.displayName = 'LumpsumControls';
