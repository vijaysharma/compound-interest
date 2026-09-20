import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiLoader, FiPlus } from 'react-icons/fi';
import { searchMutualFundsAction } from '@/actions/data';
import styles from './StrategyCalculator.module.scss';
interface SearchResultFund {
  schemeCode: number;
  schemeName: string;
}
interface FundSearchDropdownProps {
  onSelect: (fund: { fundId: string; schemeName: string }) => void;
  disabled?: boolean;
}
export const FundSearchDropdown: React.FC<FundSearchDropdownProps> = ({ onSelect, disabled = false }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultFund[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setIsLoading(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchMutualFundsAction(query.trim());
        setResults((data || []).slice(0, 8));
        setIsOpen(true);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);
  const handleSelect = (fund: SearchResultFund) => {
    onSelect({ fundId: String(fund.schemeCode), schemeName: fund.schemeName });
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };
  return (
    <div className={styles.fundSearchDropdown} ref={containerRef}>
      <div className={styles.searchInputWrapper}>
        <FiSearch className={styles.searchIcon} />
        <input
          type="text"
          className={styles.fundSearchInput}
          placeholder={disabled ? 'Maximum 4 funds reached' : 'Search fund by name to add...'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          disabled={disabled}
        />
        {isLoading && <FiLoader className={styles.searchSpinner} />}
      </div>
      {isOpen && results.length > 0 && (
        <div className={styles.searchResultsList}>
          {results.map((fund) => (
            <button
              key={fund.schemeCode}
              type="button"
              className={styles.searchResultItem}
              onClick={() => handleSelect(fund)}
            >
              <span className={styles.resultFundName}>{fund.schemeName}</span>
              <span className={styles.resultAddIcon}>
                <FiPlus />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
