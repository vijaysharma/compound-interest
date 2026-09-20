export const FREQUENT_COUNTRIES = [
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
];
export const COUNTRY_USAGE_KEY = 'ppp-country-usage';
export const COUNTRY_USAGE_EVENT = 'ppp-country-usage-updated';
export const COUNTRY_ALIASES: Record<string, string[]> = {
  'United States': ['us', 'usa', 'america', 'united states', 'usd', 'dollar', 'dollars'],
  India: ['in', 'india', 'bharat', 'inr', 'rupee', 'rupees'],
  'United Kingdom': ['uk', 'gb', 'england', 'britain', 'united kingdom', 'gbp', 'pound', 'pounds'],
  'United Arab Emirates': [
    'uae',
    'emirates',
    'dubai',
    'united arab emirates',
    'aed',
    'dirham',
    'dirhams',
  ],
  Germany: ['germany', 'de', 'deutschland', 'eur', 'euro', 'euros'],
  France: ['france', 'fr', 'eur', 'euro', 'euros'],
  'European Union': ['eu', 'europe', 'eurozone', 'eur', 'euro', 'euros'],
  Canada: ['canada', 'ca', 'cad', 'canadian dollar'],
  Australia: ['australia', 'au', 'aud', 'australian dollar'],
  Singapore: ['singapore', 'sg', 'sgd'],
  Japan: ['japan', 'jp', 'jpy', 'yen'],
  Switzerland: ['switzerland', 'ch', 'swiss', 'chf', 'franc'],
  'Saudi Arabia': ['saudi', 'saudi arabia', 'sa', 'sar', 'riyal'],
  Qatar: ['qatar', 'qa', 'qar', 'qatari riyal'],
  Kuwait: ['kuwait', 'kw', 'kwd', 'dinar', 'kuwaiti dinar'],
  China: ['china', 'cn', 'cny', 'yuan', 'rmb', 'renminbi'],
  Thailand: ['thailand', 'th', 'thb', 'baht'],
  Malaysia: ['malaysia', 'my', 'myr', 'ringgit'],
  'South Korea': ['korea', 'south korea', 'kr', 'krw', 'won'],
  Russia: ['russia', 'russian', 'ru', 'rub', 'ruble', 'rouble'],
  'New Zealand': ['new zealand', 'nz', 'nzd'],
  'South Africa': ['south africa', 'za', 'zar', 'rand'],
  Brazil: ['brazil', 'br', 'brl', 'real'],
  Sweden: ['sweden', 'se', 'sek', 'krona'],
  Norway: ['norway', 'no', 'nok', 'krone'],
  Denmark: ['denmark', 'dk', 'dkk', 'krone'],
  Turkey: ['turkey', 'tr', 'try', 'lira'],
  Indonesia: ['indonesia', 'id', 'idr', 'rupiah'],
  'Hong Kong': ['hong kong', 'hk', 'hkd'],
  Mexico: ['mexico', 'mx', 'mxn', 'peso'],
  Poland: ['poland', 'pl', 'pln', 'zloty'],
  Philippines: ['philippines', 'ph', 'php', 'peso'],
  Vietnam: ['vietnam', 'vn', 'vnd', 'dong'],
  Bangladesh: ['bangladesh', 'bd', 'bdt', 'taka'],
  Pakistan: ['pakistan', 'pk', 'pkr', 'rupee'],
  'Sri Lanka': ['sri lanka', 'lk', 'lkr', 'rupee'],
  Nepal: ['nepal', 'np', 'npr', 'rupee'],
};
export const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
export const readCountryUsage = (): Record<string, number> => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = JSON.parse(window.localStorage.getItem(COUNTRY_USAGE_KEY) ?? '{}');
    return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  } catch {
    return {};
  }
};
export const fuzzyScore = (country: string, query: string) => {
  const cleanQuery = normalise(query);
  if (!cleanQuery) return 0;
  const candidates = [country, ...(COUNTRY_ALIASES[country] ?? [])].map(normalise);
  let best = Number.NEGATIVE_INFINITY;
  for (const candidate of candidates) {
    if (candidate === cleanQuery) best = Math.max(best, 1000);
    else if (candidate.startsWith(cleanQuery)) best = Math.max(best, 800 - candidate.length);
    else if (candidate.includes(cleanQuery)) best = Math.max(best, 600 - candidate.length);
    else {
      let queryIndex = 0;
      let gaps = 0;
      for (const character of candidate) {
        if (character === cleanQuery[queryIndex]) queryIndex += 1;
        else if (queryIndex > 0) gaps += 1;
        if (queryIndex === cleanQuery.length) break;
      }
      if (queryIndex === cleanQuery.length) best = Math.max(best, 400 - gaps);
    }
  }
  return best;
};
