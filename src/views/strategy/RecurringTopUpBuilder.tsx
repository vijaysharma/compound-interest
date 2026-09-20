import React from 'react';
import { FiPlus, FiTrendingUp } from 'react-icons/fi';
import { RecurringTopUpSource } from './column1Types';
import { TopUpSourceCard } from './TopUpSourceCard';
import styles from './StrategyCalculator.module.scss';
interface RecurringTopUpBuilderProps {
  sources: RecurringTopUpSource[];
  onUpdateSources: (sources: RecurringTopUpSource[]) => void;
  defaultStartDate?: string;
}
export const RecurringTopUpBuilder: React.FC<RecurringTopUpBuilderProps> = ({
  sources,
  onUpdateSources,
  defaultStartDate = '2024-01-01',
}) => {
  const handleUpdateSource = (updated: RecurringTopUpSource) => {
    onUpdateSources(sources.map((s) => (s.id === updated.id ? updated : s)));
  };
  const handleRemoveSource = (id: string) => {
    onUpdateSources(sources.filter((s) => s.id !== id));
  };
  const handleAddSource = () => {
    const nextIdx = sources.length + 1;
    const newSource: RecurringTopUpSource = {
      id: `tu-src-${Date.now()}`,
      name: `Source ${nextIdx} - Additional Cashflow`,
      amount: 25000,
      frequency: 'Quarterly',
      startDate: defaultStartDate,
      enabled: true,
    };
    onUpdateSources([...sources, newSource]);
  };
  const activeCount = sources.filter((s) => s.enabled).length;
  return (
    <section className={styles.stageCard}>
      <div className={styles.stageHeader}>
        <div className={styles.stageNumber}>04</div>
        <div className={styles.stageTitleGroup}>
          <div className={styles.fundHeaderTitleRow}>
            <h3 className={styles.stageTitle}>Multi-Source Recurring Top-Ups</h3>
            <span className={styles.swpIntervalCountBadge}>
              <FiTrendingUp />
              <span>{activeCount} Active / {sources.length} Total</span>
            </span>
          </div>
          <span className={styles.stageSubtitle}>
            Schedule recurring cash infusions from multiple streams (e.g. bonus, rental, business)
          </span>
        </div>
      </div>
      <div className={styles.intervalsListContainer}>
        {sources.map((source, idx) => (
          <TopUpSourceCard
            key={source.id}
            source={source}
            sourceIndex={idx}
            onUpdate={handleUpdateSource}
            onRemove={handleRemoveSource}
            canRemove={sources.length > 1}
          />
        ))}
      </div>
      <button
        type="button"
        className={styles.addIntervalBtn}
        onClick={handleAddSource}
      >
        <FiPlus />
        <span>+ Add Top-Up Source (3, 4+ Streams)</span>
      </button>
    </section>
  );
};
