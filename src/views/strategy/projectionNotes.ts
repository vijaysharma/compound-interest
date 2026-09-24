import {
  RISK_PROFILES,
  buildProjectedConfig,
  strategySchemes,
  type ProjectionSettings,
  type RateBand,
} from './projection';
import type { StrategyConfig } from './types';
export const buildNotes = (
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
  const hasStepUp = config.column1.withdrawals.some((period) => period.annualStepUpPct > 0);
  if (!hasStepUp) {
    notes.push(
      'The withdrawal is held flat in rupee terms for the whole horizon. Over decades that is a ' +
        'large real-terms cut; set a yearly increase on the withdrawal period to hold spending power instead.'
    );
  }
  const profile = RISK_PROFILES[settings.scenarioKey];
  if (profile) {
    notes.push(
      `Projection uses the ${profile.label} profile (${(profile.benchmarkCagr * 100).toFixed(1)}% nominal CAGR with ~${Math.round(profile.drawdownMax * 100)}% cyclical corrections) to reflect realistic market conditions.`
    );
  }
  return notes;
};
