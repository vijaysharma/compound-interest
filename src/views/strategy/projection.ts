export {
  MIN_HORIZON_YEARS,
  MAX_HORIZON_YEARS,
  HORIZON_PRESETS,
  type ScenarioKey,
  SCENARIO_KEYS,
  type RiskProfileSpec,
  RISK_PROFILES,
  SCENARIO_LABELS,
  SCENARIO_BUTTON_LABELS,
  SCENARIO_BLURBS,
  type ProjectionSettings,
  type ScenarioOutcome,
  DEFAULT_INFLATION_PCT,
  DEFAULT_PROJECTION_SETTINGS,
} from './projectionProfiles';
export {
  type RateBand,
  deriveRateBand,
  strategySchemes,
  deriveRateBands,
} from './projectionRates';
export {
  deflateSnapshots,
  inTodaysRupees,
} from './projectionDeflate';
export {
  type ExtendNavOptions,
  historicalMaxDrawdown,
  calibrateForwardRate,
  extendNavHistory,
  projectedHorizonShortfall,
  scenarioRates,
  projectedNavBook,
} from './projectionNav';
export {
  isLiveWithdrawal,
  isLiveSwp,
  horizonDate,
  buildProjectedConfig,
  firstShortfall,
  firstCoreShortfall,
  firstGrowthShortfall,
  firstExhausted,
} from './projectionSchedule';
