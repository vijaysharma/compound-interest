/**
 * User-facing names for the three stages of the strategy.
 *
 * The data model still calls them column1/column2/column3 — that shape is what
 * saved strategies are serialised as, so renaming the keys would invalidate
 * every stored config. These labels are the only place the names the user reads
 * are defined, so the wording stays consistent across the panels, the chart,
 * the statistics card and the validation messages.
 */
export const COLUMN_LABELS = {
  core: 'Core corpus',
  growth: 'Growth funds',
  reinvest: 'Reinvestment loop',
} as const;
/** Lower-case forms, for the middle of a sentence. */
export const COLUMN_WORDS = {
  core: 'core corpus',
  growth: 'growth funds',
  reinvest: 'reinvestment loop',
} as const;
/** One-line explanation of each stage, shown under its card title. */
export const COLUMN_BLURBS = {
  core: 'The lumpsum you invested and draw from. Each withdrawal splits between your personal use and the growth funds.',
  growth: `Funded by ${COLUMN_WORDS.core} withdrawals. Each fund buys units at the NAV applicable to its instalment date, and can pay out again through an SWP.`,
  reinvest: `Returns the ${COLUMN_WORDS.growth} SWP share to the ${COLUMN_WORDS.core} fund, buying units at the NAV applicable to each reinvestment date.`,
} as const;
