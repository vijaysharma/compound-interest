import React from 'react';
import { RISK_PROFILES, type ProjectionSettings } from './projectionProfiles';
import type { StrategyProjection } from './useStrategyProjection';
import type { StrategyTotals } from './types';
import { PersonalUseCard } from './PersonalUseCard';
import { buildGroups } from './finalStatsGroups';
import styles from './StrategyCalculator.module.scss';
export interface FinalStatsCardProps {
  totals: StrategyTotals;
  projection?: StrategyProjection;
  settings?: ProjectionSettings;
}
const BaseFinalStatsCard = ({ totals, projection, settings }: FinalStatsCardProps) => {
  const isProjecting = Boolean(settings?.enabled && projection?.isAvailable && projection?.selected);
  const outcome = isProjecting ? projection!.selected : null;
  const projTotals = outcome?.result.totals ?? null;
  const profileLabel = settings ? RISK_PROFILES[settings.scenarioKey]?.label ?? 'Moderate' : '';
  return (
    <section className={styles.card} aria-labelledby="strategy-stats-title">
      <h2 className={styles.cardTitle} id="strategy-stats-title">
        Final position
      </h2>
      <PersonalUseCard
        totals={totals}
        projTotals={projTotals}
        settings={settings}
        outcome={outcome}
      />
      <p className={styles.cardSubtitle}>
        {totals.asOfNavDate
          ? `Valued at NAV published ${totals.asOfNavDate} (as of ${totals.asOfDate})${
              isProjecting && projection?.horizonIso
                ? ` · Projected to ${projection.horizonIso} (${settings?.horizonYears}y · ${profileLabel}${
                    settings?.valueMode === 'today' ? " · Today's ₹" : ' · Nominal'
                  })`
                : '.'
            }${
              isProjecting && outcome?.exhaustedDate
                ? ` · Depleted on ${outcome.exhaustedDate}`
                : isProjecting && outcome?.firstCoreShortfallDate
                ? ` · Core shortfall from ${outcome.firstCoreShortfallDate}`
                : isProjecting && outcome?.firstGrowthShortfallDate
                ? ` · Growth SWP shortfall from ${outcome.firstGrowthShortfallDate}`
                : ''
            }`
          : 'Select a fund to value the portfolio.'}
      </p>
      {buildGroups(totals, projTotals, settings, outcome).map((group) => (
        <div key={group.title} className={styles.statGroup}>
          <div className={styles.statGroupHeader}>
            <h3 className={styles.statGroupTitle}>{group.title}</h3>
            {isProjecting && (
              <div className={styles.statHeaderValues}>
                <span className={styles.statHeaderCurrent}>Current</span>
                <span className={styles.statHeaderProjected}>
                  {settings?.horizonYears}y Proj
                </span>
              </div>
            )}
          </div>
          {group.rows.map((row) => (
            <div key={row.label} className={styles.statRow}>
              <span className={styles.statLabel}>{row.label}</span>
              {isProjecting && row.projectedValue !== undefined ? (
                <div className={styles.statValues}>
                  <span
                    className={`${styles.statCurrent} ${row.strong ? styles.statStrong : ''}`.trim()}
                  >
                    {row.value}
                  </span>
                  <span
                    className={`${styles.statProjected} ${row.strong ? styles.statStrongProjected : ''}`.trim()}
                  >
                    {row.projectedValue}
                    {row.shortfallBadge && (
                      <span className={styles.statShortfallBadge}>{row.shortfallBadge}</span>
                    )}
                  </span>
                </div>
              ) : (
                <span
                  className={`${styles.statValue} ${row.strong ? styles.statStrong : ''}`.trim()}
                >
                  {row.value}
                </span>
              )}
            </div>
          ))}
        </div>
      ))}
    </section>
  );
};
export const FinalStatsCard = React.memo(BaseFinalStatsCard);
