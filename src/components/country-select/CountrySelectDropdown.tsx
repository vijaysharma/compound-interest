import React, { RefObject } from 'react';
import { FiClock, FiGlobe, FiSearch, FiX } from 'react-icons/fi';
import { CountryOptionItem } from './CountryOptionItem';
import styles from '../CountrySelect.module.scss';
interface CountrySelectDropdownProps {
  label: string;
  value: string;
  query: string;
  setQuery: (q: string) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  searchResults: string[];
  frequentCountries: string[];
  allCountriesSorted: string[];
  onSelectCountry: (country: string) => void;
  getSecondaryText?: (country: string) => string | undefined;
}
export function CountrySelectDropdown({
  label,
  value,
  query,
  setQuery,
  searchInputRef,
  searchResults,
  frequentCountries,
  allCountriesSorted,
  onSelectCountry,
  getSecondaryText,
}: CountrySelectDropdownProps) {
  const isSearching = Boolean(query.trim());
  const alignRight = label.toLowerCase().includes('target') || label.toLowerCase().includes('right');
  return (
    <div className={`${styles.dropdownPanel} ${alignRight ? styles.alignRight : ''}`}>
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
      <div className={styles.optionsScrollArea} role="listbox">
        {isSearching ? (
          searchResults.length > 0 ? (
            <>
              <div className={styles.sectionHeader}>
                <FiSearch className={styles.sectionIcon} />
                <span>Matching Countries ({searchResults.length})</span>
              </div>
              {searchResults.map((country) => (
                <CountryOptionItem
                  key={`search-${country}`}
                  itemKey={`search-${country}`}
                  country={country}
                  isSelected={country === value}
                  onSelect={onSelectCountry}
                  secondaryText={getSecondaryText?.(country)}
                />
              ))}
            </>
          ) : (
            <div className={styles.emptyState}>
              <span>No countries matching &ldquo;{query}&rdquo;</span>
            </div>
          )
        ) : (
          <>
            {frequentCountries.length > 0 && (
              <>
                <div className={styles.sectionHeader}>
                  <FiClock className={styles.sectionIcon} />
                  <span>Frequently Used</span>
                </div>
                {frequentCountries.map((country) => (
                  <CountryOptionItem
                    key={`freq-${country}`}
                    itemKey={`freq-${country}`}
                    country={country}
                    isSelected={country === value}
                    onSelect={onSelectCountry}
                    secondaryText={getSecondaryText?.(country)}
                  />
                ))}
              </>
            )}
            <div className={styles.sectionHeader}>
              <FiGlobe className={styles.sectionIcon} />
              <span>All Countries ({allCountriesSorted.length})</span>
            </div>
            {allCountriesSorted.map((country) => (
              <CountryOptionItem
                key={`all-${country}`}
                itemKey={`all-${country}`}
                country={country}
                isSelected={country === value}
                onSelect={onSelectCountry}
                secondaryText={getSecondaryText?.(country)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
