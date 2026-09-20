import React, { useState } from 'react';
import { FiLayers, FiList } from 'react-icons/fi';
import { ExecutionStage, Streamline } from './types';
import { StageCard } from './StageCard';
import styles from './StrategyCalculator.module.scss';
interface Column2StagesProps {
  stages: ExecutionStage[];
  activeStreamline: Streamline;
}
export const Column2Stages: React.FC<Column2StagesProps> = ({ stages, activeStreamline }) => {
  const [filterMode, setFilterMode] = useState<'milestones' | 'all'>('milestones');
  const displayedStages = filterMode === 'milestones'
    ? stages
    : stages; // Can show full array or filtered subset
  return (
    <div className={styles.column2Container}>
      <div className={styles.columnHeader}>
        <div className={styles.columnTitleRow}>
          <div className={styles.titleWithBadge}>
            <span className={styles.columnBadge}>Column 2</span>
            <h2 className={styles.columnTitle}>Stage-by-Stage Matrix &amp; Taxation</h2>
          </div>
          <span className={styles.activeStreamlineBadge}>
            {activeStreamline.name}
          </span>
        </div>
        <p className={styles.columnSubtitle}>
          Chronological execution milestones with dedicated micro-graphs, fund allocations &amp; FIFO tax analytics
        </p>
        <div className={styles.stagesFilterRow}>
          <div className={styles.filterStats}>
            <FiLayers />
            <span>{displayedStages.length} Execution Stages</span>
          </div>
          <div className={styles.filterToggleGroup}>
            <button
              type="button"
              className={`${styles.filterToggleBtn} ${filterMode === 'milestones' ? styles.activeFilterBtn : ''}`}
              onClick={() => setFilterMode('milestones')}
            >
              Key Milestones
            </button>
            <button
              type="button"
              className={`${styles.filterToggleBtn} ${filterMode === 'all' ? styles.activeFilterBtn : ''}`}
              onClick={() => setFilterMode('all')}
            >
              <FiList />
              <span>All Stages</span>
            </button>
          </div>
        </div>
      </div>
      <div className={styles.stagesListScrollable}>
        {displayedStages.map((stage, idx) => (
          <StageCard
            key={stage.id}
            stage={stage}
            isInitiallyExpanded={idx <= 1 || idx === displayedStages.length - 1}
          />
        ))}
      </div>
    </div>
  );
};
