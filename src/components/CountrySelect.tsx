'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import {
  FREQUENT_COUNTRIES,
  COUNTRY_USAGE_KEY,
  COUNTRY_USAGE_EVENT,
  readCountryUsage,
  fuzzyScore,
} from './country-select/countryAliases';
import { CountrySelectDropdown } from './country-select/CountrySelectDropdown';
import styles from './CountrySelect.module.scss';
interface CountrySelectProps {
  label: string;
  value: string;
  countries: string[];
  onChange: (country: string) => void;
  getSecondaryText?: (country: string) => string | undefined;
}
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
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);
  const frequentCountries = useMemo(() => {
    const availableFrequent = FREQUENT_COUNTRIES.filter((c) => countries.includes(c));
    const userFrequent = Object.keys(countryUsage)
      .filter((c) => countries.includes(c) && (countryUsage[c] ?? 0) > 0)
      .sort((a, b) => (countryUsage[b] ?? 0) - (countryUsage[a] ?? 0));
    return Array.from(new Set([...userFrequent, ...availableFrequent])).slice(0, 8);
  }, [countries, countryUsage]);
  const allCountriesSorted = useMemo(() => {
    return [...countries].sort((a, b) => a.localeCompare(b));
  }, [countries]);
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
  return (
    <div ref={containerRef} className={styles.container}>
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
      {open && (
        <CountrySelectDropdown
          label={label}
          value={value}
          query={query}
          setQuery={setQuery}
          searchInputRef={searchInputRef}
          searchResults={searchResults}
          frequentCountries={frequentCountries}
          allCountriesSorted={allCountriesSorted}
          onSelectCountry={selectCountry}
          getSecondaryText={getSecondaryText}
        />
      )}
    </div>
  );
};
export default CountrySelect;
