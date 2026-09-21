import { useState, useRef, useEffect } from 'react';
import type { MFType, NavType } from '../../types/types';
import type { PinnedFund } from './types';
import { parseAnyDate, parseNavDate, navDateToISO } from '../../utilities/utility';
import { fetchBatchMFbySchemeCodes, fetchMFbySchemeCode } from '../../data/api_data';
import { getChartSeriesColor } from '../../data/chartColors';
export function usePinnedFunds(
  initialPinned: PinnedFund[] = [],
  endDate: string | null = null,
  duration = '1',
  onDatesResolved?: (start: string, end: string) => void
) {
  const [pinnedFunds, setPinnedFunds] = useState<PinnedFund[]>(initialPinned);
  const [pinnedNavData, setPinnedNavData] = useState<Record<string, NavType[]>>({});
  const [selectedCode, setSelectedCode] = useState<string>('0');
  const [jsonNavData, setJsonNavData] = useState<NavType[]>([]);
  const [loadingSchemeCodes, setLoadingSchemeCodes] = useState<Set<string>>(new Set());
  const [isNavLoading, setIsNavLoading] = useState(false);
  const pinnedFundsRef = useRef(pinnedFunds);
  const pinnedNavDataRef = useRef(pinnedNavData);
  // `${schemeCode}|${endDate}` pairs already fetched. AMFI publishes no NAV on
  // weekends/holidays and the current day's NAV lands late in the evening, so a
  // fund's latest NAV legitimately predates the requested end date. Without
  // this record the staleness check below would refetch on every render and the
  // chart would never leave its loading state.
  const fetchedEndDatesRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    pinnedFundsRef.current = pinnedFunds;
    pinnedNavDataRef.current = pinnedNavData;
  }, [pinnedFunds, pinnedNavData]);
  useEffect(() => {
    if (pinnedFunds.length === 0) return;
    const reqDateMs = endDate ? parseAnyDate(endDate).getTime() : 0;
    const missingFunds = pinnedFunds.filter((fund) => {
      const data = pinnedNavDataRef.current[fund.schemeCode];
      if (!data || data.length === 0) return true;
      if (reqDateMs > 0 && !fetchedEndDatesRef.current.has(`${fund.schemeCode}|${endDate}`)) {
        let latestDateMs = 0;
        for (const n of data) {
          const time = parseNavDate(n.date).getTime();
          if (time > latestDateMs) latestDateMs = time;
        }
        if (reqDateMs > latestDateMs) return true;
      }
      return false;
    });
    if (missingFunds.length === 0) {
      setIsNavLoading(false);
      return;
    }
    let cancelled = false;
    const restore = async () => {
      setIsNavLoading(true);
      const codes = missingFunds.map((f) => f.schemeCode);
      try {
        const batchResults = await fetchBatchMFbySchemeCodes(codes, endDate);
        if (!cancelled) {
          // Only record funds the fetch actually resolved, so a failed request
          // is retried rather than silently accepted as "no newer NAV exists".
          for (const code of codes) {
            if (batchResults[code]?.length || pinnedNavDataRef.current[code]?.length) {
              fetchedEndDatesRef.current.add(`${code}|${endDate}`);
            }
          }
          setPinnedNavData((prev) => ({ ...prev, ...batchResults }));
        }
      } catch (err) {
        console.error('Failed to restore batch NAV data:', err);
      } finally {
        if (!cancelled) setIsNavLoading(false);
      }
    };
    void restore();
    return () => { cancelled = true; };
  }, [pinnedFunds, endDate]);
  useEffect(() => {
    if (!selectedCode || selectedCode === '0') return;
    const cached = pinnedNavDataRef.current[selectedCode];
    if (cached && cached.length > 0) {
      setJsonNavData(cached);
      return;
    }
    let cancelled = false;
    fetchMFbySchemeCode(selectedCode)
      .then((data) => {
        if (cancelled) return;
        setJsonNavData(data);
        if (pinnedFundsRef.current.some((f) => f.schemeCode === selectedCode)) {
          setPinnedNavData((prev) => ({ ...prev, [selectedCode]: data }));
        }
      })
      .catch((err) => {
        if (!cancelled) console.error('Failed to fetch selected mutual fund:', err);
      });
    return () => { cancelled = true; };
  }, [selectedCode]);
  const togglePinFund = async (mf: MFType) => {
    const schemeCode = String(mf.value);
    const existing = pinnedFunds.find((f) => f.schemeCode === schemeCode);
    if (existing) {
      const remaining = pinnedFunds.filter((f) => f.schemeCode !== schemeCode);
      setPinnedFunds(remaining);
      setPinnedNavData((prev) => {
        const next = { ...prev };
        delete next[schemeCode];
        return next;
      });
      if (selectedCode === schemeCode) {
        const replacement = remaining[0];
        if (replacement) setSelectedCode(replacement.schemeCode);
        else { setSelectedCode('0'); setJsonNavData([]); }
      }
      return;
    }
    if (pinnedFunds.length >= 8) return;
    const color = getChartSeriesColor(pinnedFunds.length);
    const newPinnedFund: PinnedFund = { schemeCode, schemeName: mf.name, color };
    setPinnedFunds((prev) => [...prev, newPinnedFund]);
    setSelectedCode(schemeCode);
    const existingNav = pinnedNavDataRef.current[schemeCode];
    if (existingNav && existingNav.length > 0) {
      setJsonNavData(existingNav);
      return;
    }
    setLoadingSchemeCodes((prev) => new Set([...prev, schemeCode]));
    try {
      const navData = await fetchMFbySchemeCode(schemeCode);
      setPinnedNavData((prev) => ({ ...prev, [schemeCode]: navData }));
      setJsonNavData(navData);
      const durationIndex = Math.max(parseInt(duration, 10) || 1, 0);
      const index = Math.min(durationIndex, navData.length - 1);
      const start = navData[index];
      const end = navData[0];
      if (start && end) onDatesResolved?.(navDateToISO(start.date), navDateToISO(end.date));
    } catch (err) {
      setPinnedFunds((prev) => prev.filter((f) => f.schemeCode !== schemeCode));
      console.error('Failed to pin mutual fund:', err);
    } finally {
      setLoadingSchemeCodes((prev) => {
        const next = new Set(prev);
        next.delete(schemeCode);
        return next;
      });
    }
  };
  return {
    pinnedFunds,
    setPinnedFunds,
    pinnedNavData,
    setPinnedNavData,
    selectedCode,
    setSelectedCode,
    jsonNavData,
    setJsonNavData,
    loadingSchemeCodes,
    isNavLoading,
    togglePinFund,
  };
}
