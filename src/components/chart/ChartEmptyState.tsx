import React from 'react';
import Spinner from '../Spinner';
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
    if (isLoading) {
      return (
        <div className={`${className || ''} ${styles.emptyContainer}`} ref={bindHeight}>
          <Spinner size="md" label={loadingLabel || 'Loading historical NAV data...'} />
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
          <Spinner size="sm" label="Preparing chart..." />
        </div>
      );
    }
    if (!mounted) {
      return (
        <div className={`${className || ''} ${styles.emptyContainer}`} ref={bindHeight}>
          <Spinner size="sm" label="Loading chart..." />
        </div>
      );
    }
    return null;
  }
);
ChartEmptyState.displayName = 'ChartEmptyState';
