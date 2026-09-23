'use client';
import React, { useSyncExternalStore } from 'react';
import { AgCharts } from 'ag-charts-react';
import { useChartTheme } from '@/utilities/useChartTheme';
import type { ChartProps, ChartDataset, ChartPoint } from './chart/types';
import { emptySubscribe, getTargetHeight } from './chart/chartUtils';
import { useChartZoom } from './chart/useChartZoom';
import { useChartOptions } from './chart/useChartOptions';
import { ChartZoomToolbar } from './chart/ChartZoomToolbar';
import { ChartEmptyState } from './chart/ChartEmptyState';
import styles from './Chart.module.scss';
export type { ChartProps, ChartDataset, ChartPoint };
const Chart = ({
  className,
  datasets,
  investmentAmount,
  dataMode = 'nav',
  height,
  autoHeight = false,
  minHeight = 350,
  enableZoom = true,
  showPresets = false,
  isLoading = false,
  loadingLabel,
  emptyMessage,
  startDate,
  endDate,
  onPresetChange,
  markerDate,
  markerLabel,
}: ChartProps) => {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const chartTheme = useChartTheme();
  const zoom = useChartZoom(datasets, startDate, endDate, enableZoom, onPresetChange);
  const initialInvestment = Number.isFinite(investmentAmount) && investmentAmount > 0 ? investmentAmount : 0;
  const chartOptions = useChartOptions(
    datasets,
    initialInvestment,
    dataMode,
    height,
    autoHeight,
    minHeight,
    zoom.activeDates,
    chartTheme,
    markerDate,
    markerLabel
  );
  const targetHeight = getTargetHeight(height, minHeight, chartTheme.isMobile);
  const hasAnyData = datasets.some((d) => d.data && d.data.length > 0);
  const isEmpty = isLoading || (datasets.length > 0 && !hasAnyData) || datasets.length === 0 || zoom.allSortedDates.length === 0 || initialInvestment <= 0 || !chartOptions || !mounted;
  if (isEmpty) {
    return (
      <ChartEmptyState
        className={className}
        targetHeight={targetHeight}
        isLoading={isLoading}
        loadingLabel={loadingLabel}
        hasAnyData={hasAnyData}
        datasetsCount={datasets.length}
        emptyMessage={emptyMessage}
        allSortedDatesCount={zoom.allSortedDates.length}
        initialInvestment={initialInvestment}
        hasChartOptions={Boolean(chartOptions)}
        mounted={mounted}
      />
    );
  }
  const hasZoomToolbar = enableZoom && zoom.allSortedDates.length > 5 && (showPresets || zoom.zoomRange);
  return (
    <div
      className={`${className || ''} ${styles.chartWrapper}`}
      ref={(el) => {
        if (el) el.style.setProperty('--chart-target-height', `${targetHeight}px`);
      }}
    >
      {hasZoomToolbar && (
        <ChartZoomToolbar
          showPresets={showPresets}
          activePreset={zoom.activePreset}
          zoomRange={zoom.zoomRange}
          onApplyPreset={zoom.handleApplyPreset}
          onResetZoom={zoom.handleResetZoom}
        />
      )}
      <div
        ref={(el) => {
          if (el) el.style.setProperty('--chart-container-height', `${targetHeight - (hasZoomToolbar ? 34 : 0)}px`);
          zoom.setContainerRef(el);
        }}
        className={styles.chartContainer}
        onMouseDown={zoom.handleMouseDown}
        onMouseMove={zoom.handleMouseMove}
        onMouseUp={zoom.handleMouseUp}
        onMouseLeave={zoom.handleMouseLeave}
        onTouchStart={zoom.handleTouchMove}
        onTouchMove={zoom.handleTouchMove}
        onTouchEnd={zoom.handleTouchEnd}
        onTouchCancel={zoom.handleTouchEnd}
      >
        {zoom.dragState?.isDragging && (
          <div
            className={styles.zoomSelectionOverlay}
            ref={(el) => {
              if (el && zoom.dragState) {
                el.style.left = `${Math.min(zoom.dragState.startX, zoom.dragState.currentX)}px`;
                el.style.width = `${Math.abs(zoom.dragState.currentX - zoom.dragState.startX)}px`;
              }
            }}
          />
        )}
        {zoom.hoverX !== null && !zoom.dragState?.isDragging && (
          <div
            className={styles.verticalGuideLine}
            ref={(el) => {
              if (el && zoom.hoverX !== null) el.style.left = `${zoom.hoverX}px`;
            }}
          />
        )}
        <AgCharts className={styles.chart} options={chartOptions} />
      </div>
    </div>
  );
};
export default Chart;
