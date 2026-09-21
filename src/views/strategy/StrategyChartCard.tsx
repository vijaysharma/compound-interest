'use client';
import React, { useMemo } from 'react';
import Chart, { type ChartDataset } from '../../components/Chart';
import { getChartSeriesColor } from '../../data/chartColors';
import { ChartDataTable } from './ChartDataTable';
import { formatRupees } from './money';
import { COLUMN_LABELS } from './labels';
import type { StrategyConfig, StrategyResult } from './types';
import styles from './StrategyCalculator.module.scss';
interface StrategyChartCardProps {
  config: StrategyConfig;
  result: StrategyResult;
  isLoading: boolean;
  message: string | null;
}
const SERIES = [
  { key: 'column1Value', label: `${COLUMN_LABELS.core} value`, colorIndex: 0 },
  { key: 'column2Value', label: `${COLUMN_LABELS.growth} value`, colorIndex: 1 },
  { key: 'totalValue', label: 'Combined value', colorIndex: 4 },
] as const;
export const StrategyChartCard = ({
  config,
  result,
  isLoading,
  message,
}: StrategyChartCardProps) => {
  const datasets = useMemo<ChartDataset[]>(
    () =>
      SERIES.map((series) => ({
        label: series.label,
        color: getChartSeriesColor(series.colorIndex),
        data: result.snapshots.map((snapshot) => ({
          date: snapshot.date,
          nav: snapshot[series.key],
        })),
      })),
    [result.snapshots]
  );
  const first = result.snapshots[0];
  const last = result.snapshots.at(-1);
  const summary =
    first && last
      ? `Historical portfolio value from ${first.date} to ${last.date}. The ${COLUMN_LABELS.core.toLowerCase()} moved from ` +
        `${formatRupees(first.column1Value)} to ${formatRupees(last.column1Value)}; the ${COLUMN_LABELS.growth.toLowerCase()} ` +
        `reached ${formatRupees(last.column2Value)}; combined value ` +
        `${formatRupees(last.totalValue)}.`
      : 'No historical portfolio values to show yet.';
  return (
    <section className={styles.card} aria-labelledby="strategy-chart-title">
      <h2 className={styles.cardTitle} id="strategy-chart-title">
        Portfolio value from actual NAVs
      </h2>
      <ul className={styles.chartLegend}>
        {datasets.map((dataset) => (
          <li key={dataset.label} className={styles.legendItem}>
            <span
              className={styles.legendDot}
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
        endDate={config.asOfDate}
        minHeight={320}
        showPresets
        isLoading={isLoading}
        loadingLabel="Loading historical NAV data…"
        emptyMessage={message ?? 'Select a fund to plot its actual NAV history.'}
      />
      <ChartDataTable snapshots={result.snapshots} />
    </section>
  );
};
