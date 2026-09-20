import { createPageMetadata } from './seoConfig';
export const SEO_MUTUAL_FUNDS = {
  mfLumpsum: createPageMetadata({
    title: 'Mutual Fund Calculator — Lumpsum Return & CAGR Calculator India 2026',
    description:
      'Analyze historical mutual fund lumpsum returns, CAGR growth, and rolling NAV trajectories with live AMFI data. Compare up to 8 funds simultaneously.',
    keywords: [
      'mutual fund return calculator',
      'lumpsum mutual fund calculator',
      'mutual fund CAGR calculator',
      'AMFI NAV history',
      'Indian mutual funds backtesting',
      'ROI calculator',
      'CAGR calculator',
      'NAV calculator',
      'investment calculator',
    ],
    canonicalPath: '/mutual-funds/lumpsum',
  }),
  mfSip: createPageMetadata({
    title: 'Mutual Fund SIP Backtest — XIRR & Historical NAV Calculator India 2026',
    description:
      'Backtest historical mutual fund SIP performance, XIRR returns, units accumulation, and rupee cost averaging on live AMFI data.',
    keywords: [
      'mutual fund SIP calculator',
      'mutual fund return calculator',
      'SIP XIRR calculator',
      'AMFI NAV history',
      'step up SIP backtest',
      'XIRR calculator',
      'SIP backtest calculator',
    ],
    canonicalPath: '/mutual-funds/sip',
  }),
  mfSwp: createPageMetadata({
    title: 'Mutual Fund SWP Backtest — Retirement Withdrawal Calculator India 2026',
    description:
      'Backtest historical mutual fund SWP cashflows, capital longevity, monthly retirement pension drawdowns, and portfolio yields with verified AMFI daily NAVs.',
    keywords: [
      'mutual fund SWP calculator',
      'SWP backtest calculator',
      'retirement SWP planner',
      'AMFI NAV history',
      'systematic withdrawal plan India',
      'retirement pension calculator',
      'mutual fund withdrawal planner',
    ],
    canonicalPath: '/mutual-funds/swp',
  }),
};
