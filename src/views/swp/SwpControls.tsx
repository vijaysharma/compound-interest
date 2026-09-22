import { FiBarChart2 } from 'react-icons/fi';
import ValuePicker from '../../components/ValuePicker';
import { DEFAULT_AMOUNT_STEPS } from '../../data/valuePickerData';
import type { NavType } from '../../types/types';
import styles from '../MutualFundAnalytics.module.scss';
interface SwpControlsProps {
  pinnedCount: number;
  viewChart: boolean;
  lumpsumStartDate: string | null;
  lumpSumInvestmentAmount: string;
  startSwpDate: string | null;
  endSwpDate: string | null;
  monthlyWithdrawalAmount: string;
  dayOfMonth: string;
  investmentStepUp: string;
  jsonNavData: NavType[];
  onOpenSelector: () => void;
  onToggleChart: () => void;
  onLumpsumStartDateChange: (val: string | null) => void;
  onLumpSumInvestmentAmountChange: (val: string) => void;
  onStartSwpDateChange: (val: string | null) => void;
  onEndSwpDateChange: (val: string | null) => void;
  onMonthlyWithdrawalAmountChange: (val: string) => void;
  onDayOfMonthChange: (val: string) => void;
  onStepUpChange: (val: string) => void;
}
export function SwpControls({
  pinnedCount, viewChart, lumpsumStartDate, lumpSumInvestmentAmount,
  startSwpDate, endSwpDate, monthlyWithdrawalAmount, dayOfMonth,
  investmentStepUp, jsonNavData, onOpenSelector, onToggleChart,
  onLumpsumStartDateChange, onLumpSumInvestmentAmountChange,
  onStartSwpDateChange, onEndSwpDateChange, onMonthlyWithdrawalAmountChange,
  onDayOfMonthChange, onStepUpChange,
}: SwpControlsProps) {
  return (
    <div className={styles.controlsCol}>
      <div className={styles.actionButtonGroup}>
        <button type="button" className={styles.primaryButton} onClick={onOpenSelector}>
          Select mutual funds ({pinnedCount}/8)
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
      <ValuePicker
        variant="date"
        startTitle="Investment Date"
        startDate={lumpsumStartDate}
        setStartDate={onLumpsumStartDateChange}
      />
      <ValuePicker
        value={lumpSumInvestmentAmount}
        onChange={onLumpSumInvestmentAmountChange}
        className={styles.fieldTight}
        title="Lump Sum Investment"
        singleRow={true}
        stepData={DEFAULT_AMOUNT_STEPS}
      />
      {jsonNavData.length > 0 && (
        <ValuePicker
          variant="date-range"
          startDate={startSwpDate}
          startTitle="Start SWP"
          endDate={endSwpDate}
          setStartDate={onStartSwpDateChange}
          setEndDate={onEndSwpDateChange}
          endTitle="End SWP"
          startMinDate={lumpsumStartDate ?? undefined}
        />
      )}
      <ValuePicker
        value={monthlyWithdrawalAmount}
        onChange={onMonthlyWithdrawalAmountChange}
        className={styles.fieldTight}
        title="Monthly Withdrawals"
        singleRow={true}
        stepData={DEFAULT_AMOUNT_STEPS}
      />
      <div className={styles.joinRow}>
        <span className={styles.joinLabel}>Withdrawal on</span>
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
