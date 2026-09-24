import type { ChartDataset } from '../../components/Chart';
import { getChartSeriesColor } from '../../data/chartColors';
import { COLUMN_LABELS } from './labels';
import { isOnOrBefore } from './schedule';
import {
  SCENARIO_BUTTON_LABELS,
  type ProjectionSettings,
  type ScenarioOutcome,
} from './projectionProfiles';
import { deflateSnapshots } from './projectionDeflate';
import type { PortfolioSnapshot, StrategyConfig, StrategyResult } from './types';
export const HISTORICAL_SERIES = [
  { key: 'column1Value', label: `${COLUMN_LABELS.core} value`, colorIndex: 0 },
  { key: 'column2Value', label: `${COLUMN_LABELS.growth} value`, colorIndex: 1 },
] as const;
export const COMBINED_COLOR_INDEX = 4;
export const PROJECTED_STROKE_OPACITY = 0.55;
export const DEFLATED_KEYS = ['column1Value', 'column2Value', 'totalValue'] as const;
export const buildStrategyDatasets = (
  config: StrategyConfig,
  result: StrategyResult,
  selected: ScenarioOutcome | null,
  settings: ProjectionSettings,
  isProjecting: boolean
): ChartDataset[] => {
  const source: PortfolioSnapshot[] = selected ? selected.result.snapshots : result.snapshots;
  const snapshots =
    isProjecting && settings.valueMode === 'today'
      ? deflateSnapshots(source, DEFLATED_KEYS, config.asOfDate, settings.inflationPct)
      : source;
  const asOf = config.asOfDate;
  const measured = snapshots.filter((snapshot) => isOnOrBefore(snapshot.date, asOf));
  const series: ChartDataset[] = HISTORICAL_SERIES.map((entry) => ({
    label: entry.label,
    color: getChartSeriesColor(entry.colorIndex),
    data: measured.map((snapshot) => ({ date: snapshot.date, nav: snapshot[entry.key] })),
    tooltipNote: 'Actual NAVs',
  }));
  series.push({
    label: 'Combined value',
    color: getChartSeriesColor(COMBINED_COLOR_INDEX),
    data: measured.map((snapshot) => ({ date: snapshot.date, nav: snapshot.totalValue })),
    tooltipNote: 'Actual NAVs',
  });
  if (!isProjecting) return series;
  const projected = snapshots.filter((snapshot) => !isOnOrBefore(snapshot.date, asOf));
  const joinPoint = measured.at(-1);
  const scenarioLabel = SCENARIO_BUTTON_LABELS[settings.scenarioKey];
  series.push({
    label: `${COLUMN_LABELS.core}, proj (${scenarioLabel})`,
    color: getChartSeriesColor(0),
    dashed: true,
    strokeOpacity: PROJECTED_STROKE_OPACITY,
    tooltipNote: `Projected · ${scenarioLabel} · ${COLUMN_LABELS.core}`,
    data: [
      ...(joinPoint ? [{ date: joinPoint.date, nav: joinPoint.column1Value }] : []),
      ...projected.map((s) => ({ date: s.date, nav: s.column1Value })),
    ],
  });
  series.push({
    label: `${COLUMN_LABELS.growth}, proj (${scenarioLabel})`,
    color: getChartSeriesColor(1),
    dashed: true,
    strokeOpacity: PROJECTED_STROKE_OPACITY,
    tooltipNote: `Projected · ${scenarioLabel} · ${COLUMN_LABELS.growth}`,
    data: [
      ...(joinPoint ? [{ date: joinPoint.date, nav: joinPoint.column2Value }] : []),
      ...projected.map((s) => ({ date: s.date, nav: s.column2Value })),
    ],
  });
  series.push({
    label: `Combined, proj (${scenarioLabel})`,
    color: getChartSeriesColor(COMBINED_COLOR_INDEX),
    dashed: true,
    strokeOpacity: 0.75,
    tooltipNote: `Projected · ${scenarioLabel} · Combined`,
    data: [
      ...(joinPoint ? [{ date: joinPoint.date, nav: joinPoint.totalValue }] : []),
      ...projected.map((s) => ({ date: s.date, nav: s.totalValue })),
    ],
  });
  return series;
};
