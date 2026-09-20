'use client';
import React from 'react';
import { formatRupees, formatUnits } from './money';
import type { StrategyTotals } from './types';
import styles from './StrategyCalculator.module.scss';
interface StatRow {
  label: string;
  value: string;
  strong?: boolean;
}
interface StatGroup {
  title: string;
  rows: StatRow[];
}
const buildGroups = (totals: StrategyTotals): StatGroup[] => [
  {
    title: 'Holdings',
    rows: [
      { label: 'Initial investment', value: formatRupees(totals.initialInvestment) },
      { label: 'Column 1 value', value: formatRupees(totals.column1Value), strong: true },
      { label: 'Column 2 value', value: formatRupees(totals.column2Value), strong: true },
      { label: 'Total portfolio value', value: formatRupees(totals.totalValue), strong: true },
      { label: 'Column 1 units held', value: formatUnits(totals.column1Units) },
    ],
  },
  {
    title: 'Money taken out',
    rows: [
      { label: 'Withdrawn from Column 1', value: formatRupees(totals.withdrawnFromColumn1) },
      { label: 'Withdrawn from Column 2 SWPs', value: formatRupees(totals.routedToColumn3 + totals.personalFromColumn2) },
    ],
  },
  {
    title: 'Money moved between columns',
    rows: [
      { label: 'Column 1 to Column 2', value: formatRupees(totals.routedToColumn2) },
      { label: 'Invested by Column 2 SIPs', value: formatRupees(totals.investedInColumn2) },
      { label: 'Column 2 cash uninvested', value: formatRupees(totals.unallocatedColumn2Cash) },
      { label: 'Column 2 to Column 3', value: formatRupees(totals.routedToColumn3) },
      { label: 'Reinvested into Column 1', value: formatRupees(totals.reinvestedIntoColumn1) },
      { label: 'Column 3 cash awaiting', value: formatRupees(totals.column3CashBalance) },
    ],
  },
];
/**
 * Money the user actually took out and kept, called out on its own because it
 * is the figure the whole strategy exists to produce. It is the sum of the
 * personal-use share of every Column 1 withdrawal and Column 2 SWP — the
 * remainder of each was routed onward, not pocketed.
 */
const PersonalUseCard = ({ totals }: { totals: StrategyTotals }) => (
  <div className={styles.personalCard}>
    <h3 className={styles.personalTitle}>Personal use withdrawals</h3>
    <p className={styles.personalValue}>{formatRupees(totals.totalPersonalWithdrawals)}</p>
    <dl className={styles.personalSplit}>
      <div>
        <dt>From Column 1</dt>
        <dd>{formatRupees(totals.personalFromColumn1)}</dd>
      </div>
      <div>
        <dt>From Column 2 SWP</dt>
        <dd>{formatRupees(totals.personalFromColumn2)}</dd>
      </div>
    </dl>
  </div>
);
/**
 * The closing position. Every figure here comes from the same engine run that
 * draws the chart, valued at the NAV applicable to the as-of date.
 */
export const FinalStatsCard = ({ totals }: { totals: StrategyTotals }) => (
  <section className={styles.card} aria-labelledby="strategy-stats-title">
    <h2 className={styles.cardTitle} id="strategy-stats-title">
      Final position
    </h2>
    <PersonalUseCard totals={totals} />
    <p className={styles.cardSubtitle}>
      {totals.asOfNavDate
        ? `Valued at the NAV published ${totals.asOfNavDate} (as of ${totals.asOfDate}).`
        : 'Select a fund to value the portfolio.'}
    </p>
    {buildGroups(totals).map((group) => (
      <div key={group.title} className={styles.statGroup}>
        <h3 className={styles.statGroupTitle}>{group.title}</h3>
        {group.rows.map((row) => (
          <div key={row.label} className={styles.statRow}>
            <span className={styles.statLabel}>{row.label}</span>
            <span className={`${styles.statValue} ${row.strong ? styles.statStrong : ''}`.trim()}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    ))}
  </section>
);
