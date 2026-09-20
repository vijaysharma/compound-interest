import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Column1GrowthPoint } from './column1Types';
import Spinner from '../../components/Spinner';
import styles from './StrategyCalculator.module.scss';
const Chart = dynamic(() => import('../../components/Chart'), {
  ssr: false,
  loading: () => (
    <div className={styles.chartLoadingWrapper}>
      <Spinner size="sm" label="Computing real NAV trajectory..." />
    </div>
  ),
});
interface Column1GrowthChartProps {
  points: Column1GrowthPoint[];
  initialAmount: number;
  isLoading?: boolean;
}
export const Column1GrowthChart: React.FC<Column1GrowthChartProps> = ({
  points,
  initialAmount,
  isLoading = false,
}) => {
  const chartDatasets = useMemo(() => {
    if (!points || points.length === 0) return [];
    const fundSizeData = points.map((p) => ({ date: p.date, nav: p.netFundSize }));
    const investedData = points.map((p) => ({ date: p.date, nav: p.cumulativeInvested }));
    const swpData = points.map((p) => ({ date: p.date, nav: p.cumulativeWithdrawals }));
    return [
      { label: 'Net Fund Size (₹)', color: '#7b1fa2', data: fundSizeData },
      { label: 'Cumulative Invested (₹)', color: '#0284c7', data: investedData },
      { label: 'Cumulative SWP Withdrawn (₹)', color: '#10b981', data: swpData },
    ];
  }, [points]);
  const lastPoint = points.length > 0 ? points[points.length - 1] : null;
  const startDate = points.length > 0 ? points[0].date : null;
  const endDate = lastPoint ? lastPoint.date : null;
  return (
    <div className={styles.column1ChartCard}>
      <div className={styles.column1ChartHeader}>
        <div className={styles.chartTitleArea}>
          <h4 className={styles.column1ChartTitle}>Real NAV Trajectory &amp; Cashflows</h4>
          <span className={styles.column1ChartSubtitle}>
            Net Fund Size vs. Cumulative Capital vs. SWP Withdrawals
          </span>
        </div>
      </div>
      <div className={styles.chartStatPillsRow}>
        <div className={styles.chartStatPill}>
          <span className={styles.statPillLabel}>Net Fund Size:</span>
          <span className={styles.statPillValPurple}>
            ₹{(lastPoint?.netFundSize || initialAmount).toLocaleString('en-IN')}
          </span>
        </div>
        <div className={styles.chartStatPill}>
          <span className={styles.statPillLabel}>Total Invested:</span>
          <span className={styles.statPillValBlue}>
            ₹{(lastPoint?.cumulativeInvested || initialAmount).toLocaleString('en-IN')}
          </span>
        </div>
        <div className={styles.chartStatPill}>
          <span className={styles.statPillLabel}>Total Withdrawn:</span>
          <span className={styles.statPillValGreen}>
            ₹{(lastPoint?.cumulativeWithdrawals || 0).toLocaleString('en-IN')}
          </span>
        </div>
      </div>
      <Chart
        className={styles.col1ChartCanvas}
        datasets={chartDatasets}
        investmentAmount={initialAmount}
        dataMode="value"
        autoHeight
        minHeight={260}
        startDate={startDate}
        endDate={endDate}
        showPresets={false}
        isLoading={isLoading}
      />
    </div>
  );
};
