import { useState, useEffect, useMemo, useCallback } from 'react';
import type { NavType } from '../../types/types';
import { fetchMFWithMeta, MFMetaType } from '../../data/api_data';
import { isoDateToNavDate, navDateToISO } from '../../utilities/utility';
import { getTodayISO, resolveDateRange } from '../../utilities/dateGuards';
import type { DetailedFundItem, InvestmentType, TaxMode, FundModalState } from './types';
import { parseDateParts, getPresetStartDateISO, getFundCategory } from './utils';
export function useFundDetailState(fund: DetailedFundItem | null): FundModalState & {
  navData: NavType[];
} {
  const [meta, setMeta] = useState<MFMetaType | null>(null);
  const [investmentType, setInvestmentType] = useState<InvestmentType>('lumpsum');
  const [taxMode, setTaxMode] = useState<TaxMode>('auto');
  const [fetchedNavData, setFetchedNavData] = useState<NavType[]>([]);
  const [prevSchemeCode, setPrevSchemeCode] = useState<string | undefined>(fund?.schemeCode);
  const [customStartDateISO, setCustomStartDateISO] = useState<string | null>(null);
  const [customEndDateISO, setCustomEndDateISO] = useState<string | null>(null);
  const [customInvestmentValue, setCustomInvestmentValue] = useState<string | null>(null);
  const [, setActivePreset] = useState<string | null>(null);
  if (fund?.schemeCode !== prevSchemeCode) {
    setPrevSchemeCode(fund?.schemeCode);
    setCustomStartDateISO(null);
    setCustomEndDateISO(null);
    setCustomInvestmentValue(null);
    setActivePreset(null);
    setFetchedNavData([]);
  }
  const navData = fund?.navData && fund.navData.length > 0 ? fund.navData : fetchedNavData;
  const { minNavDateISO, maxNavDateISO } = useMemo(() => {
    if (!navData || navData.length === 0) return { minNavDateISO: '', maxNavDateISO: '' };
    const sorted = [...navData].sort((a, b) => parseDateParts(a.date) - parseDateParts(b.date));
    return {
      minNavDateISO: navDateToISO(sorted[0].date),
      maxNavDateISO: navDateToISO(sorted[sorted.length - 1].date),
    };
  }, [navData]);
  useEffect(() => {
    if (!fund?.schemeCode || typeof window === 'undefined') return;
    const raw = window.localStorage.getItem('mf_modal_state_' + fund.schemeCode);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (parsed.investmentType) setInvestmentType(parsed.investmentType);
      if (parsed.customInvestmentValue) setCustomInvestmentValue(parsed.customInvestmentValue);
      if (parsed.taxMode) setTaxMode(parsed.taxMode);
      if (parsed.customStartDateISO) setCustomStartDateISO(parsed.customStartDateISO);
      if (parsed.customEndDateISO) setCustomEndDateISO(parsed.customEndDateISO);
      if (parsed.activePreset) setActivePreset(parsed.activePreset);
    } catch {
      // Ignore read errors
    }
  }, [fund?.schemeCode]);
  useEffect(() => {
    if (!fund?.schemeCode || typeof window === 'undefined') return;
    try {
      const payload = { investmentType, customInvestmentValue, taxMode, customStartDateISO, customEndDateISO };
      window.localStorage.setItem('mf_modal_state_' + fund.schemeCode, JSON.stringify(payload));
    } catch {
      // Ignore write errors
    }
  }, [fund?.schemeCode, investmentType, customInvestmentValue, taxMode, customStartDateISO, customEndDateISO]);
  useEffect(() => {
    if (!fund?.schemeCode) return;
    let active = true;
    fetchMFWithMeta(fund.schemeCode)
      .then((res) => {
        if (active && res.meta) setMeta(res.meta);
        if (active && res.data && res.data.length > 0) setFetchedNavData(res.data);
      })
      .catch((err) => console.warn('Failed to fetch MF metadata:', err));
    return () => { active = false; };
  }, [fund?.schemeCode]);
  const defaultDates = useMemo(() => resolveDateRange(null, null), []);
  const rawStart = customStartDateISO ?? fund?.startDate ?? minNavDateISO ?? defaultDates.startDate;
  const rawEnd = customEndDateISO ?? fund?.endDate ?? maxNavDateISO ?? defaultDates.endDate;
  const { startDate: startDateISO, endDate: endDateISO } = useMemo(
    () => resolveDateRange(rawStart, rawEnd),
    [rawStart, rawEnd]
  );
  const investmentValue = customInvestmentValue ?? String(fund && fund.invAmt > 0 ? fund.invAmt : 100000);
  const setStartDateISO = useCallback((val: string) => {
    let nextEnd = endDateISO;
    if (nextEnd && val > nextEnd) {
      nextEnd = val;
      setCustomEndDateISO(nextEnd);
    }
    setCustomStartDateISO(val);
    setActivePreset(null);
  }, [endDateISO]);
  const setEndDateISO = useCallback((val: string) => {
    const today = getTodayISO();
    const nextEnd = val > today ? today : val;
    let nextStart = startDateISO;
    if (nextStart && nextEnd < nextStart) {
      nextStart = nextEnd;
      setCustomStartDateISO(nextStart);
    }
    setCustomEndDateISO(nextEnd);
    setActivePreset(null);
  }, [startDateISO]);
  const handleSelectPreset = useCallback((preset: string) => {
    if (!maxNavDateISO || !minNavDateISO) return;
    const newStart = getPresetStartDateISO(preset, maxNavDateISO, minNavDateISO);
    setCustomStartDateISO(newStart);
    setCustomEndDateISO(maxNavDateISO);
    setActivePreset(preset);
  }, [maxNavDateISO, minNavDateISO]);
  const currentNavStartDate = useMemo(() => isoDateToNavDate(startDateISO), [startDateISO]);
  const currentNavEndDate = useMemo(() => isoDateToNavDate(endDateISO), [endDateISO]);
  const holdingDays = useMemo(() => {
    if (!startDateISO || !endDateISO) return 365;
    const sTime = new Date(startDateISO).getTime();
    const eTime = new Date(endDateISO).getTime();
    return Math.max(1, Math.round(Math.abs(eTime - sTime) / (1000 * 60 * 60 * 24)));
  }, [startDateISO, endDateISO]);
  const holdingYears = Math.max(0.08, Number((holdingDays / 365.25).toFixed(2)));
  const isLongTerm = holdingDays > 365;
  const fundCategory = useMemo(() => getFundCategory(meta?.scheme_category, fund?.schemeName), [meta?.scheme_category, fund?.schemeName]);
  return {
    meta,
    navData,
    investmentType,
    setInvestmentType,
    taxMode,
    setTaxMode,
    startDateISO,
    endDateISO,
    setStartDateISO,
    setEndDateISO,
    minNavDateISO,
    maxNavDateISO,
    investmentValue,
    setInvestmentValue: setCustomInvestmentValue,
    currentNavStartDate,
    currentNavEndDate,
    handleSelectPreset,
    holdingDays,
    holdingYears,
    isLongTerm,
    fundCategory,
  };
}
