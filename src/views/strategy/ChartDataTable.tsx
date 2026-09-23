'use client';
import React from 'react';
import { formatRupees } from './money';
import { COLUMN_LABELS } from './labels';
import { isOnOrBefore } from './schedule';
import type { PortfolioSnapshot } from './types';
import styles from './StrategyCalculator.module.scss';
/** One row per calendar year plus the final snapshot, so the table stays readable. */
const sampleByYear = (snapshots: PortfolioSnapshot[]): PortfolioSnapshot[] => {
  const seen = new Set<string>();
  const rows: PortfolioSnapshot[] = [];
  for (const snapshot of snapshots) {
    const year = snapshot.date.slice(0, 4);
    if (seen.has(year)) continue;
    seen.add(year);
    rows.push(snapshot);
  }
  const last = snapshots.at(-1);
  if (last && rows.at(-1)?.date !== last.date) rows.push(last);
  return rows;
};
/**
 * The chart's accessible equivalent: the same snapshots as a real table, so the
 * series are reachable by screen reader and keyboard.
 */
export const ChartDataTable = ({
  snapshots,
  asOfDate,
}: {
  snapshots: PortfolioSnapshot[];
  /** Rows after this date are extrapolated, and say so. */
  asOfDate?: string;
}) => {
  const rows = sampleByYear(snapshots);
  if (rows.length === 0) return null;
  // Sampling one row per year already keeps this to ~100 rows at a hundred-year
  // horizon, so no further thinning is needed — but the projected rows have to
  // be distinguishable, or the table silently presents extrapolation as record.
  const hasProjected = Boolean(asOfDate) && rows.some((r) => !isOnOrBefore(r.date, asOfDate!));
  return (
    <details className={styles.tableDetails}>
      <summary className={styles.tableSummary}>View chart data as a table</summary>
      <div className={styles.tableScroll}>
        <table className={styles.dataTable}>
          <caption className={styles.srOnly}>
            Portfolio value on the first published NAV date of each year.
            {hasProjected
              ? ' Rows marked projected are extrapolated past the last published NAV, not measured.'
              : ' Derived from actual NAVs.'}
          </caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">{COLUMN_LABELS.core}</th>
              <th scope="col">{COLUMN_LABELS.growth}</th>
              <th scope="col">Combined</th>
              {hasProjected && <th scope="col">Source</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((snapshot) => {
              const projected = Boolean(asOfDate) && !isOnOrBefore(snapshot.date, asOfDate!);
              return (
                <tr key={snapshot.date}>
                  <th scope="row">{snapshot.date}</th>
                  <td>{formatRupees(snapshot.column1Value)}</td>
                  <td>{formatRupees(snapshot.column2Value)}</td>
                  <td>{formatRupees(snapshot.totalValue)}</td>
                  {hasProjected && <td>{projected ? 'Projected' : 'Actual'}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
};
