'use client';
import React, { useMemo } from 'react';
import Chart, { type ChartDataset } from '../../components/Chart';
import JoinedButtonGroup from '../../components/JoinedButtonGroup';
import { getChartSeriesColor } from '../../data/chartColors';
import { ChartDataTable } from './ChartDataTable';
import { formatRupees } from './money';
import { COLUMN_LABELS } from './labels';
import { isOnOrBefore } from './schedule';
import {
  HORIZON_PRESETS,
  SCENARIO_BLURBS,
  SCENARIO_KEYS,
  SCENARIO_LABELS,
  deflateSnapshots,
  type ProjectionSettings,
} from './projection';
import type { StrategyProjection } from './useStrategyProjection';
import type { PortfolioSnapshot, StrategyConfig, StrategyResult } from './types';
import styles from './StrategyCalculator.module.scss';
interface StrategyChartCardProps {
  config: StrategyConfig;
  result: StrategyResult;
  projection: StrategyProjection;
  settings: ProjectionSettings;
  onSettingsChange: (patch: Partial<ProjectionSettings>) => void;
  isLoading: boolean;
  message: string | null;
}
/**
 * The measured columns. Both stop at the as-of date even when a projection is
 * running: only the combined line continues.
 *
 * Extrapolating all three would put six lines on a hundred-year axis, where the
 * dashed variants are hard to tell apart and the split between columns is not
 * the question a long horizon is asked. The combined value is.
 */
const HISTORICAL_SERIES = [
  { key: 'column1Value', label: `${COLUMN_LABELS.core} value`, colorIndex: 0 },
  { key: 'column2Value', label: `${COLUMN_LABELS.growth} value`, colorIndex: 1 },
] as const;
const COMBINED_COLOR_INDEX = 4;
/** Pushes the projected line back without changing its hue. */
const PROJECTED_STROKE_OPACITY = 0.55;
const VALUE_MODES = [
  {
    id: 'value-today',
    value: 'today' as const,
    title: "Today's ₹",
    tooltip: 'Discounted back to what the money would buy now',
  },
  {
    id: 'value-nominal',
    value: 'nominal' as const,
    title: 'Nominal',
    tooltip: 'The rupee figure printed on that future date',
  },
];
const PROJECTION_TOGGLE = [
  { id: 'projection-off', value: false, title: 'Off' },
  { id: 'projection-on', value: true, title: 'On' },
];
const percent = (rate: number): string => `${(rate * 100).toFixed(1)}%`;
/**
 * Button labels, shortened from `SCENARIO_LABELS`.
 *
 * "Moderate" forces the scenario group far wider than the other two and
 * unbalances the row. The notes underneath spell all three out in full, so the
 * abbreviation costs nothing.
 */
