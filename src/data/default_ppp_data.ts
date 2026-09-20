import type { WorldBankPPPRecord } from './api_data';
const makePpp = (id: string, name: string, iso3: string, value: number): WorldBankPPPRecord => ({
  indicator: { id: 'PA.NUS.PPP', value: 'PPP conversion factor, GDP (LCU per international $)' },
  country: { id, value: name },
  countryiso3code: iso3,
  date: '2024',
  value,
  unit: '',
  obs_status: '',
  decimal: 2,
});
/**
 * High-quality fallback PPP conversion factor records (PA.NUS.PPP - LCU per international $)
 * sourced from the World Bank International Comparison Program (ICP).
 * Used when the database has not been synced yet by an administrator.
 */
export const DEFAULT_PPP_RECORDS: WorldBankPPPRecord[] = [
  makePpp('IN', 'India', 'IND', 23.85),
  makePpp('US', 'United States', 'USA', 1.0),
  makePpp('GB', 'United Kingdom', 'GBR', 0.72),
  makePpp('DE', 'Germany', 'DEU', 0.76),
  makePpp('FR', 'France', 'FRA', 0.74),
  makePpp('CA', 'Canada', 'CAN', 1.25),
  makePpp('AU', 'Australia', 'AUS', 1.44),
  makePpp('JP', 'Japan', 'JPN', 104.5),
  makePpp('SG', 'Singapore', 'SGP', 0.91),
  makePpp('AE', 'United Arab Emirates', 'ARE', 2.15),
  makePpp('CN', 'China', 'CHN', 3.99),
  makePpp('CH', 'Switzerland', 'CHE', 1.12),
  makePpp('NL', 'Netherlands', 'NLD', 0.77),
  makePpp('NZ', 'New Zealand', 'NZL', 1.51),
  makePpp('IE', 'Ireland', 'IRL', 0.81),
  makePpp('SE', 'Sweden', 'SWE', 8.85),
  makePpp('NO', 'Norway', 'NOR', 10.12),
  makePpp('DK', 'Denmark', 'DNK', 7.21),
  makePpp('ES', 'Spain', 'ESP', 0.63),
  makePpp('IT', 'Italy', 'ITA', 0.68),
  makePpp('SA', 'Saudi Arabia', 'SAU', 1.88),
  makePpp('BR', 'Brazil', 'BRA', 2.72),
  makePpp('MX', 'Mexico', 'MEX', 10.25),
  makePpp('ZA', 'South Africa', 'ZAF', 7.45),
  makePpp('KR', 'Korea, Rep.', 'KOR', 920.0),
  makePpp('MY', 'Malaysia', 'MYS', 1.62),
  makePpp('TH', 'Thailand', 'THA', 12.8),
  makePpp('ID', 'Indonesia', 'IDN', 4850.0),
  makePpp('VN', 'Vietnam', 'VNM', 7900.0),
  makePpp('PH', 'Philippines', 'PHL', 19.5),
];
