'use client';
import React, { useMemo } from 'react';
import Chart, { type ChartDataset } from '../../components/Chart';
import JoinedButtonGroup from '../../components/JoinedButtonGroup';
import { ChartDataTable } from './ChartDataTable';
import { formatRupees } from './money';
import { COLUMN_LABELS } from './labels';
import { SCENARIO_LABELS, type ProjectionSettings } from './projectionProfiles';
import { ProjectionControlsBar } from './ProjectionControlsBar';
import { buildStrategyDatasets } from './strategyChartDatasets';
import type { StrategyProjection } from './useStrategyProjection';
import type { StrategyConfig, StrategyResult } from './types';
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
const PROJECTION_TOGGLE = [
  { id: 'projection-off', value: false, title: 'Off' },
  { id: 'projection-on', value: true, title: 'On' },
];
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
  const canProject = Boolean(config.column1.fund) && result.snapshots.length > 0;
  const datasets = useMemo<ChartDataset[]>(
    () => buildStrategyDatasets(config, result, selected, settings, isProjecting),
    [config, result, selected, settings, isProjecting]
  );
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
      {isProjecting && <ProjectionControlsBar settings={settings} onSettingsChange={onSettingsChange} />}
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
