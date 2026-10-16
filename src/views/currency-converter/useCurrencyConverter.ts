import { useState, useMemo, useCallback, useEffect } from 'react';
import { fetchExchangeRates } from '../../data/api_data';
import { DEFAULT_EXCHANGE_RATES } from '../../data/default_exchange_rates';
import { buildCountryDataMap, PRIORITY_COUNTRIES, computePresetDates, type GraphPresetType } from './currencyDataUtils';
import { getHistoricalRatesAction, type CurrencyHistoricalPoint } from '@/actions/data';

export { computePresetDates, type GraphPresetType };
export function useCurrencyConverter() {
  const [rates, setRates] = useState<Record<string, number>>(DEFAULT_EXCHANGE_RATES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [srcCountry, setSrcCountry] = useState('United States');
  const [tgtCountry, setTgtCountry] = useState('India');
  const [amount, setAmount] = useState('1');
  const [lastRefreshed, setLastRefreshed] = useState(() => new Date().toLocaleTimeString());
  const [historicalPoints, setHistoricalPoints] = useState<CurrencyHistoricalPoint[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [customDateRate, setCustomDateRate] = useState<number | null>(null);
  const [loadingCustomDate, setLoadingCustomDate] = useState(false);
  const [graphPreset, setGraphPreset] = useState<GraphPresetType>('1M');
  const [graphStartDate, setGraphStartDate] = useState(() => computePresetDates('1M').start);
  const [graphEndDate, setGraphEndDate] = useState(() => computePresetDates('1M').end);
  const countryData = useMemo(() => buildCountryDataMap(), []);
  const availableCountries = useMemo(() => {
    const list = Array.from(countryData.keys());
    list.sort((a, b) => {
      const aIdx = PRIORITY_COUNTRIES.indexOf(a);
      const bIdx = PRIORITY_COUNTRIES.indexOf(b);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.localeCompare(b);
    });
    return list;
  }, [countryData]);
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchExchangeRates(false);
      if (data && Object.keys(data).length > 0) {
        setRates(data);
        setError(null);
        setLastRefreshed(new Date().toLocaleTimeString());
      } else {
        setError('Unable to fetch live exchange rates right now. Please try again in a moment.');
      }
    } catch (err) {
      console.error('Failed to load exchange rates:', err);
      setError('Unable to fetch live exchange rates right now. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    let cancelled = false;
    const fetchInitialRates = async () => {
      try {
        const data = await fetchExchangeRates(false);
        if (!cancelled) {
          if (data && Object.keys(data).length > 0) {
            setRates(data);
            setError(null);
            setLastRefreshed(new Date().toLocaleTimeString());
          } else {
            setError(
              'Unable to fetch live exchange rates right now. Please try again in a moment.'
            );
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load exchange rates:', err);
          setError('Unable to fetch live exchange rates right now. Please try again in a moment.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchInitialRates();
    return () => {
      cancelled = true;
    };
  }, []);
  const sourceCurrency = useMemo(
    () =>
      countryData.get(srcCountry) || {
        country: srcCountry,
        code: 'INR',
        name: 'Indian Rupee',
        symbol: '₹',
        locale: 'en-IN',
      },
    [countryData, srcCountry]
  );
  const targetCurrency = useMemo(
    () =>
      countryData.get(tgtCountry) || {
        country: tgtCountry,
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        locale: 'en-US',
      },
    [countryData, tgtCountry]
  );
  const handleSwapCountries = () => {
    setSrcCountry(tgtCountry);
    setTgtCountry(srcCountry);
  };
  const handleSelectGraphPreset = useCallback((preset: '7D' | '1M' | '3M' | '6M' | '1Y' | '5Y' | '10Y') => {
    setGraphPreset(preset);
    const { start, end } = computePresetDates(preset);
    setGraphStartDate(start);
    setGraphEndDate(end);
  }, []);
  const handleCustomGraphDates = useCallback((start: string, end: string) => {
    setGraphPreset('custom');
    setGraphStartDate(start);
    setGraphEndDate(end);
  }, []);
  useEffect(() => {
    let cancelled = false;
    const fetchHistory = async () => {
      if (!sourceCurrency.code || !targetCurrency.code) return;
      setLoadingHistory(true);
      try {
        const res = await getHistoricalRatesAction(
          sourceCurrency.code,
          targetCurrency.code,
          30,
          graphStartDate,
          graphEndDate
        );
        if (!cancelled && res.success) {
          setHistoricalPoints(res.points);
        } else if (!cancelled) {
          setHistoricalPoints([]);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('Failed to load currency history:', err);
          setHistoricalPoints([]);
        }
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    };
    void fetchHistory();
    return () => {
      cancelled = true;
    };
  }, [sourceCurrency.code, targetCurrency.code, graphStartDate, graphEndDate]);
  useEffect(() => {
    let cancelled = false;
    if (!selectedDate) return;
    const matched = historicalPoints.find((p) => p.date === selectedDate);
    if (matched) return;
    const fetchSingleDate = async () => {
      if (!sourceCurrency.code || !targetCurrency.code) return;
      setLoadingCustomDate(true);
      try {
        const res = await getHistoricalRatesAction(
          sourceCurrency.code,
          targetCurrency.code,
          1,
          selectedDate,
          selectedDate
        );
        if (!cancelled && res.success && res.points.length > 0) {
          setCustomDateRate(res.points[0].rate);
        } else if (!cancelled) {
          setCustomDateRate(null);
        }
      } catch {
        if (!cancelled) setCustomDateRate(null);
      } finally {
        if (!cancelled) setLoadingCustomDate(false);
      }
    };
    void fetchSingleDate();
    return () => {
      cancelled = true;
    };
  }, [selectedDate, sourceCurrency.code, targetCurrency.code, historicalPoints]);
  const numericAmount = parseFloat(amount) || 0;
  const sourceRate = rates[sourceCurrency.code] ?? DEFAULT_EXCHANGE_RATES[sourceCurrency.code] ?? 0;
  const targetRate = rates[targetCurrency.code] ?? DEFAULT_EXCHANGE_RATES[targetCurrency.code] ?? 0;
  const fallbackSpotRate = sourceRate > 0 && targetRate > 0 ? targetRate / sourceRate : 0;
  const latestHistoricalPoint = historicalPoints.length > 0 ? historicalPoints[historicalPoints.length - 1] : null;
  const matchedPoint = selectedDate ? historicalPoints.find((p) => p.date === selectedDate) : null;
  const effectiveExchangeRate = selectedDate
    ? (customDateRate ?? matchedPoint?.rate ?? fallbackSpotRate)
    : (latestHistoricalPoint?.rate ?? fallbackSpotRate);
  const inverseRate = effectiveExchangeRate > 0 ? 1 / effectiveExchangeRate : 0;
  const convertedAmount = numericAmount * effectiveExchangeRate;
  const rateDate = selectedDate
    ? (matchedPoint?.date || selectedDate)
    : (latestHistoricalPoint?.date || null);
  return {
    loading,
    error,
    srcCountry,
    setSrcCountry,
    tgtCountry,
    setTgtCountry,
    amount,
    setAmount,
    lastRefreshed,
    countryData,
    availableCountries,
    sourceCurrency,
    targetCurrency,
    numericAmount,
    exchangeRate: effectiveExchangeRate,
    inverseRate,
    convertedAmount,
    historicalPoints,
    loadingHistory,
    loadingCustomDate,
    selectedDate,
    setSelectedDate,
    rateDate,
    graphPreset,
    graphStartDate,
    graphEndDate,
    handleSelectGraphPreset,
    handleCustomGraphDates,
    handleRefresh,
    handleSwapCountries,
  };
}
