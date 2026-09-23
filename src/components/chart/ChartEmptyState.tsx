import React from 'react';
import { ChartSkeleton } from '../skeleton';
import styles from '../Chart.module.scss';
export interface ChartEmptyStateProps {
  className?: string;
  targetHeight: number;
  isLoading?: boolean;
  loadingLabel?: string;
  hasAnyData: boolean;
  datasetsCount: number;
  emptyMessage?: string;
  allSortedDatesCount: number;
  initialInvestment: number;
  hasChartOptions: boolean;
  mounted: boolean;
}
export const ChartEmptyState: React.FC<ChartEmptyStateProps> = React.memo(
  ({
    className,
    targetHeight,
    isLoading,
    loadingLabel,
    hasAnyData,
    datasetsCount,
    emptyMessage,
    allSortedDatesCount,
    initialInvestment,
    hasChartOptions,
    mounted,
  }) => {
    const bindHeight = (el: HTMLDivElement | null) => {
      if (el) el.style.setProperty('--chart-target-height', `${targetHeight}px`);
    };
    /*
     * The three "on its way" states below render the plot-shaped skeleton rather
     * than a spinner. A centred spinner in a 350px box was the single most
     * visible symptom of the NAV fetch being slow — and because it is a
     * different shape from the chart, the whole column jumped when data landed.
     * The terminal states further down stay as text: they are answers, not
     * waits, and a skeleton would imply something is still coming.
     */
    if (isLoading) {
      return (
        <div className={`${className || ''} ${styles.emptyContainer}`} ref={bindHeight}>
          <ChartSkeleton label={loadingLabel || 'Loading historical NAV data'} />
        </div>
      );
    }
    if (datasetsCount > 0 && !hasAnyData) {
      return (
        <div className={`${className || ''} ${styles.emptyContainer}`} ref={bindHeight}>
          <span className={styles.emptyText}>No NAV data available for the selected dates</span>
        </div>
      );
    }
    if (datasetsCount === 0) {
      return (
        <div className={`${className || ''} ${styles.emptyContainer}`} ref={bindHeight}>
          <span className={styles.emptyText}>{emptyMessage || 'Select a mutual fund to view trajectory'}</span>
        </div>
      );
    }
    if (allSortedDatesCount === 0) {
      return (
        <div className={`${className || ''} ${styles.emptyContainer}`} ref={bindHeight}>
          <span className={styles.emptyText}>No NAV history found for the selected dates</span>
        </div>
      );
    }
    if (initialInvestment <= 0) {
      return (
        <div className={`${className || ''} ${styles.emptyContainer}`} ref={bindHeight}>
          <span className={styles.emptyText}>Enter an investment amount to view growth</span>
        </div>
      );
    }
    if (!hasChartOptions) {
      return (
        <div className={`${className || ''} ${styles.emptyContainer}`} ref={bindHeight}>
          <ChartSkeleton label="Preparing chart" />
        </div>
      );
    }
    if (!mounted) {
      return (
        <div className={`${className || ''} ${styles.emptyContainer}`} ref={bindHeight}>
          <ChartSkeleton label="Loading chart" />
        </div>
      );
    }
    return null;
  }
);
ChartEmptyState.displayName = 'ChartEmptyState';
