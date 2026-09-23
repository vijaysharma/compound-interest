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
import { getDateTime, formatCurrency, formatAxisCurrency } from './chartUtils';
import { selectChartDates } from './downsample';
/**
 * Year out of a chart category, which may be ISO (`2026-09-18`) or the
 * upstream `dd-MM-yyyy`. Returns '' when neither shape matches.
 */
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
    // ag-charts only ships what is registered, and this file registers
    // explicitly to keep the bundle small. The axis cross-line marking where
    // measured data ends is silently dropped without this — it logged
    // "required modules are not registered" and drew nothing.
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
  // Passed as scalars rather than a `{ date, label }` object: a literal built by
  // the caller is a new reference every render, which the memo would treat as a
  // change and rebuild every chart option.
  markerDate?: string | null,
  markerLabel?: string
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
      if (validPoints.length === 0) {
        return {
          label: dataset.label,
          color: dataset.color,
          valueMap: new Map<string, number>(),
          dashed: dataset.dashed === true,
          strokeOpacity: dataset.strokeOpacity,
          tooltipNote: dataset.tooltipNote,
        };
      }
      const startingNav = validPoints[0].nav;
      const valueMap = new Map<string, number>();
      if (dataMode === 'value') {
        for (const pt of validPoints) valueMap.set(pt.date, pt.nav);
      } else if (Number.isFinite(startingNav) && startingNav > 0) {
        const factor = initialInvestment / startingNav;
        for (const pt of validPoints) valueMap.set(pt.date, Number((pt.nav * factor).toFixed(2)));
      }
      return {
        label: dataset.label,
        color: dataset.color,
        valueMap,
        dashed: dataset.dashed === true,
        strokeOpacity: dataset.strokeOpacity,
        tooltipNote: dataset.tooltipNote,
      };
    });
    // Thin the shared date axis before building rows. Selection considers every
    // series so all of them stay sampled at the same dates and keep their
    // extremes; short windows come back untouched.
    const plottedDates = selectChartDates(
      activeDates,
      normalizedDatasets.map((d) => d.valueMap),
      undefined,
      [markerDate]
    );
    const chartData = plottedDates.map((date) => {
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
      // Scaled with stroke width so the dash reads the same on mobile, where
      // the line is thinner and a fixed pattern looks like a dotted line.
      ...(dataset.dashed ? { lineDash: chartTheme.isMobile ? [5, 3] : [7, 4] } : {}),
      ...(dataset.strokeOpacity !== undefined ? { strokeOpacity: dataset.strokeOpacity } : {}),
      marker: { enabled: false },
      tooltip: {
        showArrow: false,
        renderer: ({ datum }: { datum: Record<string, string | number> }) => {
          const value = datum[`fund_${index}`];
          if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
          const valFormatted = formatCurrency(value);
          // `tooltipNote` is what makes an extrapolated point legible: the date
          // and the number alone cannot say which scenario produced it, or that
          // it was projected rather than measured.
          const rows = [
            { label: isSingleDataset ? 'Value' : dataset.label, value: valFormatted },
            ...(dataset.tooltipNote ? [{ label: '', value: dataset.tooltipNote }] : []),
          ];
          if (isSingleDataset) return { heading: String(datum.date), data: rows };
          return {
            heading: String(datum.date),
            symbol: { marker: { enabled: true, shape: 'circle' as const, fill: dataset.color, stroke: dataset.color } },
            data: rows,
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
          // Only drawn when the date survived downsampling; a cross-line on a
          // category axis is positioned by category, so a value that is not in
          // `plottedDates` would be dropped by ag-charts without complaint.
          ...(markerDate && plottedDates.includes(markerDate)
            ? {
                crossLines: [
                  {
                    type: 'line' as const,
                    value: markerDate,
                    stroke: chartTheme.axisLine,
                    strokeWidth: 1,
                    lineDash: [4, 4],
                    label: {
                      text: markerLabel ?? 'today',
                      position: 'top' as const,
                      fontSize: chartTheme.isMobile ? 8 : 9,
                      color: chartTheme.labelText,
                    },
                  },
                ],
              }
            : {}),
          /*
           * Year labels, thinned to fit.
           *
           * These were disabled outright, which is survivable on a ten-year
           * chart and not on a hundred-year one — the projected line had no
           * time reference at all. `formatter` reduces each category to its
           * year and blanks the repeats, so a decade of daily points
           * contributes one label rather than hundreds; `avoidCollisions` then
           * drops whatever still will not fit.
           */
          label: {
            enabled: true,
            rotation: 0,
            avoidCollisions: true,
            minSpacing: chartTheme.isMobile ? 48 : 60,
            fontSize: chartTheme.isMobile ? 8 : 9,
            fontWeight: 'bold',
            color: chartTheme.labelText,
            formatter: ({ value, index }: { value: unknown; index: number }) => {
              const year = yearOf(String(value));
              if (!year) return '';
              return index === 0 || year !== yearOf(String(plottedDates[index - 1] ?? '')) ? year : '';
            },
          },
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
  }, [
    datasets,
    initialInvestment,
    dataMode,
    height,
    autoHeight,
    minHeight,
    activeDates,
    chartTheme,
    markerDate,
    markerLabel,
  ]);
}
