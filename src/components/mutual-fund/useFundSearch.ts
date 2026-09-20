import { useState, useDeferredValue, useEffect, useMemo } from 'react';
import type { MFJSONType, MFType } from '../../types/types';
import { fetchAllMfs } from '../../data/api_data';
const filterMfs = (funds: MFType[], filterKey: string): MFType[] => {
  let expression = filterKey;
  if (expression === 'Growth') expression = 'Growth|Cumulative';
  if (expression.startsWith('!')) {
    const negativeExpression = expression.substring(1);
    return funds.filter((mf) => !RegExp(negativeExpression, 'i').test(mf.name));
  }
  return funds.filter((mf) => RegExp(expression, 'i').test(mf.name));
};
export function useFundSearch(initialSearch = 'Kotak Arbitrage Fund', isModalOpen = false) {
  const [jsonAllData, setJsonAllData] = useState<MFJSONType[]>([]);
  const [searchKey, setSearchKey] = useState<string>(initialSearch);
  const deferredSearchKey = useDeferredValue(searchKey);
  const [selectedType, setSelectedType] = useState<string>('Direct');
  const [selectedGrowth, setSelectedGrowth] = useState<string>('Growth');
  const [error, setError] = useState<{ status: string; message: string }>({ status: '', message: '' });
  useEffect(() => {
    if (!isModalOpen) return;
    const search = deferredSearchKey.trim();
    if (!search) return;
    const controller = new AbortController();
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      fetchAllMfs(search, controller.signal)
        .then((data) => {
          if (!cancelled) setJsonAllData(data);
        })
        .catch((err) => {
          if (!cancelled) setError({ status: 'error', message: err instanceof Error ? err.message : 'Failed to fetch mutual funds' });
        });
    }, 350);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [deferredSearchKey, isModalOpen]);
  const allFunds = useMemo<MFType[]>(() => {
    return jsonAllData.map((fund: MFJSONType, index: number) => ({
      id: `${index}`,
      value: fund.schemeCode,
      name: fund.schemeName,
    }));
  }, [jsonAllData]);
  const mfs = useMemo<MFType[]>(() => {
    if (!deferredSearchKey.trim()) return [];
    let filtered = filterMfs(allFunds, selectedType);
    filtered = filterMfs(filtered, selectedGrowth);
    const search = deferredSearchKey.trim();
    if (search) {
      const searchParts = search.split(/\s+/).filter(Boolean).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '')).filter(Boolean);
      if (searchParts.length > 0) {
        const expr = new RegExp(searchParts.map((p) => `(?=.*?\\b${p})`).join('') + '.*', 'i');
        return filtered.filter((fund) => expr.test(fund.name));
      }
    }
    return filtered;
  }, [allFunds, deferredSearchKey, selectedType, selectedGrowth]);
  return {
    searchKey,
    setSearchKey,
    deferredSearchKey,
    selectedType,
    setSelectedType,
    selectedGrowth,
    setSelectedGrowth,
    mfs,
    error,
  };
}
