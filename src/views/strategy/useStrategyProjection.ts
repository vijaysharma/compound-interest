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
  scenarios: ScenarioOutcome[];
  horizonIso: string;
  /** Caveats worth reading before the numbers are believed. */
  notes: string[];
}
const EMPTY: StrategyProjection = {
  isAvailable: false,
  bands: {},
  scenarios: [],
  horizonIso: '',
  notes: [],
};
const buildNotes = (
  config: StrategyConfig,
  bands: Record<string, RateBand>,
  settings: ProjectionSettings
): string[] => {
  const notes: string[] = [];
  const projected = buildProjectedConfig(config, settings);
  if (projected.column1.withdrawals.length === config.column1.withdrawals.length) {
    notes.push(
      `No withdrawal period is running on ${config.asOfDate}, so the projection only compounds ` +
        'the holdings forward and draws nothing. Extend a withdrawal period to project an income.'
    );
  }
  for (const scheme of strategySchemes(config)) {
    const band = bands[scheme.schemeCode];
    if (!band) {
      notes.push(
        `${scheme.schemeName} has too little published history to derive any forward return, so ` +
          'its NAV is held flat for the whole horizon and it contributes no growth.'
      );
      continue;
    }
    if (band.degraded) {
      notes.push(
        `${scheme.schemeName} has only ${band.historyYears.toFixed(1)} years of published NAVs — ` +
          'too short to sample rolling windows, so all three scenarios use its full-period CAGR ' +
          'and the band is a single line rather than a range.'
      );
    }
    if (settings.horizonYears > band.historyYears) {
      notes.push(
        `${scheme.schemeName} is being projected ${settings.horizonYears} years from ` +
          `${band.historyYears.toFixed(1)} years of history. The further out the horizon runs, ` +
          'the less the past constrains it.'
      );
    }
  }
  if (settings.annualIncreasePct <= 0) {
    notes.push(
      'The withdrawal is held flat in rupee terms for the whole horizon. Over decades that is a ' +
        'large real-terms cut; set a yearly increase to hold spending power instead.'
    );
  }
  return notes;
};
/**
 * Runs the strategy forward past its last published NAV.
 *
 * Each scenario is a full engine run against the same transaction planner and
 * executor as the historical result — only the NAV series differs, extended
 * past today at one of the fund's own rolling-window percentiles. Nothing dated
 * on or before the as-of date changes, so the overlap with the real timeline
 * reproduces the historical run exactly.
 *
 * `enabled` keeps three engine runs out of the render path until the user opens
 * the section that shows them.
 */
export function useStrategyProjection(
  config: StrategyConfig,
  navBook: NavBook,
  actual: StrategyResult,
  settings: ProjectionSettings,
  enabled: boolean
): StrategyProjection {
  return useMemo<StrategyProjection>(() => {
    if (!enabled || !config.column1.fund) return EMPTY;
    const bands = deriveRateBands(config, navBook);
    if (!bands[config.column1.fund.schemeCode]) return EMPTY;
    const horizonIso = horizonDate(config.asOfDate, settings.horizonYears);
    const projectedConfig = buildProjectedConfig(config, settings);
    const drawnSoFar = actual.totals.totalPersonalWithdrawals;
    const scenarios: ScenarioOutcome[] = SCENARIO_KEYS.map((key) => {
      const rates = scenarioRates(bands, key);
      const result = runStrategy(projectedConfig, projectedNavBook(config, navBook, rates, horizonIso));
      const terminalValue = result.totals.totalValue;
      return {
        key,
        rates,
        result,
        futurePersonal: roundMoney(result.totals.totalPersonalWithdrawals - drawnSoFar),
        terminalValue,
        terminalValueToday: inTodaysRupees(
          terminalValue,
          settings.annualIncreasePct,
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
      horizonIso,
      notes: buildNotes(config, bands, settings),
    };
  }, [enabled, config, navBook, actual.totals.totalPersonalWithdrawals, settings]);
}
