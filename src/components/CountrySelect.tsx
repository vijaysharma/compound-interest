'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FiCheck, FiChevronDown, FiClock, FiGlobe, FiSearch, FiX } from 'react-icons/fi';
import styles from './CountrySelect.module.scss';
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
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);
  // Frequently used countries: prioritize user-frequented countries, then default top countries
  const frequentCountries = useMemo(() => {
    const availableFrequent = FREQUENT_COUNTRIES.filter((c) => countries.includes(c));
    // Also include any user-frequented countries that have usage > 0
    const userFrequent = Object.keys(countryUsage)
      .filter((c) => countries.includes(c) && (countryUsage[c] ?? 0) > 0)
      .sort((a, b) => (countryUsage[b] ?? 0) - (countryUsage[a] ?? 0));
    const combined = Array.from(new Set([...userFrequent, ...availableFrequent]));
    return combined.slice(0, 8);
  }, [countries, countryUsage]);
  // All countries sorted alphabetically
  const allCountriesSorted = useMemo(() => {
    return [...countries].sort((a, b) => a.localeCompare(b));
  }, [countries]);
  // Filtered countries when searching
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    return [...countries]
      .map((country) => ({ country, score: fuzzyScore(country, query) }))
      .filter(({ score }) => score > Number.NEGATIVE_INFINITY)
      .sort((a, b) => b.score - a.score || a.country.localeCompare(b.country))
      .map(({ country }) => country);
  }, [countries, query]);
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    const updateUsage = () => setCountryUsage(readCountryUsage());
    window.addEventListener('storage', updateUsage);
    window.addEventListener(COUNTRY_USAGE_EVENT, updateUsage);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
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
  const isSearching = Boolean(query.trim());
  return (
    <div ref={containerRef} className={styles.container}>
      {/* Trigger Button */}
      <button
        type="button"
        className={styles.selectorTrigger}
        onClick={() =>
          setOpen((prev) => {
            if (prev) setQuery('');
            return !prev;
          })
        }
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Select ${label} country, current selection: ${value}`}
      >
        <span className={styles.triggerContent}>
          <span className={styles.selectedName}>{value || 'Select country'}</span>
          {value && getSecondaryText?.(value) && (
            <span className={styles.secondaryBadge}>{getSecondaryText(value)}</span>
          )}
        </span>
        <FiChevronDown className={`${styles.chevronIcon} ${open ? styles.chevronOpen : ''}`} />
      </button>
      {/* Floating Dropdown Panel */}
      {open && (
        <div className={`${styles.dropdownPanel} ${label.toLowerCase().includes('target') || label.toLowerCase().includes('right') ? styles.alignRight : ''}`}>
          {/* Search Header */}
          <div className={styles.searchHeader}>
            <div className={styles.searchInputWrapper}>
              <FiSearch className={styles.searchIcon} />
              <input
                ref={searchInputRef}
                type="text"
                className={styles.searchInput}
                value={query}
                onChange={(e) => setQuery(e.target.value.slice(0, 60))}
                placeholder="Search countries (e.g. US, India, UK)..."
                aria-label={`Search ${label} countries`}
              />
              {query && (
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={() => {
                    setQuery('');
                    searchInputRef.current?.focus();
                  }}
                  aria-label="Clear search"
                >
                  <FiX />
                </button>
              )}
            </div>
          </div>
          {/* Options List */}
          <div className={styles.optionsScrollArea} role="listbox">
            {isSearching ? (
              searchResults.length > 0 ? (
                <>
                  <div className={styles.sectionHeader}>
                    <FiSearch className={styles.sectionIcon} />
                    <span>Matching Countries ({searchResults.length})</span>
                  </div>
                  {searchResults.map((country) => (
                    <div key={`search-${country}`} role="option" aria-selected={country === value} className={styles.optionItem}>
                      <button
                        type="button"
                        className={`${styles.optionButton} ${country === value ? styles.optionSelected : ''}`}
                        onClick={() => selectCountry(country)}
                      >
                        <span className={styles.optionLabel}>
                          <span className={styles.countryName}>{country}</span>
                          {getSecondaryText?.(country) && (
                            <span className={styles.secondaryBadge}>{getSecondaryText(country)}</span>
                          )}
                        </span>
                        {country === value && <FiCheck className={styles.checkIcon} />}
                      </button>
                    </div>
                  ))}
                </>
              ) : (
                <div className={styles.emptyState}>
                  <span>No countries matching &ldquo;{query}&rdquo;</span>
                </div>
              )
            ) : (
              <>
                {/* Frequently Used Section */}
                {frequentCountries.length > 0 && (
                  <>
                    <div className={styles.sectionHeader}>
                      <FiClock className={styles.sectionIcon} />
                      <span>Frequently Used</span>
                    </div>
                    {frequentCountries.map((country) => (
                      <div key={`freq-${country}`} role="option" aria-selected={country === value} className={styles.optionItem}>
                        <button
                          type="button"
                          className={`${styles.optionButton} ${country === value ? styles.optionSelected : ''}`}
                          onClick={() => selectCountry(country)}
                        >
                          <span className={styles.optionLabel}>
                            <span className={styles.countryName}>{country}</span>
                            {getSecondaryText?.(country) && (
                              <span className={styles.secondaryBadge}>{getSecondaryText(country)}</span>
                            )}
                          </span>
                          {country === value && <FiCheck className={styles.checkIcon} />}
                        </button>
                      </div>
                    ))}
                  </>
                )}
                {/* All Countries Section */}
                <div className={styles.sectionHeader}>
                  <FiGlobe className={styles.sectionIcon} />
                  <span>All Countries ({allCountriesSorted.length})</span>
                </div>
                {allCountriesSorted.map((country) => (
                  <div key={`all-${country}`} role="option" aria-selected={country === value} className={styles.optionItem}>
                    <button
                      type="button"
                      className={`${styles.optionButton} ${country === value ? styles.optionSelected : ''}`}
                      onClick={() => selectCountry(country)}
                    >
                      <span className={styles.optionLabel}>
                        <span className={styles.countryName}>{country}</span>
                        {getSecondaryText?.(country) && (
                          <span className={styles.secondaryBadge}>{getSecondaryText(country)}</span>
                        )}
                      </span>
                      {country === value && <FiCheck className={styles.checkIcon} />}
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default CountrySelect;
