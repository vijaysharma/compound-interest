import { useMemo } from 'react';
import {
  CartesianChartModule,
  CategoryAxisModule,
  LegendModule,
  LineSeriesModule,
  LocaleModule,
  ModuleRegistry,
  NumberAxisModule,
} from 'ag-charts-community';
import type { AgCartesianChartOptions } from 'ag-charts-types';
import type { ChartDataset } from './types';
import { getDateTime, formatCurrency, formatAxisCurrency } from './chartUtils';
if (typeof window !== 'undefined') {
  ModuleRegistry.registerModules([
    CartesianChartModule,
    LineSeriesModule,
    CategoryAxisModule,
    NumberAxisModule,
    LegendModule,
    LocaleModule,
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
  chartTheme: { isMobile: boolean; axisLine: string; labelText: string }
): AgCartesianChartOptions | null {
  return useMemo<AgCartesianChartOptions | null>(() => {
    if (datasets.length === 0 || initialInvestment <= 0 || activeDates.length === 0) return null;
    const normalizedDatasets = datasets.map((dataset) => {
      const validPoints: { date: string; time: number; nav: number }[] = [];
      for (const point of dataset.data) {
        if (Number.isFinite(point.nav) && point.nav > 0) {
          const time = getDateTime(point.date);
          if (Number.isFinite(time)) validPoints.push({ date: point.date, time, nav: point.nav });
        }
      }
      validPoints.sort((a, b) => a.time - b.time);
      if (validPoints.length === 0) return { label: dataset.label, color: dataset.color, valueMap: new Map<string, number>() };
      const startingNav = validPoints[0].nav;
      const valueMap = new Map<string, number>();
      if (dataMode === 'value') {
        for (const pt of validPoints) valueMap.set(pt.date, pt.nav);
      } else if (Number.isFinite(startingNav) && startingNav > 0) {
        const factor = initialInvestment / startingNav;
        for (const pt of validPoints) valueMap.set(pt.date, Number((pt.nav * factor).toFixed(2)));
      }
      return { label: dataset.label, color: dataset.color, valueMap };
    });
    const chartData = activeDates.map((date) => {
      const row: Record<string, string | number> = { date };
      for (let i = 0; i < normalizedDatasets.length; i++) row[`fund_${i}`] = normalizedDatasets[i].valueMap.get(date) ?? NaN;
      return row;
    });
    const isSingleDataset = normalizedDatasets.length === 1;
    const series = normalizedDatasets.map((dataset, index) => ({
      type: 'line' as const,
      xKey: 'date',
      xName: 'Date',
      yKey: `fund_${index}`,
      yName: dataset.label,
      stroke: dataset.color,
      strokeWidth: chartTheme.isMobile ? 1.5 : 2,
      marker: { enabled: false },
      tooltip: {
        showArrow: false,
        renderer: ({ datum }: { datum: Record<string, string | number> }) => {
          const value = datum[`fund_${index}`];
          if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
          const valFormatted = formatCurrency(value);
          if (isSingleDataset) return { heading: String(datum.date), data: [{ label: 'Value', value: valFormatted }] };
          return {
            heading: String(datum.date),
            symbol: { marker: { enabled: true, shape: 'circle' as const, fill: dataset.color, stroke: dataset.color } },
            data: [{ label: dataset.label, value: valFormatted }],
          };
        },
      },
    }));
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
          label: { enabled: false, rotation: 0, avoidCollisions: true, fontSize: chartTheme.isMobile ? 8 : 9, fontWeight: 'bold', color: chartTheme.labelText },
        },
        y: {
          type: 'number',
          position: 'left',
          line: { enabled: true, stroke: chartTheme.axisLine },
          interval: { minSpacing: chartTheme.isMobile ? 44 : 28 },
          label: {
            avoidCollisions: true,
            fontSize: chartTheme.isMobile ? 8 : 9,
            fontWeight: 'bold',
            color: chartTheme.labelText,
            formatter: ({ value }: { value: number }) => formatAxisCurrency(value),
          },
        },
      },
    };
  }, [datasets, initialInvestment, dataMode, height, autoHeight, minHeight, activeDates, chartTheme]);
}
