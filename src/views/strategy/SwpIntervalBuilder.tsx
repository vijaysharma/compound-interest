import React from 'react';
import { FiPlus, FiCalendar, FiSliders } from 'react-icons/fi';
import { SwpInterval } from './column1Types';
import { SwpIntervalCard } from './SwpIntervalCard';
import styles from './StrategyCalculator.module.scss';
interface SwpIntervalBuilderProps {
  swpStartDate: string;
  onSwpStartDateChange: (date: string) => void;
  swpEndDate: string;
  onSwpEndDateChange: (date: string) => void;
  intervals: SwpInterval[];
  onUpdateIntervals: (intervals: SwpInterval[]) => void;
}
export const SwpIntervalBuilder: React.FC<SwpIntervalBuilderProps> = ({
  swpStartDate,
  onSwpStartDateChange,
  swpEndDate,
  onSwpEndDateChange,
  intervals,
  onUpdateIntervals,
}) => {
  const handleUpdateInterval = (updated: SwpInterval) => {
    onUpdateIntervals(intervals.map((item) => (item.id === updated.id ? updated : item)));
  };
  const handleRemoveInterval = (id: string) => {
    if (intervals.length <= 1) return;
    onUpdateIntervals(intervals.filter((item) => item.id !== id));
  };
  const handleAddInterval = () => {
    const lastInterval = intervals[intervals.length - 1];
    let nextStart = swpStartDate;
    let nextEnd = swpEndDate;
    if (lastInterval && lastInterval.toDate) {
      const lastDate = new Date(lastInterval.toDate);
      lastDate.setDate(lastDate.getDate() + 1);
      nextStart = lastDate.toISOString().slice(0, 10);
      const futureDate = new Date(lastDate);
      futureDate.setFullYear(futureDate.getFullYear() + 2);
      nextEnd = futureDate.toISOString().slice(0, 10);
    }
    const newInterval: SwpInterval = {
      id: `swp-int-${Date.now()}`,
      fromDate: nextStart,
      toDate: nextEnd,
      amount: lastInterval ? lastInterval.amount : 35000,
      frequency: lastInterval ? lastInterval.frequency : 'monthly',
      enableStepUp: false,
      stepUpType: 'percentage',
      stepUpValue: 5,
    };
    onUpdateIntervals([...intervals, newInterval]);
  };
  return (
    <section className={styles.stageCard}>
      <div className={styles.stageHeader}>
        <div className={styles.stageNumber}>03</div>
        <div className={styles.stageTitleGroup}>
          <div className={styles.fundHeaderTitleRow}>
            <h3 className={styles.stageTitle}>Variable SWP Configurator</h3>
            <span className={styles.swpIntervalCountBadge}>
              <FiSliders />
              <span>{intervals.length} {intervals.length === 1 ? 'Time Frame' : 'Time Frames'}</span>
            </span>
          </div>
          <span className={styles.stageSubtitle}>
            Configure sequential multi-phase withdrawal strategies across custom date ranges
          </span>
        </div>
      </div>
      <div className={styles.globalBoundsBox}>
        <div className={styles.globalBoundsHeader}>
          <FiCalendar className={styles.inlineIcon} />
          <span className={styles.globalBoundsTitle}>Global SWP Date Bounds</span>
        </div>
        <div className={styles.intervalDateRow}>
          <div className={styles.dateSubField}>
            <label htmlFor="global-swp-start" className={styles.fieldLabel}>
              SWP Horizon Start
            </label>
            <input
              id="global-swp-start"
              type="date"
              className={styles.dateInput}
              value={swpStartDate}
              onChange={(e) => onSwpStartDateChange(e.target.value)}
            />
          </div>
          <div className={styles.dateSubField}>
            <label htmlFor="global-swp-end" className={styles.fieldLabel}>
              SWP Horizon End
            </label>
            <input
              id="global-swp-end"
              type="date"
              className={styles.dateInput}
              value={swpEndDate}
              onChange={(e) => onSwpEndDateChange(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className={styles.intervalsListContainer}>
        {intervals.map((interval, index) => (
          <SwpIntervalCard
            key={interval.id}
            interval={interval}
            phaseNumber={index + 1}
            onUpdate={handleUpdateInterval}
            onRemove={handleRemoveInterval}
            canRemove={intervals.length > 1}
          />
        ))}
      </div>
      <button
        type="button"
        className={styles.addIntervalBtn}
        onClick={handleAddInterval}
      >
        <FiPlus />
        <span>+ Add SWP Time Frame</span>
      </button>
    </section>
  );
};
