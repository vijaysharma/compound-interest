'use client';
import React from 'react';
import { StepUpSelect } from './StrategyFields';
import { formatRupees } from './money';
import {
  SCENARIO_BLURBS,
  SCENARIO_LABELS,
  strategySchemes,
  type ProjectionSettings,
} from './projection';
import type { StrategyProjection } from './useStrategyProjection';
import type { StrategyConfig } from './types';
import styles from './StrategyCalculator.module.scss';
interface ProjectionCardProps {
  config: StrategyConfig;
  projection: StrategyProjection;
  settings: ProjectionSettings;
  onSettingsChange: (patch: Partial<ProjectionSettings>) => void;
  shown: boolean;
  onToggle: () => void;
  /** Why the projection cannot run, when it cannot. */
  unavailableMessage: string | null;
}
const percent = (rate: number): string => `${(rate * 100).toFixed(1)}%`;
export const ProjectionCard = ({
  config,
  projection,
  settings,
  onSettingsChange,
  shown,
  onToggle,
  unavailableMessage,
}: ProjectionCardProps) => {
  const schemes = strategySchemes(config);
  return (
    <section className={styles.card} aria-labelledby="strategy-projection-title">
      <h2 className={styles.cardTitle} id="strategy-projection-title">
        Projection
        <button
          type="button"
          className={styles.libraryButton}
          onClick={onToggle}
          aria-expanded={shown}
          aria-controls="strategy-projection-body"
        >
          {shown ? 'Hide' : 'Show'}
        </button>
      </h2>
      <p className={styles.cardSubtitle}>
        The workings behind the projected line on the chart above. Every fund is compounded forward
        at one of its own rolling-window returns — Low, Moderate and High are the 10th, 50th and
        90th percentiles of what it has actually delivered — and the same planner and executor then
        run the schedule against those NAVs. Nothing before the as-of date changes.
      </p>
      <p className={styles.cardSubtitle}>
        Whatever is running today carries on: the withdrawal continues at the amount it has already
        escalated to, rising by the yearly increase set below from that point, and any SWP still
        switched on runs to the horizon. An instruction that has already finished is not restarted.
      </p>
      <div id="strategy-projection-body" hidden={!shown}>
        {!shown ? null : unavailableMessage ? (
          <p className={styles.emptyHint}>{unavailableMessage}</p>
        ) : !projection.isAvailable ? (
          <p className={styles.emptyHint}>
            Not enough published NAV history to derive a forward return for this strategy.
          </p>
        ) : (
          <>
            <StepUpSelect
              id="projection-increase"
              label="Yearly increase in the withdrawal"
              value={settings.annualIncreasePct}
              onChange={(annualIncreasePct) => onSettingsChange({ annualIncreasePct })}
            />
            <p className={styles.projectionHorizon}>
              Valued to {projection.horizonIso}, from {config.asOfDate}.
            </p>
            <h3 className={styles.statGroupTitle}>Returns each fund has actually delivered</h3>
            <div className={styles.tableScroll}>
              <table className={styles.dataTable}>
                <caption className={styles.srOnly}>
                  Rolling-window annualised returns per fund, derived from published NAV history.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Fund</th>
                    <th scope="col">History</th>
                    <th scope="col">Window</th>
                    <th scope="col">Samples</th>
                    <th scope="col">{SCENARIO_LABELS.weak}</th>
                    <th scope="col">{SCENARIO_LABELS.median}</th>
                    <th scope="col">{SCENARIO_LABELS.strong}</th>
                  </tr>
                </thead>
                <tbody>
                  {schemes.map((scheme) => {
                    const band = projection.bands[scheme.schemeCode];
                    if (!band) return null;
                    return (
                      <tr key={scheme.schemeCode}>
                        <th scope="row">{scheme.schemeName}</th>
                        <td>{band.historyYears.toFixed(1)}y</td>
                        <td>{band.windowYears}y</td>
                        <td>{band.samples}</td>
                        <td>{percent(band.weak)}</td>
                        <td>{percent(band.median)}</td>
                        <td>{percent(band.strong)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <h3 className={styles.statGroupTitle}>Where each scenario ends up</h3>
            <div className={styles.tableScroll}>
              <table className={styles.dataTable}>
                <caption className={styles.srOnly}>
                  Outcome of the strategy at the horizon under each scenario.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Scenario</th>
                    <th scope="col">Drawn from now on</th>
                    <th scope="col">First shortfall</th>
                    <th scope="col">Value at horizon</th>
                    <th scope="col">In today&apos;s ₹</th>
                  </tr>
                </thead>
                <tbody>
                  {projection.scenarios.map((scenario) => (
                    <tr key={scenario.key}>
                      <th scope="row" title={SCENARIO_BLURBS[scenario.key]}>
                        {SCENARIO_LABELS[scenario.key]}
                      </th>
                      <td>{formatRupees(scenario.futurePersonal)}</td>
                      <td
                        className={scenario.firstShortfallDate ? styles.projectionWarn : undefined}
                      >
                        {scenario.firstShortfallDate ?? 'none'}
                      </td>
                      <td>{formatRupees(scenario.terminalValue)}</td>
                      <td>{formatRupees(scenario.terminalValueToday)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={styles.cardSubtitle}>
              &ldquo;First shortfall&rdquo; is the first instalment the portfolio could not pay in
              full — the point the plan stops delivering the income asked of it.
              {settings.annualIncreasePct > 0
                ? ` Today's rupees deflate the horizon value at the ${settings.annualIncreasePct}% yearly increase set above.`
                : ' Set a yearly increase to see the horizon value in today’s rupees.'}
            </p>
            {projection.notes.length > 0 && (
              <ul className={styles.projectionNotes}>
                {projection.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  );
};
