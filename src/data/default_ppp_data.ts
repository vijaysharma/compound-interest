import { WorldBankPPPRecord } from './api_data';
/**
 * High-quality fallback PPP conversion factor records (PA.NUS.PPP - LCU per international $)
 * sourced from the World Bank International Comparison Program (ICP).
 * Used when the database has not been synced yet by an administrator.
 */
export const DEFAULT_PPP_RECORDS: WorldBankPPPRecord[] = [
  { indicator: { id: 'PA.NUS.PPP', value: 'PPP conversion factor, GDP (LCU per international $)' }, country: { id: 'IN', value: 'India' }, countryiso3code: 'IND', date: '2024', value: 23.85, unit: '', obs_status: '', decimal: 2 },
  { indicator: { id: 'PA.NUS.PPP', value: 'PPP conversion factor, GDP (LCU per international $)' }, country: { id: 'US', value: 'United States' }, countryiso3code: 'USA', date: '2024', value: 1.0, unit: '', obs_status: '', decimal: 2 },
  { indicator: { id: 'PA.NUS.PPP', value: 'PPP conversion factor, GDP (LCU per international $)' }, country: { id: 'GB', value: 'United Kingdom' }, countryiso3code: 'GBR', date: '2024', value: 0.72, unit: '', obs_status: '', decimal: 2 },
  { indicator: { id: 'PA.NUS.PPP', value: 'PPP conversion factor, GDP (LCU per international $)' }, country: { id: 'DE', value: 'Germany' }, countryiso3code: 'DEU', date: '2024', value: 0.76, unit: '', obs_status: '', decimal: 2 },
  { indicator: { id: 'PA.NUS.PPP', value: 'PPP conversion factor, GDP (LCU per international $)' }, country: { id: 'FR', value: 'France' }, countryiso3code: 'FRA', date: '2024', value: 0.74, unit: '', obs_status: '', decimal: 2 },
  { indicator: { id: 'PA.NUS.PPP', value: 'PPP conversion factor, GDP (LCU per international $)' }, country: { id: 'CA', value: 'Canada' }, countryiso3code: 'CAN', date: '2024', value: 1.25, unit: '', obs_status: '', decimal: 2 },
  { indicator: { id: 'PA.NUS.PPP', value: 'PPP conversion factor, GDP (LCU per international $)' }, country: { id: 'AU', value: 'Australia' }, countryiso3code: 'AUS', date: '2024', value: 1.44, unit: '', obs_status: '', decimal: 2 },
  { indicator: { id: 'PA.NUS.PPP', value: 'PPP conversion factor, GDP (LCU per international $)' }, country: { id: 'JP', value: 'Japan' }, countryiso3code: 'JPN', date: '2024', value: 104.5, unit: '', obs_status: '', decimal: 2 },
  { indicator: { id: 'PA.NUS.PPP', value: 'PPP conversion factor, GDP (LCU per international $)' }, country: { id: 'SG', value: 'Singapore' }, countryiso3code: 'SGP', date: '2024', value: 0.91, unit: '', obs_status: '', decimal: 2 },
  { indicator: { id: 'PA.NUS.PPP', value: 'PPP conversion factor, GDP (LCU per international $)' }, country: { id: 'AE', value: 'United Arab Emirates' }, countryiso3code: 'ARE', date: '2024', value: 2.15, unit: '', obs_status: '', decimal: 2 },
  { indicator: { id: 'PA.NUS.PPP', value: 'PPP conversion factor, GDP (LCU per international $)' }, country: { id: 'CN', value: 'China' }, countryiso3code: 'CHN', date: '2024', value: 3.99, unit: '', obs_status: '', decimal: 2 },
  { indicator: { id: 'PA.NUS.PPP', value: 'PPP conversion factor, GDP (LCU per international $)' }, country: { id: 'CH', value: 'Switzerland' }, countryiso3code: 'CHE', date: '2024', value: 1.12, unit: '', obs_status: '', decimal: 2 },
  { indicator: { id: 'PA.NUS.PPP', value: 'PPP conversion factor, GDP (LCU per international $)' }, country: { id: 'NL', value: 'Netherlands' }, countryiso3code: 'NLD', date: '2024', value: 0.77, unit: '', obs_status: '', decimal: 2 },
  { indicator: { id: 'PA.NUS.PPP', value: 'PPP conversion factor, GDP (LCU per international $)' }, country: { id: 'NZ', value: 'New Zealand' }, countryiso3code: 'NZL', date: '2024', value: 1.51, unit: '', obs_status: '', decimal: 2 },
  { indicator: { id: 'PA.NUS.PPP', value: 'PPP conversion factor, GDP (LCU per international $)' }, country: { id: 'IE', value: 'Ireland' }, countryiso3code: 'IRL', date: '2024', value: 0.81, unit: '', obs_status: '', decimal: 2 },
  { indicator: { id: 'PA.NUS.PPP', value: 'PPP conversion factor, GDP (LCU per international $)' }, country: { id: 'SE', value: 'Sweden' }, countryiso3code: 'SWE', date: '2024', value: 8.85, unit: '', obs_status: '', decimal: 2 },
  { indicator: { id: 'PA.NUS.PPP', value: 'PPP conversion factor, GDP (LCU per international $)' }, country: { id: 'NO', value: 'Norway' }, countryiso3code: 'NOR', date: '2024', value: 10.12, unit: '', obs_status: '', decimal: 2 },
  { indicator: { id: 'PA.NUS.PPP', value: 'PPP conversion factor, GDP (LCU per international $)' }, country: { id: 'DK', value: 'Denmark' }, countryiso3code: 'DNK', date: '2024', value: 7.21, unit: '', obs_status: '', decimal: 2 },
  { indicator: { id: 'PA.NUS.PPP', value: 'PPP conversion factor, GDP (LCU per international $)' }, country: { id: 'ES', value: 'Spain' }, countryiso3code: 'ESP', date: '2024', value: 0.63, unit: '', obs_status: '', decimal: 2 },
  { indicator: { id: 'PA.NUS.PPP', value: 'PPP conversion factor, GDP (LCU per international $)' }, country: { id: 'IT', value: 'Italy' }, countryiso3code: 'ITA', date: '2024', value: 0.68, unit: '', obs_status: '', decimal: 2 },
  { indicator: { id: 'PA.NUS.PPP', value: 'PPP conversion factor, GDP (LCU per international $)' }, country: { id: 'SA', value: 'Saudi Arabia' }, countryiso3code: 'SAU', date: '2024', value: 1.88, unit: '', obs_status: '', decimal: 2 },
  { indicator: { id: 'PA.NUS.PPP', value: 'PPP conversion factor, GDP (LCU per international $)' }, country: { id: 'BR', value: 'Brazil' }, countryiso3code: 'BRA', date: '2024', value: 2.72, unit: '', obs_status: '', decimal: 2 },
  { indicator: { id: 'PA.NUS.PPP', value: 'PPP conversion factor, GDP (LCU per international $)' }, country: { id: 'MX', value: 'Mexico' }, countryiso3code: 'MEX', date: '2024', value: 10.25, unit: '', obs_status: '', decimal: 2 },
  { indicator: { id: 'PA.NUS.PPP', value: 'PPP conversion factor, GDP (LCU per international $)' }, country: { id: 'ZA', value: 'South Africa' }, countryiso3code: 'ZAF', date: '2024', value: 7.45, unit: '', obs_status: '', decimal: 2 },
  { indicator: { id: 'PA.NUS.PPP', value: 'PPP conversion factor, GDP (LCU per international $)' }, country: { id: 'KR', value: 'Korea, Rep.' }, countryiso3code: 'KOR', date: '2024', value: 920.0, unit: '', obs_status: '', decimal: 2 },
  { indicator: { id: 'PA.NUS.PPP', value: 'PPP conversion factor, GDP (LCU per international $)' }, country: { id: 'MY', value: 'Malaysia' }, countryiso3code: 'MYS', date: '2024', value: 1.62, unit: '', obs_status: '', decimal: 2 },
  { indicator: { id: 'PA.NUS.PPP', value: 'PPP conversion factor, GDP (LCU per international $)' }, country: { id: 'TH', value: 'Thailand' }, countryiso3code: 'THA', date: '2024', value: 12.8, unit: '', obs_status: '', decimal: 2 },
  { indicator: { id: 'PA.NUS.PPP', value: 'PPP conversion factor, GDP (LCU per international $)' }, country: { id: 'ID', value: 'Indonesia' }, countryiso3code: 'IDN', date: '2024', value: 4850.0, unit: '', obs_status: '', decimal: 2 },
  { indicator: { id: 'PA.NUS.PPP', value: 'PPP conversion factor, GDP (LCU per international $)' }, country: { id: 'VN', value: 'Vietnam' }, countryiso3code: 'VNM', date: '2024', value: 7900.0, unit: '', obs_status: '', decimal: 2 },
  { indicator: { id: 'PA.NUS.PPP', value: 'PPP conversion factor, GDP (LCU per international $)' }, country: { id: 'PH', value: 'Philippines' }, countryiso3code: 'PHL', date: '2024', value: 19.5, unit: '', obs_status: '', decimal: 2 },
];
