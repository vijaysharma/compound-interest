'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchBatchMFbySchemeCodes } from '../../data/api_data';
import type { NavBook, StrategyConfig } from './types';
export interface StrategyNavState {
  navBook: NavBook;
  isLoading: boolean;
  error: string | null;
}
/**
 * Loads historical NAVs for exactly the funds the strategy references, through
 * the app's existing batched mutual-fund NAV service. Each scheme is fetched
 * once; the cached series covers the whole date range the engine needs.
 */
export function useStrategyNav(config: StrategyConfig): StrategyNavState {
  const schemeCodes = useMemo(() => {
    const codes = new Set<string>();
    if (config.column1.fund) codes.add(config.column1.fund.schemeCode);
    for (const entry of config.column2) codes.add(entry.fund.schemeCode);
    return Array.from(codes).sort();
  }, [config.column1.fund, config.column2]);
  const [navBook, setNavBook] = useState<NavBook>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef<NavBook>({});
  useEffect(() => {
    const missing = schemeCodes.filter((code) => !loadedRef.current[code]);
    if (missing.length === 0) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetchBatchMFbySchemeCodes(missing, config.asOfDate)
      .then((fetched) => {
        if (cancelled) return;
        const resolved = Object.entries(fetched).filter(([, rows]) => rows.length > 0);
        loadedRef.current = { ...loadedRef.current, ...Object.fromEntries(resolved) };
        setNavBook(loadedRef.current);
        const unresolved = missing.filter((code) => !loadedRef.current[code]);
        if (unresolved.length > 0) {
          setError('Historical NAV data is unavailable for one or more selected funds.');
        }
      })
      .catch(() => {
        if (!cancelled) setError('Could not load historical NAV data. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [schemeCodes, config.asOfDate]);
  return { navBook, isLoading, error };
}
