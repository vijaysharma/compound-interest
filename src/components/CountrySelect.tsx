import { useEffect, useMemo, useRef, useState } from 'react';
interface CountrySelectProps {
  label: string;
  value: string;
  countries: string[];
  onChange: (country: string) => void;
  getSecondaryText?: (country: string) => string | undefined;
}
const FREQUENT_COUNTRIES = [
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
const COUNTRY_USAGE_KEY = 'ppp-country-usage';
const COUNTRY_USAGE_EVENT = 'ppp-country-usage-updated';
const COUNTRY_ALIASES: Record<string, string[]> = {
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
const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
const readCountryUsage = (): Record<string, number> => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = JSON.parse(window.localStorage.getItem(COUNTRY_USAGE_KEY) ?? '{}');
    return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  } catch {
    return {};
  }
};
const fuzzyScore = (country: string, query: string) => {
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
const CountrySelect = ({
  label,
  value,
  countries,
  onChange,
  getSecondaryText,
}: CountrySelectProps) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [countryUsage, setCountryUsage] = useState<Record<string, number>>(readCountryUsage);
  const containerRef = useRef<HTMLDivElement>(null);
  const options = useMemo(() => {
    const defaultRank = new Map(FREQUENT_COUNTRIES.map((country, index) => [country, index]));
    const sortByUsage = (first: string, second: string) =>
      (countryUsage[second] ?? 0) - (countryUsage[first] ?? 0) ||
      (defaultRank.get(first) ?? FREQUENT_COUNTRIES.length) -
        (defaultRank.get(second) ?? FREQUENT_COUNTRIES.length) ||
      first.localeCompare(second);
    const frequent = FREQUENT_COUNTRIES.filter((country) => countries.includes(country));
    const remaining = countries.filter((country) => !frequent.includes(country));
    const ranked = query.trim()
      ? [...countries]
          .map((country) => ({ country, score: fuzzyScore(country, query) }))
          .filter(({ score }) => score > Number.NEGATIVE_INFINITY)
          .sort((a, b) => b.score - a.score || sortByUsage(a.country, b.country))
          .map(({ country }) => country)
      : remaining.sort(sortByUsage);
    return query.trim() ? ranked : [...frequent, ...ranked].sort(sortByUsage);
  }, [countries, countryUsage, query]);
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    const updateUsage = () => setCountryUsage(readCountryUsage());
    window.addEventListener('storage', updateUsage);
    window.addEventListener(COUNTRY_USAGE_EVENT, updateUsage);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('storage', updateUsage);
      window.removeEventListener(COUNTRY_USAGE_EVENT, updateUsage);
    };
  }, []);
  const selectCountry = (country: string) => {
    const usage = readCountryUsage();
    const nextUsage = {
      ...usage,
      [country]: (usage[country] ?? 0) + 1,
    };
    window.localStorage.setItem(COUNTRY_USAGE_KEY, JSON.stringify(nextUsage));
    setCountryUsage(nextUsage);
    window.dispatchEvent(new Event(COUNTRY_USAGE_EVENT));
    onChange(country);
    setQuery('');
    setOpen(false);
  };
  return (
    <div ref={containerRef} className="relative grow">
      <label className="sr-only" htmlFor={`${label}-country-search`}>
        {label} country
      </label>
      <input
        id={`${label}-country-search`}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${label}-country-options`}
        maxLength={60}
        className="join-item w-full input input-primary focus:outline-none"
        value={open ? query : value}
        placeholder={value}
        onFocus={() => {
          setQuery('');
          setOpen(true);
        }}
        onChange={(event) => {
          setQuery(event.target.value.slice(0, 60));
          setOpen(true);
        }}
      />
      {open && (
        <ul
          id={`${label}-country-options`}
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto border border-base-300 bg-base-100 p-1 shadow-lg"
        >
          {options.length > 0 ? (
            options.map((country) => (
              <li key={country} role="option" aria-selected={country === value}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-base-200 flex items-center justify-between"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectCountry(country)}
                >
                  <span className="truncate">{country}</span>
                  {getSecondaryText?.(country) && (
                    <span className="text-xs font-mono font-semibold opacity-70 bg-base-200/80 border border-base-300 px-1.5 py-0.5 rounded ml-2 shrink-0">
                      {getSecondaryText(country)}
                    </span>
                  )}
                </button>
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-sm opacity-60">No countries found</li>
          )}
        </ul>
      )}
    </div>
  );
};
export default CountrySelect;
