export const MIN_HORIZON_YEARS = 10;
export const MAX_HORIZON_YEARS = 100;
export const HORIZON_PRESETS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const;
export type ScenarioKey = 'weak' | 'median' | 'strong';
export const SCENARIO_KEYS: ScenarioKey[] = ['weak', 'median', 'strong'];
export interface RiskProfileSpec {
  key: ScenarioKey;
  label: string;
  shortLabel: string;
  benchmarkCagr: number;
  volatility: number;
  drawdownMax: number;
  cycleYears: number;
  description: string;
}
export const RISK_PROFILES: Record<ScenarioKey, RiskProfileSpec> = {
  weak: {
    key: 'weak',
    label: 'Conservative',
    shortLabel: 'Conservative',
    benchmarkCagr: 0.085,
    volatility: 0.075,
    drawdownMax: 0.10,
    cycleYears: 4.5,
    description:
      'Conservative profile (8.5% nominal CAGR, ~2.4% real return). Lower volatility and mild ~10% drawdowns for capital preservation.',
  },
  median: {
    key: 'median',
    label: 'Moderate',
    shortLabel: 'Moderate',
    benchmarkCagr: 0.120,
    volatility: 0.140,
    drawdownMax: 0.20,
    cycleYears: 5.0,
    description:
      'Moderate profile (12.0% nominal CAGR, ~5.7% real return). Based on 25-year Nifty 50 TRI benchmark average with periodic ~20% market cycles.',
  },
  strong: {
    key: 'strong',
    label: 'Risky',
    shortLabel: 'Risky',
    benchmarkCagr: 0.145,
    volatility: 0.200,
    drawdownMax: 0.32,
    cycleYears: 5.5,
    description:
      'Risky profile (14.5% nominal CAGR, ~8.0% real return). Aggressive equity growth potential with high volatility and severe ~32% drawdowns.',
  },
};
export const SCENARIO_LABELS: Record<ScenarioKey, string> = {
  weak: 'Conservative',
  median: 'Moderate',
  strong: 'Risky',
};
export const SCENARIO_BUTTON_LABELS: Record<ScenarioKey, string> = {
  weak: 'Cons',
  median: 'Mod',
  strong: 'Risk',
};
export const SCENARIO_BLURBS: Record<ScenarioKey, string> = {
  weak: 'Conservative: ~8.5% nominal return, lower volatility, ~10% pullbacks for capital preservation',
  median: 'Moderate: ~12.0% nominal return, balanced 25-yr equity benchmark average, ~20% periodic market cycles',
  strong: 'Risky: ~14.5% nominal return, aggressive equity potential, ~32% severe drawdowns',
};
export interface ProjectionSettings {
  enabled: boolean;
  horizonYears: number;
  scenarioKey: ScenarioKey;
  valueMode: 'nominal' | 'today';
  inflationPct: number;
}
export interface ScenarioOutcome {
  key: ScenarioKey;
  rates: Record<string, number>;
  result: import('./types').StrategyResult;
  futurePersonal: number;
  terminalValue: number;
  terminalValueToday: number;
  firstShortfallDate: string | null;
  firstCoreShortfallDate?: string | null;
  firstGrowthShortfallDate?: string | null;
  exhaustedDate: string | null;
}
export const DEFAULT_INFLATION_PCT = 6;
export const DEFAULT_PROJECTION_SETTINGS: ProjectionSettings = {
  enabled: false,
  horizonYears: 30,
  scenarioKey: 'median',
  valueMode: 'today',
  inflationPct: DEFAULT_INFLATION_PCT,
};
