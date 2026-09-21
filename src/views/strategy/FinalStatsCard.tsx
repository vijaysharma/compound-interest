'use client';
import React from 'react';
import { formatRupees, formatUnits } from './money';
import { COLUMN_LABELS } from './labels';
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
      { label: `${COLUMN_LABELS.core} value`, value: formatRupees(totals.column1Value), strong: true },
      { label: `${COLUMN_LABELS.growth} value`, value: formatRupees(totals.column2Value), strong: true },
      { label: 'Total portfolio value', value: formatRupees(totals.totalValue), strong: true },
      { label: `${COLUMN_LABELS.core} units held`, value: formatUnits(totals.column1Units) },
    ],
  },
  {
    title: 'Money taken out',
    rows: [
      { label: `Withdrawn from ${COLUMN_LABELS.core.toLowerCase()}`, value: formatRupees(totals.withdrawnFromColumn1) },
      {
        label: `Withdrawn by ${COLUMN_LABELS.growth.toLowerCase()} SWPs`,
        value: formatRupees(totals.routedToColumn3 + totals.personalFromColumn2),
      },
    ],
  },
  {
    title: 'Money moved between stages',
    rows: [
      { label: `${COLUMN_LABELS.core} to ${COLUMN_LABELS.growth.toLowerCase()}`, value: formatRupees(totals.routedToColumn2) },
      { label: `Invested by ${COLUMN_LABELS.growth.toLowerCase()} SIPs`, value: formatRupees(totals.investedInColumn2) },
      { label: `${COLUMN_LABELS.growth} cash uninvested`, value: formatRupees(totals.unallocatedColumn2Cash) },
      { label: `${COLUMN_LABELS.growth} to ${COLUMN_LABELS.reinvest.toLowerCase()}`, value: formatRupees(totals.routedToColumn3) },
      { label: `Reinvested into ${COLUMN_LABELS.core.toLowerCase()}`, value: formatRupees(totals.reinvestedIntoColumn1) },
      { label: `${COLUMN_LABELS.reinvest} cash awaiting`, value: formatRupees(totals.column3CashBalance) },
    ],
  },
];
/**
 * Money the user actually took out and kept, called out on its own because it
 * is the figure the whole strategy exists to produce. It is the sum of the
 * personal-use share of every core withdrawal and growth-fund SWP — the
 * remainder of each was routed onward, not pocketed.
 *
 * The last drawn instalment is shown alongside the running total: the total
 * answers "how much have I taken so far", which says nothing about what the
 * strategy is paying right now, and that is what a step-up or a depleting
 * corpus actually changes.
 */
const PersonalUseCard = ({ totals }: { totals: StrategyTotals }) => {
  const last = totals.lastPersonalWithdrawal;
  return (
    <div className={styles.personalCard}>
      <h3 className={styles.personalTitle}>Personal use withdrawals</h3>
      <p className={styles.personalValue}>{formatRupees(totals.totalPersonalWithdrawals)}</p>
      <dl className={styles.personalSplit}>
        <div>
          <dt>From {COLUMN_LABELS.core.toLowerCase()}</dt>
          <dd>{formatRupees(totals.personalFromColumn1)}</dd>
        </div>
        <div>
          <dt>From {COLUMN_LABELS.growth.toLowerCase()} SWP</dt>
          <dd>{formatRupees(totals.personalFromColumn2)}</dd>
        </div>
      </dl>
      <dl className={styles.personalLast}>
        <dt className={styles.personalLastLabel}>Last drawn</dt>
        <dd className={styles.personalLastValue}>
          {last ? formatRupees(last.amount) : '—'}
          {last && (
            <span className={styles.personalLastMeta}>
              {last.date} · {last.source === 'core' ? COLUMN_LABELS.core : COLUMN_LABELS.growth} ·{' '}
              {last.fundName}
              {last.navDate !== last.date ? ` · NAV ${last.navDate}` : ''}
            </span>
          )}
        </dd>
      </dl>
    </div>
  );
};
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
