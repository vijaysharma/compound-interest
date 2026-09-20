import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Streamline, StrategySummary } from './types';
import { MonthlySimulationStep } from './stageExtractor';
import Spinner from '../../components/Spinner';
import styles from './StrategyCalculator.module.scss';
const Chart = dynamic(() => import('../../components/Chart'), {
  ssr: false,
  loading: () => (
    <div className={styles.chartLoadingWrapper}>
      <Spinner size="lg" label="Loading macro trajectory chart..." />
    </div>
  ),
});
interface MacroTrajectoryChartProps {
  activeStreamline: Streamline;
  activeSteps: MonthlySimulationStep[];
  allStreamlines: Array<{
    streamline: Streamline;
    result: { summary: StrategySummary; monthlySteps: MonthlySimulationStep[] };
  }>;
}
export const MacroTrajectoryChart: React.FC<MacroTrajectoryChartProps> = ({
  activeStreamline,
  activeSteps,
  allStreamlines,
}) => {
  const [viewMode, setViewMode] = useState<'metrics' | 'streamlines'>('streamlines');
  const chartDatasets = useMemo(() => {
    if (viewMode === 'streamlines' && allStreamlines.length > 1) {
      const colors = ['#7b1fa2', '#0284c7', '#10b981'];
      return allStreamlines.map((item, idx) => {
        const data = item.result.monthlySteps.map((s) => ({
          date: s.date,
          nav: s.combinedNetWorth,
        }));
        return {
          label: item.streamline.name || `Streamline ${idx + 1}`,
          color: colors[idx % colors.length],
          data,
        };
      });
    }
    const wealthData = activeSteps.map((s) => ({ date: s.date, nav: s.combinedNetWorth }));
    const investedData = activeSteps.map((s) => ({ date: s.date, nav: s.cumulativeInvested }));
    const swpData = activeSteps.map((s) => ({ date: s.date, nav: s.cumulativeWithdrawn }));
    const taxData = activeSteps.map((s) => ({ date: s.date, nav: s.cumulativeTaxPaid }));
    return [
      { label: 'Net Portfolio Wealth', color: '#7b1fa2', data: wealthData },
      { label: 'Cumulative Invested', color: '#0284c7', data: investedData },
      { label: 'Cumulative SWP Withdrawn', color: '#10b981', data: swpData },
      { label: 'Cumulative Tax Paid', color: '#ef4444', data: taxData },
    ];
  }, [viewMode, allStreamlines, activeSteps]);
  const startDate = activeSteps.length > 0 ? activeSteps[0].date : null;
  const endDate = activeSteps.length > 0 ? activeSteps[activeSteps.length - 1].date : null;
  const initialAmount = parseFloat(activeStreamline.investmentAmount) || 0;
  return (
    <div className={styles.macroChartCard}>
      <div className={styles.macroChartHeader}>
        <div className={styles.chartTitleArea}>
          <h3 className={styles.macroChartTitle}>Global Trajectory &amp; Multi-Streamline Overlay</h3>
          <span className={styles.macroChartSubtitle}>
            {viewMode === 'streamlines'
              ? `Comparing ${allStreamlines.length} strategy paths simultaneously`
              : 'Principal vs. Wealth vs. SWP vs. Cumulative Tax drag'}
          </span>
        </div>
        <div className={styles.chartToggleGroup}>
          <button
            type="button"
            className={`${styles.chartToggleBtn} ${viewMode === 'streamlines' ? styles.activeToggleBtn : ''}`}
            onClick={() => setViewMode('streamlines')}
          >
            Streamline Overlay
          </button>
          <button
            type="button"
            className={`${styles.chartToggleBtn} ${viewMode === 'metrics' ? styles.activeToggleBtn : ''}`}
            onClick={() => setViewMode('metrics')}
          >
            Metrics Breakdown
          </button>
        </div>
      </div>
      <Chart
        className={styles.macroTrajectoryChart}
        datasets={chartDatasets}
        investmentAmount={initialAmount}
        dataMode="value"
        autoHeight
        minHeight={340}
        startDate={startDate}
        endDate={endDate}
        showPresets={false}
      />
    </div>
  );
};