const SCENARIO_BUTTON_LABELS: Record<ProjectionSettings['scenarioKey'], string> = {
  weak: 'Low',
  median: 'Mod',
  strong: 'High',
};
const DEFLATED_KEYS = ['column1Value', 'column2Value', 'totalValue'] as const;
export const StrategyChartCard = ({
  config,
  result,
  projection,
  settings,
  onSettingsChange,
  isLoading,
  message,
}: StrategyChartCardProps) => {
  const selected = projection.selected;
  const isProjecting = settings.enabled && projection.isAvailable && selected !== null;
  /**
   * Whether the switch is worth showing at all. Offering it with no fund or no
   * NAV history would be a control that silently does nothing.
   */
  const canProject = Boolean(config.column1.fund) && result.snapshots.length > 0;
  const primaryFundName = config.column1.fund?.schemeName ?? '';
  const primaryBand = config.column1.fund
    ? projection.bands[config.column1.fund.schemeCode]
    : undefined;
  const datasets = useMemo<ChartDataset[]>(() => {
    /*
     * A projected run's snapshots already span investment date to horizon as one
     * continuous series, and its historical prefix reproduces the unprojected
     * run exactly — `buildProjectedConfig` guarantees it. So there is nothing to
     * splice or blend: the whole chart comes from one snapshot list, and the
     * only work here is deciding where to stop drawing solid and start dashed.
     */
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
    if (isProjecting) {
      // Starts *at* the as-of date, not after it, so the dashed line begins on
      // the solid line's last point rather than floating a gap away from it.
      const projected = snapshots.filter((snapshot) => !isOnOrBefore(snapshot.date, asOf));
      const joinPoint = measured.at(-1);
      const scenarioLabel = SCENARIO_LABELS[settings.scenarioKey];
      series.push({
        label: `Combined, projected (${scenarioLabel})`,
        color: getChartSeriesColor(COMBINED_COLOR_INDEX),
        dashed: true,
        strokeOpacity: PROJECTED_STROKE_OPACITY,
        tooltipNote: `Projected · ${scenarioLabel} · extrapolated, not measured`,
        data: [...(joinPoint ? [joinPoint] : []), ...projected].map((snapshot) => ({
          date: snapshot.date,
          nav: snapshot.totalValue,
        })),
      });
    }
    return series;
  }, [
    selected,
    result.snapshots,
    isProjecting,
    settings.valueMode,
    settings.inflationPct,
    settings.scenarioKey,
    config.asOfDate,
  ]);
  const first = result.snapshots[0];
  const last = result.snapshots.at(-1);
  const summary =
    first && last
      ? `Portfolio value from ${first.date} to ${last.date}. The ${COLUMN_LABELS.core.toLowerCase()} moved from ` +
        `${formatRupees(first.column1Value)} to ${formatRupees(last.column1Value)}; the ${COLUMN_LABELS.growth.toLowerCase()} ` +
        `reached ${formatRupees(last.column2Value)}; combined value ${formatRupees(last.totalValue)}.` +
        (isProjecting
          ? ` Projected to ${projection.horizonIso} on the ${SCENARIO_LABELS[settings.scenarioKey].toLowerCase()} ` +
            `scenario, reaching ${formatRupees(selected.terminalValue)} in nominal rupees.`
          : '')
      : 'No portfolio values to show yet.';
  return (
    <section className={styles.card} aria-labelledby="strategy-chart-title">
      <div className={styles.chartHeader}>
        <h2 className={styles.chartTitle} id="strategy-chart-title">
          Portfolio value
        </h2>
        {canProject && (
          // Beside the heading rather than in the row below, because it governs
          // whether that row exists at all.
          <JoinedButtonGroup<boolean>
            title="Projection"
            data={PROJECTION_TOGGLE}
            selectedValue={settings.enabled}
            updateSelectedValue={(enabled) => onSettingsChange({ enabled })}
            sizePrefix="xs"
            compact
            className={styles.projectionToggle}
          />
        )}
      </div>
      {isProjecting && (
        <>
          <div className={styles.chartControls}>
            <JoinedButtonGroup<number>
              title="Project to"
              data={HORIZON_PRESETS.map((years) => ({
                id: `horizon-${years}`,
                value: years,
                title: `${years}y`,
              }))}
              selectedValue={settings.horizonYears}
              updateSelectedValue={(horizonYears) => onSettingsChange({ horizonYears })}
              sizePrefix="sm"
              compact
              className={`${styles.chartControl} ${styles.chartControlWide}`}
            />
            <JoinedButtonGroup<ProjectionSettings['scenarioKey']>
              title="Return scenario"
              data={SCENARIO_KEYS.map((key) => ({
                id: `scenario-${key}`,
                value: key,
                title: SCENARIO_BUTTON_LABELS[key],
                // Keeps the percentile meaning on the button too, for anyone
                // who hovers before reading the notes below.
                tooltip: SCENARIO_BLURBS[key],
              }))}
              selectedValue={settings.scenarioKey}
              updateSelectedValue={(scenarioKey) => onSettingsChange({ scenarioKey })}
              sizePrefix="sm"
              compact
              className={styles.chartControl}
            />
            <JoinedButtonGroup<ProjectionSettings['valueMode']>
              title="Money"
              data={VALUE_MODES}
              selectedValue={settings.valueMode}
              updateSelectedValue={(valueMode) => onSettingsChange({ valueMode })}
              sizePrefix="sm"
              compact
              className={styles.chartControl}
            />
          </div>
          {/*
           * Both control labels name things that are not self-explanatory, and
           * the per-button hover text that carries the detail is invisible on
           * touch. Worked through with this strategy's own numbers rather than
           * described in the abstract — the spread between scenarios only lands
           * when you see what it does to a real amount.
           */}
          <dl className={styles.chartControlNotes}>
            <dt>Low / Moderate / High</dt>
            <dd>
              The 10th, 50th and 90th percentiles of what this fund has actually returned over every
              rolling window in its own published history — not assumptions. Low means it did worse
              than this in 1 window out of 10.
              {primaryBand
                ? ` For ${primaryFundName}: Low ${percent(primaryBand.weak)}, Moderate ` +
                  `${percent(primaryBand.median)}, High ${percent(primaryBand.strong)} a year, ` +
                  `from ${primaryBand.historyYears.toFixed(1)} years of NAVs.`
                : ''}
            </dd>
            <dt>Today&apos;s ₹ / Nominal</dt>
            <dd>
              Nominal is the rupee figure on that future date. Today&apos;s ₹ discounts it by{' '}
              {settings.inflationPct}% a year, so it reads as what that money would buy now — which
              is the only way the early years stay visible on the chart once decades of compounding
              are on it.
            </dd>
          </dl>
        </>
      )}
      <ul className={styles.chartLegend}>
        {datasets.map((dataset) => (
          <li key={dataset.label} className={styles.legendItem}>
            <span
              className={`${styles.legendDot} ${dataset.dashed ? styles.legendDotProjected : ''}`.trim()}
              ref={(el) => {
                if (el) el.style.backgroundColor = dataset.color;
              }}
              aria-hidden="true"
            />
            {dataset.label}
          </li>
        ))}
      </ul>
      <p className={styles.srOnly}>{summary}</p>
      <Chart
        className={styles.chart}
        datasets={datasets}
        investmentAmount={result.totals.initialInvestment}
        dataMode="value"
        startDate={config.column1.investmentDate}
        endDate={isProjecting ? projection.horizonIso : config.asOfDate}
        // The single clearest cue for where measurement stops. Dashes and
        // opacity alone leave the reader estimating the boundary.
        markerDate={isProjecting ? config.asOfDate : null}
        markerLabel="today"
        minHeight={320}
        showPresets
        isLoading={isLoading}
        loadingLabel="Loading historical NAV data…"
        emptyMessage={message ?? 'Select a fund to plot its actual NAV history.'}
      />
      <ChartDataTable
        snapshots={selected ? selected.result.snapshots : result.snapshots}
        asOfDate={config.asOfDate}
      />
    </section>
  );
};
