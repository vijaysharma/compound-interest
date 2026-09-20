/**
 * Official Cost Inflation Index (CII) Table notified by CBDT (Central Board of Direct Taxes, India).
 * Base Year: 2001-02 = 100
 */
export const COST_INFLATION_INDEX: Record<string, number> = {
  '2001-02': 100,
  '2002-03': 105,
  '2003-04': 109,
  '2004-05': 113,
  '2005-06': 117,
  '2006-07': 122,
  '2007-08': 129,
  '2008-09': 137,
  '2009-10': 148,
  '2010-11': 167,
  '2011-12': 184,
  '2012-13': 200,
  '2013-14': 220,
  '2014-15': 240,
  '2015-16': 254,
  '2016-17': 264,
  '2017-18': 272,
  '2018-19': 280,
  '2019-20': 289,
  '2020-21': 301,
  '2021-22': 317,
  '2022-23': 331,
  '2023-24': 348,
  '2024-25': 363,
  '2025-26': 377,
};
export const CII_YEARS = Object.keys(COST_INFLATION_INDEX);
/**
 * Determine Indian Financial Year (1 April - 31 March) from an ISO Date string (YYYY-MM-DD).
 */
export function getFinancialYear(dateStr: string): string {
  if (!dateStr) return '2024-25';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '2024-25';
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-indexed (Jan=1, Dec=12)
  let startYear = year;
  if (month < 4) {
    startYear = year - 1;
  }
  const endYearShort = String((startYear + 1) % 100).padStart(2, '0');
  const fy = `${startYear}-${endYearShort}`;
  if (COST_INFLATION_INDEX[fy]) {
    return fy;
  }
  if (startYear < 2001) {
    return '2001-02';
  }
  return '2025-26';
}
