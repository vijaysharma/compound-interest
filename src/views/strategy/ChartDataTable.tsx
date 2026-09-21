'use client';
import React from 'react';
import { formatRupees } from './money';
import { COLUMN_LABELS } from './labels';
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
export const ChartDataTable = ({ snapshots }: { snapshots: PortfolioSnapshot[] }) => {
  const rows = sampleByYear(snapshots);
  if (rows.length === 0) return null;
  return (
    <details className={styles.tableDetails}>
      <summary className={styles.tableSummary}>View chart data as a table</summary>
      <div className={styles.tableScroll}>
        <table className={styles.dataTable}>
          <caption className={styles.srOnly}>
            Portfolio value on the first published NAV date of each year, derived from actual NAVs.
          </caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">{COLUMN_LABELS.core}</th>
              <th scope="col">{COLUMN_LABELS.growth}</th>
              <th scope="col">Combined</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((snapshot) => (
              <tr key={snapshot.date}>
                <th scope="row">{snapshot.date}</th>
                <td>{formatRupees(snapshot.column1Value)}</td>
                <td>{formatRupees(snapshot.column2Value)}</td>
                <td>{formatRupees(snapshot.totalValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
};
