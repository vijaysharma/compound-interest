import { useMemo } from 'react';
import {
  CartesianChartModule,
  CategoryAxisModule,
  CrossLinesModule,
  LegendModule,
  LineSeriesModule,
  LocaleModule,
  ModuleRegistry,
  NumberAxisModule,
} from 'ag-charts-community';
import type { AgCartesianChartOptions } from 'ag-charts-types';
import type { ChartDataset } from './types';
import { formatAxisCurrency } from './chartUtils';
import { selectChartDates } from './downsample';
import { normalizeChartDatasets, buildChartSeries } from './chartSeriesBuilder';
const yearOf = (value: string): string => {
  const parts = value.split('-');
  if (parts.length !== 3) return '';
  return parts[0].length === 4 ? parts[0] : parts[2].length === 4 ? parts[2] : '';
};
if (typeof window !== 'undefined') {
  ModuleRegistry.registerModules([
    CartesianChartModule,
    LineSeriesModule,
    CategoryAxisModule,
    NumberAxisModule,
    LegendModule,
    LocaleModule,
    CrossLinesModule,
  ]);
}
export function useChartOptions(
  datasets: ChartDataset[],
  initialInvestment: number,
  dataMode: 'nav' | 'value',
  height: number | 'auto' | undefined,
  autoHeight: boolean,
  minHeight: number,
  activeDates: string[],
  chartTheme: { isMobile: boolean; axisLine: string; labelText: string },
  markerDate?: string | null,
  markerLabel?: string
): AgCartesianChartOptions | null {
  return useMemo<AgCartesianChartOptions | null>(() => {
    if (datasets.length === 0 || initialInvestment <= 0 || activeDates.length === 0) return null;
    const normalized = normalizeChartDatasets(datasets, initialInvestment, dataMode);
    const plottedDates = selectChartDates(activeDates, normalized.map((d) => d.valueMap), undefined, [markerDate]);
    const chartData = plottedDates.map((date) => {
      const row: Record<string, string | number> = { date };
      for (let i = 0; i < normalized.length; i++) row[`fund_${i}`] = normalized[i].valueMap.get(date) ?? NaN;
      return row;
    });
    const isSingleDataset = normalized.length === 1;
    const series = buildChartSeries(normalized, chartTheme);
    const isAutoHeight = autoHeight || height === 'auto';
    const resolvedMinHeight = chartTheme.isMobile ? (minHeight > 0 ? Math.min(minHeight, 240) : 240) : minHeight > 0 ? minHeight : 350;
    const resolvedHeight = typeof height === 'number' ? height : resolvedMinHeight;
    return {
      background: { visible: false },
      padding: { top: 8, right: 8, bottom: 6, left: 4 },
      seriesArea: { padding: { top: 6, right: 6, bottom: 6, left: 4 } },
      data: chartData,
      ...(isAutoHeight ? { minHeight: resolvedMinHeight } : { height: resolvedHeight }),
      legend: { enabled: false },
      tooltip: {
        enabled: true,
        mode: isSingleDataset ? ('single' as const) : ('shared' as const),
        range: 'nearest' as const,
        position: { placement: ['top', 'bottom', 'right', 'left'] as const },
        wrapping: 'on-space' as const,
      },
      series,
      axes: {
        x: {
          type: 'category',
          position: 'bottom',
          line: { enabled: true, stroke: chartTheme.axisLine },
          ...(markerDate && plottedDates.includes(markerDate)
            ? {
                crossLines: [{
                  type: 'line' as const, value: markerDate, stroke: chartTheme.axisLine, strokeWidth: 1, lineDash: [4, 4],
                  label: { text: markerLabel ?? 'today', position: 'top' as const, fontSize: chartTheme.isMobile ? 8 : 9, color: chartTheme.labelText },
                }],
              }
            : {}),
          label: {
            enabled: true, rotation: 0, avoidCollisions: true, minSpacing: chartTheme.isMobile ? 48 : 60,
            fontSize: chartTheme.isMobile ? 8 : 9, fontWeight: 'bold', color: chartTheme.labelText,
            formatter: ({ value, index }: { value: unknown; index: number }) => {
              const year = yearOf(String(value));
              if (!year) return '';
              return index === 0 || year !== yearOf(String(plottedDates[index - 1] ?? '')) ? year : '';
            },
          },
        },
        y: {
          type: 'number', position: 'left', line: { enabled: true, stroke: chartTheme.axisLine },
          interval: { minSpacing: chartTheme.isMobile ? 44 : 28 },
          label: {
            avoidCollisions: true, fontSize: chartTheme.isMobile ? 8 : 9, fontWeight: 'bold',
            color: chartTheme.labelText, formatter: ({ value }: { value: number }) => formatAxisCurrency(value),
          },
        },
      },
    };
  }, [datasets, initialInvestment, dataMode, height, autoHeight, minHeight, activeDates, chartTheme, markerDate, markerLabel]);
}
