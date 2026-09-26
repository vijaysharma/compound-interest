'use client';
import { useEffect, useMemo, useState } from 'react';
import { fetchBatchMFbySchemeCodes } from '../../data/api_data';
import type { NavBook, StrategyConfig } from './types';
export interface StrategyNavState {
  navBook: NavBook;
  isLoading: boolean;
  error: string | null;
}
const globalNavCache: NavBook = {};
export function useStrategyNav(config: StrategyConfig): StrategyNavState {
  const c1Code = config.column1.fund?.schemeCode ?? '';
  const c2Codes = config.column2.map((entry) => entry.fund.schemeCode).sort().join(',');
  const schemeCodes = useMemo(() => {
    const codes = new Set<string>();
    if (c1Code) codes.add(c1Code);
    if (c2Codes) {
      for (const code of c2Codes.split(',')) if (code) codes.add(code);
    }
    return Array.from(codes).sort();
  }, [c1Code, c2Codes]);
  const [loadedKeys, setLoadedKeys] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const isMissing = schemeCodes.some((code) => !globalNavCache[code]);
  const isLoading = isMissing && !error;
  const navBook = useMemo(() => {
    void loadedKeys;
    const book: NavBook = {};
    for (const code of schemeCodes) {
      if (globalNavCache[code]) book[code] = globalNavCache[code];
    }
    return book;
  }, [schemeCodes, loadedKeys]);
  useEffect(() => {
    const missing = schemeCodes.filter((code) => !globalNavCache[code]);
    if (missing.length === 0) return;
    let cancelled = false;
    fetchBatchMFbySchemeCodes(missing, config.asOfDate)
      .then((fetched) => {
        if (cancelled) return;
        const resolved = Object.entries(fetched).filter(([, rows]) => rows.length > 0);
        for (const [code, rows] of resolved) {
          globalNavCache[code] = rows;
        }
        setLoadedKeys(Object.keys(globalNavCache).sort().join(','));
        const unresolved = missing.filter((code) => !globalNavCache[code]);
        if (unresolved.length > 0) {
          setError('Historical NAV data is unavailable for one or more selected funds.');
        }
      })
      .catch(() => {
        if (!cancelled) setError('Could not load historical NAV data. Please try again.');
      });
    return () => {
      cancelled = true;
    };
  }, [schemeCodes, config.asOfDate]);
  return { navBook, isLoading, error };
}
