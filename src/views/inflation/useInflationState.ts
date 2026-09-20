import { useState, useEffect, useMemo } from 'react';
import { fetchInflationData, InflationRow } from '../../data/api_data';
import {
  calculateInflatedPrice,
  checkNAYear,
  getCurrencySymbolAndLocale,
} from '../../utilities/utility';
const YEAR = new Date().getFullYear();
const START_YEAR = (YEAR - 30).toString();
const CURRENT_YEAR = YEAR.toString();
export function useInflationState() {
  const [inflationData, setInflationData] = useState<InflationRow[]>([]);
  const [inflationLoading, setInflationLoading] = useState(true);
  const [inflationError, setInflationError] = useState<string | null>(null);
  const [place, setPlace] = useState('India');
  const [principal, setPrincipal] = useState('100');
  const [startYear, setStartYear] = useState(START_YEAR);
  const [endYear, setEndYear] = useState(CURRENT_YEAR);
  useEffect(() => {
    let cancelled = false;
    const loadInflationData = async () => {
      setInflationLoading(true);
      setInflationError(null);
      try {
        const rows = await fetchInflationData();
        if (cancelled) return;
        setInflationData(rows);
        if (rows.length > 0) {
          const years = rows.map((r) => r.Year);
          const earliest = Math.min(...years);
          const latest = Math.max(...years);
          setStartYear((prev) => (years.includes(parseInt(prev, 10)) ? prev : String(earliest)));
          setEndYear((prev) => (years.includes(parseInt(prev, 10)) ? prev : String(latest)));
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch inflation data:', err);
          setInflationError('Unable to load inflation data right now. Please try again shortly.');
        }
      } finally {
        if (!cancelled) setInflationLoading(false);
      }
    };
    void loadInflationData();
    return () => {
      cancelled = true;
    };
  }, []);
  const endYearIsEstimate = useMemo(() => {
    const row = inflationData.find((r) => String(r.Year) === endYear);
    const value = row?.[place as keyof Omit<InflationRow, 'Year' | 'id'>];
    return typeof value === 'string' && value.endsWith('*');
  }, [inflationData, endYear, place]);
  const [inflatedAmount, deflatedAmount] = useMemo(() => {
    return inflationData.length > 0
      ? calculateInflatedPrice(principal, startYear, endYear, place, inflationData)
      : [0, 0];
  }, [inflationData, principal, startYear, endYear, place]);
  const [currencySymbol, locale] = useMemo(
    () => getCurrencySymbolAndLocale(place),
    [place]
  );
  const startYearOptions = useMemo(
    () =>
      inflationData
        .filter((inflation) => checkNAYear(inflation, place))
        .map((inflation) => String(inflation.Year)),
    [inflationData, place]
  );
  const endYearOptions = useMemo(
    () => inflationData.map((inflation) => String(inflation.Year)),
    [inflationData]
  );
  return {
    inflationData,
    inflationLoading,
    inflationError,
    place,
    setPlace,
    principal,
    setPrincipal,
    startYear,
    setStartYear,
    endYear,
    setEndYear,
    endYearIsEstimate,
    inflatedAmount,
    deflatedAmount,
    currencySymbol,
    locale,
    startYearOptions,
    endYearOptions,
  };
}
