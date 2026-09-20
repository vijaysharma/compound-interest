import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { TimelineStage } from './types';
import Spinner from '../../components/Spinner';
import styles from './StrategyCalculator.module.scss';
const Chart = dynamic(() => import('../../components/Chart'), {
  ssr: false,
  loading: () => (
    <div className={styles.chartLoadingWrapper}>
      <Spinner size="lg" label="Loading strategy simulation chart..." />
    </div>
  ),
});
interface StrategyChartSectionProps {
  stages: TimelineStage[];
  initialAmount: number;
}
export const StrategyChartSection: React.FC<StrategyChartSectionProps> = ({ stages, initialAmount }) => {
  const chartDatasets = useMemo(() => {
    let cumWithdrawn = 0;
    const sourceData: Array<{ date: string; nav: number }> = [];
    const swpData: Array<{ date: string; nav: number }> = [];
    const sipData: Array<{ date: string; nav: number }> = [];
    const totalData: Array<{ date: string; nav: number }> = [];
    for (const s of stages) {
      cumWithdrawn += s.swpNetReceived;
      sourceData.push({ date: s.date, nav: s.sourceClosingBalance });
      swpData.push({ date: s.date, nav: cumWithdrawn });
      sipData.push({ date: s.date, nav: s.sipClosingBalance });
      totalData.push({ date: s.date, nav: s.combinedNetWorth });
    }
    return [
      { label: 'Source Portfolio Balance', color: '#7b1fa2', data: sourceData },
      { label: 'Cumulative Net SWP Cashflow', color: '#0284c7', data: swpData },
      { label: 'Destination SIP Balance', color: '#10b981', data: sipData },
      { label: 'Combined Total Net Worth', color: '#f59e0b', data: totalData },
    ];
  }, [stages]);
  const startDate = stages.length > 0 ? stages[0].date : null;
  const endDate = stages.length > 0 ? stages[stages.length - 1].date : null;
  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>Multi-Stage Wealth Trajectory Simulation</h3>
        <span className={styles.chartSubtitle}>Simultaneous tracking of principal, withdrawals, and compounding reinvestment</span>
      </div>
      <Chart
        className={styles.strategyChart}
        datasets={chartDatasets}
        investmentAmount={initialAmount}
        dataMode="value"
        autoHeight
        minHeight={400}
        startDate={startDate}
        endDate={endDate}
        showPresets={false}
      />
    </div>
  );
};
