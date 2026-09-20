import { FiBarChart2 } from 'react-icons/fi';
import JoinedButtonGroup from '../../components/JoinedButtonGroup';
import ValuePicker from '../../components/ValuePicker';
import { DEFAULT_AMOUNT_STEPS } from '../../data/valuePickerData';
import { SIP_DURATION_ROW1, SIP_DURATION_ROW2, SIP_DURATION_ROW3 } from './sipDurationData';
import type { NavType } from '../../types/types';
import styles from '../MutualFundAnalytics.module.scss';
interface SipControlsProps {
  pinnedCount: number;
  showDate: boolean;
  viewChart: boolean;
  duration: string;
  monthlyAmount: string;
  dayOfMonth: string;
  investmentStepUp: string;
  jsonNavData: NavType[];
  startDate: string | null;
  endDate: string | null;
  onOpenSelector: () => void;
  onToggleDate: () => void;
  onToggleChart: () => void;
  onDurationChange: (val: string) => void;
  onMonthlyAmountChange: (val: string) => void;
  onDayOfMonthChange: (val: string) => void;
  onStepUpChange: (val: string) => void;
  onStartDateChange: (val: string | null) => void;
  onEndDateChange: (val: string | null) => void;
}
export function SipControls({
  pinnedCount, showDate, viewChart, duration, monthlyAmount, dayOfMonth,
  investmentStepUp, jsonNavData, startDate, endDate, onOpenSelector,
  onToggleDate, onToggleChart, onDurationChange, onMonthlyAmountChange,
  onDayOfMonthChange, onStepUpChange, onStartDateChange, onEndDateChange,
}: SipControlsProps) {
  return (
    <div className={styles.controlsCol}>
      <div className={styles.actionButtonGroup}>
        <button type="button" className={styles.primaryButton} onClick={onOpenSelector}>
          Select mutual funds ({pinnedCount}/8)
        </button>
        <button type="button" className={styles.outlineButton} onClick={onToggleDate}>
          {showDate ? 'Time Slots' : 'Date Picker'}
        </button>
        <button
          type="button"
          className={`${styles.chartIconButton} ${viewChart ? styles.chartIconActive : ''}`}
          onClick={onToggleChart}
          title={viewChart ? 'Hide Chart' : 'Show Chart'}
          aria-label={viewChart ? 'Hide Chart' : 'Show Chart'}
        >
          <FiBarChart2 />
        </button>
      </div>
      {!showDate && (
        <div>
          <JoinedButtonGroup
            data={SIP_DURATION_ROW1}
            selectedValue={duration}
            updateSelectedValue={onDurationChange}
            btnClass="rounded-bl-none rounded-br-none border-b-0"
            sizePrefix="sm"
          />
          <JoinedButtonGroup
            data={SIP_DURATION_ROW2}
            selectedValue={duration}
            updateSelectedValue={onDurationChange}
            btnClass="rounded-l-none rounded-r-none border-b-0"
            sizePrefix="sm"
          />
          <JoinedButtonGroup
            data={SIP_DURATION_ROW3}
            selectedValue={duration}
            updateSelectedValue={onDurationChange}
            sizePrefix="sm"
            className={styles.fieldTight}
            btnClass="rounded-tl-none rounded-tr-none"
          />
        </div>
      )}
      {showDate && jsonNavData.length > 0 && (
        <ValuePicker
          variant="date-range"
          data={jsonNavData}
          startDate={startDate}
          endDate={endDate}
          setStartDate={onStartDateChange}
          setEndDate={onEndDateChange}
        />
      )}
      <ValuePicker
        value={monthlyAmount}
        onChange={onMonthlyAmountChange}
        className={styles.fieldTight}
        title="Monthly"
        singleRow={true}
        stepData={DEFAULT_AMOUNT_STEPS}
      />
      <div className={styles.joinRow}>
        <span className={styles.joinLabel}>Invested on</span>
        <select
          className={styles.joinSelect}
          value={dayOfMonth}
          onChange={(e) => onDayOfMonthChange(e.target.value)}
        >
          {Array.from({ length: 31 }, (_, i) => (
            <option key={i + 1} value={i + 1}>Day {i + 1}</option>
          ))}
        </select>
        <span className={styles.joinLabel}>Yearly increase</span>
        <select
          className={styles.joinSelect}
          value={investmentStepUp}
          onChange={(e) => onStepUpChange(e.target.value)}
        >
          {Array.from({ length: 21 }, (_, i) => (
            <option key={i} value={i}>{i}%</option>
          ))}
        </select>
      </div>
    </div>
  );
}
