import React from 'react';
import { formatRupees } from './money';
import { COLUMN_LABELS } from './labels';
import { inTodaysRupees } from './projectionDeflate';
import type { ProjectionSettings, ScenarioOutcome } from './projectionProfiles';
import type { StrategyTotals } from './types';
import styles from './StrategyCalculator.module.scss';
export interface PersonalUseCardProps {
  totals: StrategyTotals;
  projTotals?: StrategyTotals | null;
  settings?: ProjectionSettings;
  outcome?: ScenarioOutcome | null;
}
export const PersonalUseCard = ({
  totals,
  projTotals,
  settings,
  outcome,
}: PersonalUseCardProps) => {
  const isProjecting = Boolean(projTotals && settings?.enabled);
  const last = totals.lastPersonalWithdrawal;
  const projLast = projTotals?.lastPersonalWithdrawal;
  const projLastToday =
    isProjecting && projLast && settings?.valueMode === 'today'
      ? inTodaysRupees(projLast.amount, settings.inflationPct, settings.horizonYears)
      : null;
  return (
    <div className={styles.personalCard}>
      <h3 className={styles.personalTitle}>Personal use withdrawals</h3>
      {isProjecting && projTotals ? (
        <div className={styles.personalHeadline}>
          <div className={styles.personalValueBlock}>
            <span className={styles.personalValueMeta}>Current</span>
            <span className={styles.personalValue}>{formatRupees(totals.totalPersonalWithdrawals)}</span>
          </div>
          <span className={styles.personalArrow} aria-hidden="true">→</span>
          <div className={styles.personalValueBlock}>
            <span className={styles.personalValueMeta}>Projected ({settings?.horizonYears}y)</span>
            <span className={styles.personalValueProjected}>
              {formatRupees(projTotals.totalPersonalWithdrawals)}
            </span>
          </div>
        </div>
      ) : (
        <p className={styles.personalValue}>{formatRupees(totals.totalPersonalWithdrawals)}</p>
      )}
      <dl className={styles.personalSplit}>
        <div className={isProjecting ? styles.personalSplitItem : undefined}>
          <dt>From {COLUMN_LABELS.core.toLowerCase()}</dt>
          <dd>
            {formatRupees(totals.personalFromColumn1)}
            {isProjecting && projTotals && (
              <span className={styles.personalSplitProjected}>
                {' → '}
                <strong className={styles.personalSplitProjectedValue}>
                  {formatRupees(projTotals.personalFromColumn1)}
                </strong>
              </span>
            )}
          </dd>
        </div>
        <div className={isProjecting ? styles.personalSplitItem : undefined}>
          <dt>From {COLUMN_LABELS.growth.toLowerCase()} SWP</dt>
          <dd>
            {formatRupees(totals.personalFromColumn2)}
            {isProjecting && projTotals && (
              <span className={styles.personalSplitProjected}>
                {' → '}
                <strong className={styles.personalSplitProjectedValue}>
                  {formatRupees(projTotals.personalFromColumn2)}
                </strong>
              </span>
            )}
          </dd>
        </div>
      </dl>
      <dl className={styles.personalLast}>
        <dt className={styles.personalLastLabel}>
          {isProjecting ? 'Last drawn (Actual)' : 'Last drawn'}
        </dt>
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
        {isProjecting && (
          <>
            <dt className={styles.personalLastLabelProjected}>
              At horizon ({settings?.horizonYears}y Proj)
            </dt>
            <dd className={styles.personalLastValueProjected}>
              {projLast ? formatRupees(projLast.amount) : '—'}
              {projLast && (
                <span className={styles.personalLastMeta}>
                  {projLast.date} · {projLast.source === 'core' ? COLUMN_LABELS.core : COLUMN_LABELS.growth} ·{' '}
                  {projLast.fundName}
                  {projLastToday !== null ? ` · ${formatRupees(projLastToday)} in today's ₹` : ''}
                  {outcome?.exhaustedDate
                    ? ` · Depleted ${outcome.exhaustedDate}`
                    : projLast.source === 'core' && outcome?.firstCoreShortfallDate
                    ? ` · Shortfall from ${outcome.firstCoreShortfallDate}`
                    : projLast.source === 'growth' && outcome?.firstGrowthShortfallDate
                    ? ` · Shortfall from ${outcome.firstGrowthShortfallDate}`
                    : ''}
                </span>
              )}
              {!projLast && outcome?.exhaustedDate && (
                <span className={styles.personalLastMeta}>
                  Depleted on {outcome.exhaustedDate}
                </span>
              )}
            </dd>
          </>
        )}
      </dl>
    </div>
  );
};
