import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import type { ChartDataset } from '../../components/chart/types';
import Spinner from '../../components/Spinner';
import styles from '../MutualFundAnalytics.module.scss';
const Chart = dynamic(() => import('../../components/Chart'), {
  ssr: false,
  loading: () => (
    <div className={styles.chartLoadingWrapper}>
      <Spinner size="lg" label="Loading chart..." />
    </div>
  ),
});
interface SwpChartColProps {
  viewChart: boolean;
  pinnedCount: number;
  chartDatasets: ChartDataset[];
  monthlyWithdrawalAmount: string;
  startDate: string | null;
  endDate: string | null;
  isNavLoading: boolean;
}
export function SwpChartCol({
  viewChart, pinnedCount, chartDatasets, monthlyWithdrawalAmount,
  startDate, endDate, isNavLoading,
}: SwpChartColProps) {
  if (!viewChart) return null;
  return (
    <div className={`${styles.outputCol} ${styles.lumpsumOutputCol}`}>
      {pinnedCount > 0 ? (
        <Suspense
          fallback={
            <div className={`${styles.chartLoadingWrapper} ${styles.lumpsumLoadingWrapper}`}>
              <Spinner size="lg" label="Loading chart..." />
            </div>
          }
        >
          <Chart
            className={`${styles.chartContainer} ${styles.lumpsumChartContainer}`}
            datasets={chartDatasets}
            investmentAmount={parseFloat(monthlyWithdrawalAmount) || 0}
            dataMode="value"
            autoHeight
            minHeight={350}
            startDate={startDate}
            endDate={endDate}
            showPresets={false}
            isLoading={isNavLoading}
            loadingLabel="Loading historical NAV data..."
            emptyMessage="Select up to 8 funds to see comparison"
          />
        </Suspense>
      ) : (
        <div className={`${styles.chartPlaceholder} ${styles.lumpsumPlaceholder}`}>
          Select up to 8 funds to see comparison
        </div>
      )}
    </div>
  );
}
