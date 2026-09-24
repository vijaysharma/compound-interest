import type { ChartDataset } from './types';
import { getDateTime, formatCurrency } from './chartUtils';
export interface NormalizedDataset {
  label: string;
  color: string;
  valueMap: Map<string, number>;
  dashed: boolean;
  strokeOpacity?: number;
  tooltipNote?: string;
}
export const normalizeChartDatasets = (
  datasets: ChartDataset[],
  initialInvestment: number,
  dataMode: 'nav' | 'value'
): NormalizedDataset[] =>
  datasets.map((dataset) => {
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
export const buildChartSeries = (
  normalizedDatasets: NormalizedDataset[],
  chartTheme: { isMobile: boolean }
) => {
  const isSingle = normalizedDatasets.length === 1;
  return normalizedDatasets.map((dataset, index) => ({
    type: 'line' as const,
    xKey: 'date',
    xName: 'Date',
    yKey: `fund_${index}`,
    yName: dataset.label,
    stroke: dataset.color,
    strokeWidth: chartTheme.isMobile ? 1.5 : 2,
    ...(dataset.dashed ? { lineDash: chartTheme.isMobile ? [5, 3] : [7, 4] } : {}),
    ...(dataset.strokeOpacity !== undefined ? { strokeOpacity: dataset.strokeOpacity } : {}),
    marker: { enabled: false },
    tooltip: {
      showArrow: false,
      renderer: ({ datum }: { datum: Record<string, string | number> }) => {
        const value = datum[`fund_${index}`];
        if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
        const rows = [
          { label: isSingle ? 'Value' : dataset.label, value: formatCurrency(value) },
          ...(dataset.tooltipNote ? [{ label: '', value: dataset.tooltipNote }] : []),
        ];
        if (isSingle) return { heading: String(datum.date), data: rows };
        return {
          heading: String(datum.date),
          symbol: { marker: { enabled: true, shape: 'circle' as const, fill: dataset.color, stroke: dataset.color } },
          data: rows,
        };
      },
    },
  }));
};
