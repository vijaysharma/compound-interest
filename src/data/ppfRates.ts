/**
 * Public Provident Fund (PPF) Official Historical Rates (Government of India / RBI)
 * Ministry of Finance notifies PPF interest rates periodically.
 * Prior to FY 2016-17, rates were announced annually. Since April 2016, rates are notified quarterly.
 */
export interface PPFRateRecord {
  startYear: number; // e.g. 2024 for FY 2024-25
  fyLabel: string;   // e.g. "2024-25"
  rate: number;      // Annual interest rate percentage (e.g. 7.1)
  notes?: string;
}
export const HISTORICAL_PPF_RATES: PPFRateRecord[] = [
  { startYear: 1999, fyLabel: '1999-00', rate: 12.0, notes: 'Historical fixed rate' },
  { startYear: 2000, fyLabel: '2000-01', rate: 11.0 },
  { startYear: 2001, fyLabel: '2001-02', rate: 9.5 },
  { startYear: 2002, fyLabel: '2002-03', rate: 9.0 },
  { startYear: 2003, fyLabel: '2003-04', rate: 8.0 },
  { startYear: 2004, fyLabel: '2004-05', rate: 8.0 },
  { startYear: 2005, fyLabel: '2005-06', rate: 8.0 },
  { startYear: 2006, fyLabel: '2006-07', rate: 8.0 },
  { startYear: 2007, fyLabel: '2007-08', rate: 8.0 },
  { startYear: 2008, fyLabel: '2008-09', rate: 8.0 },
  { startYear: 2009, fyLabel: '2009-10', rate: 8.0 },
  { startYear: 2010, fyLabel: '2010-11', rate: 8.0 },
  { startYear: 2011, fyLabel: '2011-12', rate: 8.0, notes: 'Increased to 8.6% from Dec 1, 2011' },
  { startYear: 2012, fyLabel: '2012-13', rate: 8.8 },
  { startYear: 2013, fyLabel: '2013-14', rate: 8.7 },
  { startYear: 2014, fyLabel: '2014-15', rate: 8.7, notes: 'Annual deposit cap raised to ₹1.5 Lakh' },
  { startYear: 2015, fyLabel: '2015-16', rate: 8.7 },
  { startYear: 2016, fyLabel: '2016-17', rate: 8.1, notes: 'Quarterly from here: 8.1 / 8.1 / 8.0 / 8.0' },
  { startYear: 2017, fyLabel: '2017-18', rate: 7.9, notes: 'Quarterly: 7.9 / 7.8 / 7.8 / 7.6' },
  { startYear: 2018, fyLabel: '2018-19', rate: 7.6, notes: 'Quarterly: 7.6 / 7.6 / 8.0 / 8.0' },
  { startYear: 2019, fyLabel: '2019-20', rate: 8.0, notes: 'Quarterly: 8.0 / 7.9 / 7.9 / 7.9' },
  { startYear: 2020, fyLabel: '2020-21', rate: 7.1 },
  { startYear: 2021, fyLabel: '2021-22', rate: 7.1 },
  { startYear: 2022, fyLabel: '2022-23', rate: 7.1 },
  { startYear: 2023, fyLabel: '2023-24', rate: 7.1 },
  { startYear: 2024, fyLabel: '2024-25', rate: 7.1 },
  { startYear: 2025, fyLabel: '2025-26', rate: 7.1 },
];
export const CURRENT_PPF_RATE = 7.1;
export const DEFAULT_PROJECTED_PPF_RATE = 7.1;
export const MIN_PPF_ANNUAL_DEPOSIT = 500;
export const MAX_PPF_ANNUAL_DEPOSIT = 150000;
/**
 * Complete financial years an account runs AFTER its opening FY (the opening FY is not counted).
 * An account opened in FY N therefore matures on 31 March at the end of FY N+15, and accepts
 * deposits in 16 FYs: N, N+1, ... N+15.
 */
export const DEFAULT_PPF_TENURE_YEARS = 15;
/** FYs in which deposits are allowed before maturity: the opening FY plus the 15 counted FYs. */
export const PPF_DEPOSIT_FY_COUNT = DEFAULT_PPF_TENURE_YEARS + 1;
export const PPF_EXTENSION_BLOCK_YEARS = 5;
/**
 * Returns the declared rate for a given financial year, or the projected rate if beyond known records.
 */
export function getPPFRateForYear(startYear: number, projectedRate: number = DEFAULT_PROJECTED_PPF_RATE): {
  rate: number;
  isHistorical: boolean;
  fyLabel: string;
} {
  const nextYearShort = String((startYear + 1) % 100).padStart(2, '0');
  const fyLabel = `${startYear}-${nextYearShort}`;
  const record = HISTORICAL_PPF_RATES.find((r) => r.startYear === startYear);
  if (record) {
    return {
      rate: record.rate,
      isHistorical: true,
      fyLabel,
    };
  }
  return {
    rate: projectedRate,
    isHistorical: false,
    fyLabel,
  };
}
/**
 * Rates that changed part-way through a financial year, month by month (index 0 = April ... 11 = March).
 * Since April 2016 the rate is notified every quarter; earlier mid-year revisions are listed too.
 * Each FY's annual entry above remains the headline figure for that year.
 */
const q = (q1: number, q2: number, q3: number, q4: number): number[] => [
  q1, q1, q1, q2, q2, q2, q3, q3, q3, q4, q4, q4,
];
export const PPF_MONTHLY_RATE_OVERRIDES: Record<number, number[]> = {
  // 11% until 28 Feb 2001, 9.5% from 1 Mar 2001
  2000: [11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 9.5],
  // 9.5% until 28 Feb 2002, 9% from 1 Mar 2002
  2001: [9.5, 9.5, 9.5, 9.5, 9.5, 9.5, 9.5, 9.5, 9.5, 9.5, 9.5, 9],
  // 9% until 28 Feb 2003, 8% from 1 Mar 2003
  2002: [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 8],
  // 8% until 30 Nov 2011, 8.6% from 1 Dec 2011
  2011: [8, 8, 8, 8, 8, 8, 8, 8, 8.6, 8.6, 8.6, 8.6],
  2016: q(8.1, 8.1, 8.0, 8.0),
  2017: q(7.9, 7.8, 7.8, 7.6),
  2018: q(7.6, 7.6, 8.0, 8.0),
  2019: q(8.0, 7.9, 7.9, 7.9),
};
/** Rate in force for a given FY month (0 = April). Falls back to the FY's annual rate / projection. */
export function getPPFRateForMonth(
  startYear: number,
  monthIndex: number,
  projectedRate: number = DEFAULT_PROJECTED_PPF_RATE
): number {
  const override = PPF_MONTHLY_RATE_OVERRIDES[startYear];
  if (override && override[monthIndex] !== undefined) return override[monthIndex];
  return getPPFRateForYear(startYear, projectedRate).rate;
}
