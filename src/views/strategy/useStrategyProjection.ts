'use client';
import { useMemo } from 'react';
import { runStrategy } from './engine';
import {
  SCENARIO_KEYS,
  buildProjectedConfig,
  deriveRateBands,
  firstExhausted,
  firstShortfall,
  horizonDate,
  projectedHorizonShortfall,
  inTodaysRupees,
  projectedNavBook,
  scenarioRates,
  strategySchemes,
  type ProjectionSettings,
  type RateBand,
  type ScenarioOutcome,
} from './projection';
import { roundMoney } from './money';
import type { NavBook, StrategyConfig, StrategyResult } from './types';
export interface StrategyProjection {
  /** False when there is nothing to project from, e.g. no fund or no NAVs yet. */
  isAvailable: boolean;
  bands: Record<string, RateBand>;
  /**
   * Computed scenarios. Holds only the selected one unless `allScenarios` was
   * requested, because each entry is a full engine run.
   */
  scenarios: ScenarioOutcome[];
  /** The scenario the chart plots, or null when nothing could be projected. */
  selected: ScenarioOutcome | null;
  horizonIso: string;
  /** Caveats worth reading before the numbers are believed. */
  notes: string[];
}
const EMPTY: StrategyProjection = {
  isAvailable: false,
  bands: {},
  scenarios: [],
  selected: null,
  horizonIso: '',
  notes: [],
};
import { buildNotes } from './projectionNotes';
/**
 * Runs the strategy forward past its last published NAV.
 *
 * Each scenario is a full engine run against the same transaction planner and
 * executor as the historical result — only the NAV series differs, extended
 * past today at one of the fund's own rolling-window percentiles. Nothing dated
 * on or before the as-of date changes, so the overlap with the real timeline
 * reproduces the historical run exactly.
 *
 * Only the selected scenario is run by default. The chart now draws the
 * projection inline rather than behind a disclosure, so this runs on every
 * config change — and running all three there would triple the cost of every
 * keystroke for two lines nobody is looking at. `allScenarios` opts in to the
 * full set for the side-by-side comparison table.
 */
export function useStrategyProjection(
  config: StrategyConfig,
  navBook: NavBook,
  actual: StrategyResult,
  settings: ProjectionSettings,
  enabled: boolean,
  allScenarios = false
): StrategyProjection {
  return useMemo<StrategyProjection>(() => {
    if (!enabled || !config.column1.fund) return EMPTY;
    const bands = deriveRateBands(config, navBook);
    if (!bands[config.column1.fund.schemeCode]) return EMPTY;
    const horizonIso = horizonDate(config.asOfDate, settings.horizonYears);
    const projectedConfig = buildProjectedConfig(config, settings);
    const drawnSoFar = actual.totals.totalPersonalWithdrawals;
    const keys = allScenarios ? SCENARIO_KEYS : [settings.scenarioKey];
    const truncated = new Set<string>();
    const scenarios: ScenarioOutcome[] = keys.map((key) => {
      const rates = scenarioRates(bands, key);
      const projectedBook = projectedNavBook(config, navBook, rates, horizonIso, key);
      for (const scheme of strategySchemes(config)) {
        const reached = projectedHorizonShortfall(projectedBook, scheme.schemeCode, horizonIso);
        if (reached) truncated.add(`${scheme.schemeName}|${reached}`);
      }
      const result = runStrategy(projectedConfig, projectedBook);
      const terminalValue = result.totals.totalValue;
      return {
        key,
        rates,
        result,
        futurePersonal: roundMoney(result.totals.totalPersonalWithdrawals - drawnSoFar),
        terminalValue,
        terminalValueToday: inTodaysRupees(
          terminalValue,
          settings.inflationPct,
          settings.horizonYears
        ),
        firstShortfallDate: firstShortfall(result, config.asOfDate),
        exhaustedDate: firstExhausted(result, config.asOfDate),
      };
    });
    return {
      isAvailable: true,
      bands,
      scenarios,
      selected: scenarios.find((s) => s.key === settings.scenarioKey) ?? scenarios[0] ?? null,
      horizonIso,
      notes: [
        ...buildNotes(config, bands, settings),
        ...[...truncated].map((entry) => {
          const [name, reached] = entry.split('|');
          return (
            `${name} could not be compounded all the way to ${horizonIso} — the projected NAV ` +
            `overflowed at ${reached}, so the line stops there rather than continuing. Shorten ` +
            'the horizon or pick a lower scenario.'
          );
        }),
      ],
    };
  }, [enabled, allScenarios, config, navBook, actual.totals.totalPersonalWithdrawals, settings]);
}
