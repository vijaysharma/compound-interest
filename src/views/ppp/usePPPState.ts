import { useState, useMemo, useEffect } from 'react';
import { CountryPPPType, ExchangeRateType } from '../../types/types';
import { fetchExchangeRates, fetchPPPData } from '../../data/api_data';
import { DEFAULT_EXCHANGE_RATES } from '../../data/default_exchange_rates';
import { getCurrencySymbol } from '../../utilities/currency';
import {
  DEFAULT_TRANSFORMED_PPP,
  transformPPPRecords,
  calculatePPP,
  calculateTargetAmount,
} from './pppUtils';
export function usePPPState() {
  const [data, setData] = useState<{ [key: string]: CountryPPPType }>(DEFAULT_TRANSFORMED_PPP);
  const [pppLoading, setPppLoading] = useState(false);
  const [pppError, setPppError] = useState<string | null>(null);
  const [srcCountry, setSrcCountry] = useState('India');
  const [tgtCountry, setTgtCountry] = useState('United States');
  const [srcAmt, setSrcAmt] = useState('10000');
  const [fetchedExData, setFetchExData] = useState<ExchangeRateType>(DEFAULT_EXCHANGE_RATES);
  const handleSwapCountries = () => {
    setSrcCountry(tgtCountry);
    setTgtCountry(srcCountry);
  };
  useEffect(() => {
    let cancelled = false;
    const loadPPPData = async () => {
      try {
        const records = await fetchPPPData();
        if (cancelled) return;
        if (records && records.length > 0) {
          const transformed = transformPPPRecords(records);
          setData(transformed);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('Failed to fetch remote PPP data, using built-in records:', err);
          setPppError('Using offline verified PPP records.');
        }
      } finally {
        if (!cancelled) setPppLoading(false);
      }
    };
    void loadPPPData();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    const loadExchangeRates = async () => {
      try {
        const fetchedData = await fetchExchangeRates();
        if (!cancelled && fetchedData && Object.keys(fetchedData).length > 0) {
          setFetchExData(fetchedData);
        }
      } catch (err) {
        console.warn('Failed to load exchange rates in PPP calculator:', err);
      }
    };
    void loadExchangeRates();
    return () => {
      cancelled = true;
    };
  }, []);
  const derivedValues = useMemo(() => {
    if (pppLoading || pppError || !data[srcCountry] || !data[tgtCountry]) return null;
    const [sourcePPP, targetPPP] = calculatePPP(srcCountry, tgtCountry, data);
    const source = data[srcCountry];
    const target = data[tgtCountry];
    const tgtAmt = calculateTargetAmount(srcAmt, sourcePPP, targetPPP);
    const sourceCurrencySymbol = getCurrencySymbol(source.currencyCode, source.currencyName);
    const targetCurrencySymbol = getCurrencySymbol(target.currencyCode, target.currencyName);
    const sAmt = parseFloat(srcAmt || '0');
    const sourceRate = fetchedExData?.[source.currencyName];
    const targetRate = fetchedExData?.[target.currencyName];
    const hasRates = Boolean(sourceRate && targetRate && sourceRate > 0 && targetRate > 0);
    const nominalForexAmt = hasRates ? (sAmt * (targetRate as number)) / (sourceRate as number) : 0;
    const tgtAmtNum = parseFloat(tgtAmt) || 0;
    const convertedToSource = hasRates
      ? (tgtAmtNum * (sourceRate as number)) / (targetRate as number)
      : 0;
    const primarySub =
      hasRates && convertedToSource > 0
        ? `(${sourceCurrencySymbol} ${convertedToSource.toLocaleString(
            source.currencyCode === 'en-IN' ? 'en-IN' : 'en-US',
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )})`
        : '';
    return {
      tgtAmt,
      tgtExAmt: nominalForexAmt,
      targetCurrencyName: target.currencyName,
      sourceCurrencyName: source.currencyName,
      targetCurrencySymbol,
      sourceCurrencySymbol,
      targetLocale: target.currencyCode,
      sourceLocale: source.currencyCode,
      primarySub,
    };
  }, [data, fetchedExData, pppError, pppLoading, srcAmt, srcCountry, tgtCountry]);
  return {
    data,
    pppLoading,
    pppError,
    srcCountry,
    setSrcCountry,
    tgtCountry,
    setTgtCountry,
    srcAmt,
    setSrcAmt,
    derivedValues,
    handleSwapCountries,
  };
}
