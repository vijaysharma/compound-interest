import CURRENCY_CODES, { IndianFormat } from '../../data/currencyCodes';
import { getCurrencySymbol } from '../../utilities/currency';
export interface CountryCurrencyInfo {
  country: string;
  code: string;
  name: string;
  symbol: string;
  locale: string;
}
export const CURRENCY_NAME_MAP: Record<string, string> = {
  USD: 'US Dollar',
  INR: 'Indian Rupee',
  EUR: 'Euro',
  GBP: 'British Pound',
  AED: 'UAE Dirham',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  SGD: 'Singapore Dollar',
  JPY: 'Japanese Yen',
  CHF: 'Swiss Franc',
  SAR: 'Saudi Riyal',
  QAR: 'Qatari Riyal',
  KWD: 'Kuwaiti Dinar',
  THB: 'Thai Baht',
  MYR: 'Malaysian Ringgit',
  CNY: 'Chinese Yuan',
  NZD: 'New Zealand Dollar',
  BRL: 'Brazilian Real',
  ZAR: 'South African Rand',
  RUB: 'Russian Ruble',
  KRW: 'South Korean Won',
  SEK: 'Swedish Krona',
  NOK: 'Norwegian Krone',
  DKK: 'Danish Krone',
  TRY: 'Turkish Lira',
  IDR: 'Indonesian Rupiah',
  HKD: 'Hong Kong Dollar',
  MXN: 'Mexican Peso',
  PLN: 'Polish Zloty',
  PHP: 'Philippine Peso',
  VND: 'Vietnamese Dong',
  BDT: 'Bangladeshi Taka',
  PKR: 'Pakistani Rupee',
  LKR: 'Sri Lankan Rupee',
  NPR: 'Nepalese Rupee',
};
export const cleanCountryName = (rawName: string): string => {
  let s = rawName
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  s = s
    .replace(/\s*\(the\)$/i, '')
    .replace(/\s*\(french Part\)$/i, '')
    .trim();
  if (s === 'United States Of America') return 'United States';
  if (s.startsWith('United Kingdom Of Great Britain')) return 'United Kingdom';
  if (s.includes('Korea (The Republic Of)')) return 'South Korea';
  if (s.includes('Democratic People’s Republic')) return 'North Korea';
  if (s === 'Viet Nam') return 'Vietnam';
  if (s === 'Russian Federation') return 'Russia';
  if (s.includes('Iran')) return 'Iran';
  if (s.includes('Taiwan')) return 'Taiwan';
  if (s.includes('Moldova')) return 'Moldova';
  if (s.includes('Venezuela')) return 'Venezuela';
  if (s.includes('Syrian')) return 'Syria';
  if (s.includes('Virgin Islands (British)')) return 'British Virgin Islands';
  if (s.includes('Virgin Islands (U.S.)')) return 'U.S. Virgin Islands';
  return s;
};
export const buildCountryDataMap = (): Map<string, CountryCurrencyInfo> => {
  const map = new Map<string, CountryCurrencyInfo>();
  for (const item of CURRENCY_CODES) {
    const code = item.currency_name?.trim().toUpperCase();
    if (!code || code.length !== 3) continue;
    const country = cleanCountryName(item.name);
    if (!map.has(country)) {
      const locale =
        code === 'INR' || IndianFormat.includes(item.currency_code) ? 'en-IN' : 'en-US';
      const symbol = getCurrencySymbol(locale, code) || code;
      const name = CURRENCY_NAME_MAP[code] || item.name;
      map.set(country, { country, code, name, symbol, locale });
    }
  }
  if (!map.has('European Union')) {
    map.set('European Union', {
      country: 'European Union',
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      locale: 'en-EU',
    });
  }
  return map;
};
export const PRIORITY_COUNTRIES = [
  'India',
  'United States',
  'United Kingdom',
  'United Arab Emirates',
  'Canada',
  'Australia',
  'Singapore',
  'Japan',
  'Germany',
  'France',
  'European Union',
  'Switzerland',
  'Saudi Arabia',
  'Qatar',
  'Kuwait',
  'Thailand',
  'Malaysia',
  'China',
  'New Zealand',
  'Brazil',
  'South Africa',
  'South Korea',
  'Russia',
];
