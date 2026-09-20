import React from 'react';
import { Streamline, StrategySummary } from './types';
import { MonthlySimulationStep } from './stageExtractor';
import { MacroTrajectoryChart } from './MacroTrajectoryChart';
import { StreamlineComparisonCard } from './StreamlineComparisonCard';
import styles from './StrategyCalculator.module.scss';
interface Column3AnalyticsProps {
  activeStreamline: Streamline;
  activeSteps: MonthlySimulationStep[];
  allStreamlines: Array<{
    streamline: Streamline;
    result: { summary: StrategySummary; monthlySteps: MonthlySimulationStep[] };
  }>;
  activeId: string;
  onSelectStreamline: (id: string) => void;
}
export const Column3Analytics: React.FC<Column3AnalyticsProps> = ({
  activeStreamline,
  activeSteps,
  allStreamlines,
  activeId,
  onSelectStreamline,
}) => {
  return (
    <div className={styles.column3Container}>
      <div className={styles.columnHeader}>
        <div className={styles.columnTitleRow}>
          <div className={styles.titleWithBadge}>
            <span className={styles.columnBadge}>Column 3</span>
            <h2 className={styles.columnTitle}>Overall Analytics &amp; Comparison</h2>
          </div>
        </div>
        <p className={styles.columnSubtitle}>
          Macro trajectory curves, tax friction &amp; multi-streamline comparative analytics
        </p>
      </div>
      <div className={styles.column3Scrollable}>
        <MacroTrajectoryChart
          activeStreamline={activeStreamline}
          activeSteps={activeSteps}
          allStreamlines={allStreamlines}
        />
        <StreamlineComparisonCard
          allStreamlines={allStreamlines}
          activeId={activeId}
          onSelectStreamline={onSelectStreamline}
        />
      </div>
    </div>
  );
};
