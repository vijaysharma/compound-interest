'use client';
import { Suspense, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { MFJSONType, MFType, NavType } from '../types/types';
import JoinedButtonGroup from '../components/JoinedButtonGroup';
import ValuePicker from '../components/ValuePicker';
import { getNearest, navDateToISO } from '../utilities/utility';
import { getTodayISO, resolveDateRange } from '../utilities/dateGuards';
import { fetchAllMfs, fetchBatchMFbySchemeCodes, fetchMFbySchemeCode } from '../data/api_data';
import MutualFundSelectorModal from '../components/MutualFundSelectorModal';
import { calculateSip, calculateSipGrowth } from '../utilities/mutualFundCalculations';
import { CHART_COLORS } from '../data/chartColors';
import { DEFAULT_AMOUNT_STEPS } from '../data/valuePickerData';
import MutualFundDetailModal, { DetailedFundItem } from '../components/MutualFundDetailModal';
import SEOHead from '../components/SEOHead';
import CalculatorContentSection from '../components/CalculatorContentSection';
import { FiBarChart2, FiPlus, FiTrendingUp } from 'react-icons/fi';
import Spinner from '../components/Spinner';
import styles from './MutualFundAnalytics.module.scss';
const liveSipSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'Mutual Fund SIP Backtest — Rupee Calculator',
      url: 'https://rupees.vercel.app/mutual-funds/sip',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'All',
      browserRequirements: 'Requires JavaScript',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
      },
    },
    {
      '@type': 'FinancialProduct',
      name: 'Mutual Fund SIP Historical Backtest & XIRR Calculator',
      description:
        'Backtests historical SIP performance, XIRR returns, units accumulation, and rupee cost averaging on live AMFI mutual fund NAV histories.',
      category: 'InvestmentAccount',
      provider: {
        '@type': 'Organization',
        name: 'Rupee Calculator',
        url: 'https://rupees.vercel.app/',
      },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://rupees.vercel.app/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Mutual Fund SIP Backtest',
          item: 'https://rupees.vercel.app/mutual-funds/sip',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is XIRR in Mutual Fund SIP performance?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Extended Internal Rate of Return (XIRR) is the true annual rate of return for multiple cashflows occurring at different dates. Since a SIP involves multiple monthly installment cash inflows, XIRR accurately measures the compounded return of your overall portfolio.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does step-up SIP backtesting work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Step-up SIP backtesting simulates annual percentage increases (e.g. 5%, 10%, 15%) in your monthly installment, reflecting real-world salary growth and showing the substantial compounding impact on unit accumulation.',
          },
        },
      ],
    },
  ],
};
const liveSipFaqs = [
  {
    question: 'Why is XIRR superior to CAGR for evaluating SIP investments?',
    answer:
      'CAGR assumes a single point-to-point lump-sum investment. In a SIP, each monthly installment has a different holding period. XIRR calculates the exact internal rate of return across all multiple periodic cash inflows.',
  },
  {
    question: 'How are NAV dates matched during market holidays or weekends?',
    answer:
      'If your scheduled SIP date falls on a stock market holiday or weekend, our engine automatically allocates units using the immediately preceding active NAV transaction date, matching AMFI regulations.',
  },
  {
    question: 'Can I backtest SIPs across different mutual fund categories?',
    answer:
      'Yes. You can search and compare index funds, large cap, flexi cap, mid cap, small cap, arbitrage, and hybrid funds across direct and regular growth options.',
  },
];
const Chart = dynamic(() => import('../components/Chart'), {
  ssr: false,
  loading: () => (
    <div className={styles.chartLoadingWrapper}>
      <Spinner size="lg" label="Loading chart..." />
    </div>
  ),
});
const STORAGE_KEY = 'mutual_fund_sip_state';
interface PinnedFund {
  schemeCode: string;
  schemeName: string;
  color: string;
}
type StoredPinnedFund = Omit<PinnedFund, 'color'>;
export interface MutualFundSelection {
  funds: PinnedFund[];
  navData: Record<string, NavType[]>;
  startDate: string | null;
  endDate: string | null;
}
interface SavedState {
  searchKey: string;
  selectedType: string;
  selectedGrowth: string;
  selectedCode: string;
  duration: string;
  monthlyAmount: string;
  showDate: boolean;
  viewChart: boolean;
  pinnedFunds: StoredPinnedFund[];
  startDate: string | null;
  endDate: string | null;
  dayOfMonth: string;
  investmentStepUp: string;
}
interface FundAnalysis {
  schemeCode: string;
  schemeName: string;
  color: string;
  startNav: NavType | undefined;
  endNav: NavType | undefined;
  profit: number;
  absProfit: number;
  matureAmt: number;
  latestValue?: number;
  latestNavDate?: string;
  latestXirr?: number;
  profitAmt: number;
  invested: number;
  units: number;
  averageNav: number;
  installments: number;
  xirr: number | undefined;
}
const getDefaultState = (): SavedState => ({
  searchKey: 'Kotak Arbitrage Fund',
  selectedType: 'Direct',
  selectedGrowth: 'Growth',
  selectedCode: '0',
  duration: '740',
  monthlyAmount: '100000',
  showDate: false,
  viewChart: true,
  pinnedFunds: [],
  startDate: null,
  endDate: null,
  dayOfMonth: '3',
  investmentStepUp: '0',
});
const loadSavedState = (): SavedState => {
  if (typeof window === 'undefined') {
    return getDefaultState();
  }
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return getDefaultState();
    }
    const parsed = JSON.parse(saved);
    const defaultState = getDefaultState();
    const pinnedFunds = Array.isArray(parsed.pinnedFunds)
      ? parsed.pinnedFunds
          .filter((fund: PinnedFund) => Boolean(fund?.schemeCode))
          .map((fund: PinnedFund) => ({
            schemeCode: String(fund.schemeCode),
            schemeName: fund.schemeName,
          }))
      : [];
    let duration = typeof parsed.duration === 'string' && parsed.duration ? parsed.duration : defaultState.duration;
    if (parseInt(duration, 10) < 20) {
      duration = '740';
    }
    let validStartDate = typeof parsed.startDate === 'string' ? parsed.startDate : null;
    let validEndDate = typeof parsed.endDate === 'string' ? parsed.endDate : null;
    if (validStartDate && validEndDate) {
      const resolved = resolveDateRange(validStartDate, validEndDate);
      validStartDate = resolved.startDate;
      validEndDate = resolved.endDate;
    }
    return {
      ...defaultState,
      ...parsed,
      duration,
      pinnedFunds: Array.from(
        new Map(pinnedFunds.map((fund: PinnedFund) => [fund.schemeCode, fund])).values()
      ).slice(0, 8),
      startDate: validStartDate,
      endDate: validEndDate,
    };
  } catch (error) {
    console.warn('Failed to restore mutual fund state:', error);
    return getDefaultState();
  }
};
const formatNav = (nav: string): string => {
  const [whole, fraction] = nav.split('.');
  return fraction ? `${whole}.${fraction.slice(0, 2)}` : whole;
};
const getNavDateTime = (date: string): number => {
  const [day, month, year] = date.split('-').map(Number);
  return Number.isFinite(day) && Number.isFinite(month) && Number.isFinite(year)
    ? new Date(year, month - 1, day).getTime()
    : Number.NaN;
};
const getLatestNav = (data: NavType[]): NavType | undefined => {
  return data.reduce<NavType | undefined>((latest, nav) => {
    const navTime = getNavDateTime(nav.date);
    return Number.isFinite(Number(nav.nav)) &&
      Number.isFinite(navTime) &&
      (!latest || navTime > getNavDateTime(latest.date))
      ? nav
      : latest;
  }, undefined);
};
const SIP = ({
  onSelectionChange,
}: {
  showDate?: boolean;
  onSelectionChange?: (selection: MutualFundSelection) => void;
}) => {
  const isLoadedRef = useRef(false);
  const defaultState = useMemo(() => getDefaultState(), []);
  const [jsonAllData, setJsonAllData] = useState<MFJSONType[]>([]);
  const [searchKey, setSearchKey] = useState<string>(defaultState.searchKey);
  const deferredSearchKey = useDeferredValue(searchKey);
  const [selectedType, setSelectedType] = useState<string>(defaultState.selectedType);
  const [selectedGrowth, setSelectedGrowth] = useState<string>(defaultState.selectedGrowth);
  const [selectedCode, setSelectedCode] = useState<string>(defaultState.selectedCode);
  const [jsonNavData, setJsonNavData] = useState<NavType[]>([]);
  const [pinnedFunds, setPinnedFunds] = useState<PinnedFund[]>([]);
  const [pinnedNavData, setPinnedNavData] = useState<Record<string, NavType[]>>({});
  const pinnedFundsRef = useRef(pinnedFunds);
  const pinnedNavDataRef = useRef(pinnedNavData);
  const selectedCodeRef = useRef(selectedCode);
  const attemptedFundsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    pinnedFundsRef.current = pinnedFunds;
    pinnedNavDataRef.current = pinnedNavData;
    selectedCodeRef.current = selectedCode;
  }, [pinnedFunds, pinnedNavData, selectedCode]);
  const [startDate, setStartDate] = useState<string | null>(defaultState.startDate);
  const [endDate, setEndDate] = useState<string | null>(defaultState.endDate);
  const [duration, setDuration] = useState<string>(defaultState.duration);
  const [showDate, setShowDate] = useState<boolean>(defaultState.showDate);
  const [monthlyAmount, setMonthlyAmount] = useState<string>(defaultState.monthlyAmount);
  const [dayOfMonth, setDayOfMonth] = useState<string>(defaultState.dayOfMonth);
  const [investmentStepUp, setInvestmentStepUp] = useState(defaultState.investmentStepUp);
  const [viewChart, setViewChart] = useState<boolean>(defaultState.viewChart);
  const [detailModalFund, setDetailModalFund] = useState<DetailedFundItem | null>(null);
  const [isFundSelectorOpen, setIsFundSelectorOpen] = useState(false);
  const [loadingSchemeCodes, setLoadingSchemeCodes] = useState<Set<string>>(new Set());
  const [isNavLoading, setIsNavLoading] = useState(false);
  const [error, setError] = useState<{
    status: string;
    message: string;
  }>({
    status: '',
    message: '',
  });
  // Restore saved state from localStorage after mount to prevent hydration mismatch
  useEffect(() => {
    const handleRestore = () => {
      try {
        const saved = loadSavedState();
        if (saved) {
          setSearchKey(saved.searchKey);
          setSelectedType(saved.selectedType);
          setSelectedGrowth(saved.selectedGrowth);
          setSelectedCode(saved.selectedCode);
          setDuration(saved.duration);
          setShowDate(saved.showDate);
          setMonthlyAmount(saved.monthlyAmount);
          setDayOfMonth(saved.dayOfMonth);
          setInvestmentStepUp(saved.investmentStepUp);
          setViewChart(saved.viewChart);
          if (saved.pinnedFunds && saved.pinnedFunds.length > 0) {
            setPinnedFunds(
              saved.pinnedFunds.map((fund, index) => ({
                ...fund,
                color: CHART_COLORS[index % CHART_COLORS.length],
              }))
            );
          }
          if (saved.startDate) setStartDate(saved.startDate);
          if (saved.endDate) setEndDate(saved.endDate);
        }
      } catch (err) {
        console.warn('Failed to restore mutual fund state:', err);
      } finally {
        isLoadedRef.current = true;
      }
    };
    const id = requestAnimationFrame(handleRestore);
    return () => cancelAnimationFrame(id);
  }, []);
  useEffect(() => {
    onSelectionChange?.({
      funds: pinnedFunds,
      navData: pinnedNavData,
      startDate,
      endDate,
    });
  }, [onSelectionChange, pinnedFunds, pinnedNavData, startDate, endDate]);
  useEffect(() => {
    if (!isLoadedRef.current || typeof window === 'undefined') {
      return;
    }
    const state: SavedState = {
      searchKey,
      selectedType,
      selectedGrowth,
      selectedCode,
      duration,
      monthlyAmount,
      showDate,
      viewChart,
      pinnedFunds: pinnedFunds
        .slice(0, 8)
        .map(({ schemeCode, schemeName }) => ({ schemeCode, schemeName })),
      startDate,
      endDate,
      dayOfMonth,
      investmentStepUp,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to persist mutual fund state:', error);
    }
  }, [
    searchKey,
    selectedType,
    selectedGrowth,
    selectedCode,
    duration,
    monthlyAmount,
    showDate,
    viewChart,
    pinnedFunds,
    startDate,
    endDate,
    dayOfMonth,
    investmentStepUp,
  ]);
  useEffect(() => {
    if (!isFundSelectorOpen) {
      return;
    }
    const search = deferredSearchKey.trim();
    if (!search) {
      return;
    }
    const controller = new AbortController();
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      fetchAllMfs(search, controller.signal)
        .then((data) => {
          if (cancelled) return;
          setJsonAllData(data);
        })
        .catch((err) => {
          if (cancelled) return;
          setError({
            status: 'error',
            message: err instanceof Error ? err.message : 'Failed to fetch mutual funds',
          });
        });
    }, 350);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [deferredSearchKey, isFundSelectorOpen]);
  const filterMfs = (funds: MFType[], filterKey: string): MFType[] => {
    let expression = filterKey;
    if (expression === 'Growth') {
      expression = 'Growth|Cumulative';
    }
    if (expression.startsWith('!')) {
      const negativeExpression = expression.substring(1);
      return funds.filter((mf) => !RegExp(negativeExpression, 'i').test(mf.name));
    }
    return funds.filter((mf) => RegExp(expression, 'i').test(mf.name));
  };
  const allFunds = useMemo<MFType[]>(() => {
    return jsonAllData.map((fund: MFJSONType, index: number) => ({
      id: `${index}`,
      value: fund.schemeCode,
      name: fund.schemeName,
    }));
  }, [jsonAllData]);
  const mfs = useMemo<MFType[]>(() => {
    if (!deferredSearchKey.trim()) {
      return [];
    }
    let filtered = filterMfs(allFunds, selectedType);
    filtered = filterMfs(filtered, selectedGrowth);
    const search = deferredSearchKey.trim();
    let searched = filtered;
    if (search) {
      const searchParts = search
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, ''))
        .filter(Boolean);
      if (searchParts.length > 0) {
        const expression = new RegExp(
          searchParts.map((part) => `(?=.*?\\b${part})`).join('') + '.*',
          'i'
        );
        searched = filtered.filter((fund) => expression.test(fund.name));
      }
    }
    return searched;
  }, [allFunds, deferredSearchKey, selectedType, selectedGrowth]);
  useEffect(() => {
    if (pinnedFunds.length === 0) {
      return;
    }
    const missingFunds = pinnedFunds.filter(
      (fund) =>
        (!pinnedNavDataRef.current[fund.schemeCode] || pinnedNavDataRef.current[fund.schemeCode].length === 0) &&
        !attemptedFundsRef.current.has(fund.schemeCode)
    );
    if (missingFunds.length === 0) {
      return;
    }
    let cancelled = false;
    const restorePinnedFunds = async () => {
      setIsNavLoading(true);
      missingFunds.forEach((f) => attemptedFundsRef.current.add(f.schemeCode));
      try {
        const codes = missingFunds.map((f) => f.schemeCode);
        const batchResults = await fetchBatchMFbySchemeCodes(codes);
        if (cancelled) return;
        setPinnedNavData((previous) => ({
          ...previous,
          ...batchResults,
        }));
        const activeCode = selectedCodeRef.current && selectedCodeRef.current !== '0' ? selectedCodeRef.current : pinnedFunds[0]?.schemeCode;
        if (activeCode && batchResults[activeCode] && batchResults[activeCode].length > 0) {
          setJsonNavData(batchResults[activeCode]);
          if (!selectedCodeRef.current || selectedCodeRef.current === '0') {
            setSelectedCode(activeCode);
          }
        }
      } catch (err) {
        console.error('Failed to restore batch NAV data:', err);
      } finally {
        if (!cancelled) {
          setIsNavLoading(false);
        }
      }
    };
    void restorePinnedFunds();
    return () => {
      cancelled = true;
    };
  }, [pinnedFunds]);
  useEffect(() => {
    if (!selectedCode || selectedCode === '0') {
      return;
    }
    const cached = pinnedNavDataRef.current[selectedCode];
    if (cached && cached.length > 0) {
      setJsonNavData(cached);
      return;
    }
    let cancelled = false;
    fetchMFbySchemeCode(selectedCode)
      .then((data) => {
        if (cancelled) {
          return;
        }
        setJsonNavData(data);
        if (pinnedFundsRef.current.some((fund) => fund.schemeCode === selectedCode)) {
          setPinnedNavData((previous) => ({
            ...previous,
            [selectedCode]: data,
          }));
        }
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }
        console.error('Failed to fetch selected mutual fund:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCode]);
  useEffect(() => {
    if (startDate && endDate) {
      return;
    }
    const navSource =
      jsonNavData.length > 0
        ? jsonNavData
        : Object.values(pinnedNavData).find((d) => Array.isArray(d) && d.length > 0);
    if (!navSource || navSource.length === 0) {
      return;
    }
    const durationDays = parseInt(duration, 10);
    const durationIndex = Math.max(Number.isFinite(durationDays) && durationDays >= 20 ? durationDays : 740, 0);
    const index = Math.min(durationIndex, navSource.length - 1);
    const start = navSource[index];
    const end = navSource[0];
    if (start && end) {
      Promise.resolve().then(() => {
        setStartDate(navDateToISO(start.date));
        setEndDate(navDateToISO(end.date));
      });
    }
  }, [jsonNavData, pinnedNavData, startDate, endDate, duration]);
  const handleDurationChange = (value: string) => {
    setDuration(value);
    const navSource =
      jsonNavData.length > 0
        ? jsonNavData
        : Object.values(pinnedNavData).find((d) => Array.isArray(d) && d.length > 0);
    if (!navSource || navSource.length === 0) {
      return;
    }
    const durationDays = parseInt(value, 10);
    const durationIndex = Math.max(Number.isFinite(durationDays) && durationDays >= 20 ? durationDays : 740, 0);
    const index = Math.min(durationIndex, navSource.length - 1);
    const start = navSource[index];
    const end = navSource[0];
    if (start) {
      setStartDate(navDateToISO(start.date));
    }
    if (end) {
      setEndDate(navDateToISO(end.date));
    }
  };
  const handleStartDateChange = (val: string | null) => {
    if (!val) {
      setStartDate(null);
      return;
    }
    setStartDate(val);
    if (endDate && val > endDate) {
      setEndDate(val);
    }
  };
  const handleEndDateChange = (val: string | null) => {
    if (!val) {
      setEndDate(null);
      return;
    }
    const today = getTodayISO();
    const safeVal = val > today ? today : val;
    setEndDate(safeVal);
    if (startDate && startDate > safeVal) {
      setStartDate(safeVal);
    }
  };
  const togglePinFund = async (mf: MFType) => {
    const schemeCode = String(mf.value);
    const existing = pinnedFunds.find((fund) => fund.schemeCode === schemeCode);
    if (existing) {
      const remaining = pinnedFunds.filter((fund) => fund.schemeCode !== schemeCode);
      setPinnedFunds(remaining);
      setPinnedNavData((previous) => {
        const next = {
          ...previous,
        };
        delete next[schemeCode];
        return next;
      });
      if (selectedCode === schemeCode) {
        const replacement = remaining[0];
        if (replacement) {
          setSelectedCode(replacement.schemeCode);
        } else {
          setSelectedCode('0');
          setJsonNavData([]);
        }
      }
      return;
    }
    if (pinnedFunds.length >= 8) {
      return;
    }
    const color = CHART_COLORS[pinnedFunds.length % CHART_COLORS.length];
    const newPinnedFund: PinnedFund = { schemeCode, schemeName: mf.name, color };
    setPinnedFunds((previous) => [...previous, newPinnedFund]);
    setSelectedCode(schemeCode);
    const existingNav = pinnedNavDataRef.current[schemeCode];
    if (existingNav && existingNav.length > 0) {
      setJsonNavData(existingNav);
      if (!startDate || !endDate) {
        const durationDays = parseInt(duration, 10);
        const durationIndex = Math.max(Number.isFinite(durationDays) && durationDays >= 20 ? durationDays : 740, 0);
        const index = Math.min(durationIndex, existingNav.length - 1);
        const start = existingNav[index];
        const end = existingNav[0];
        if (start) setStartDate(navDateToISO(start.date));
        if (end) setEndDate(navDateToISO(end.date));
      }
      return;
    }
    setLoadingSchemeCodes((previous) => new Set([...previous, schemeCode]));
    try {
      const navData = await fetchMFbySchemeCode(schemeCode);
      setPinnedNavData((previous) => ({
        ...previous,
        [schemeCode]: navData,
      }));
      setJsonNavData(navData);
      if (!startDate || !endDate) {
        const durationDays = parseInt(duration, 10);
        const durationIndex = Math.max(Number.isFinite(durationDays) && durationDays >= 20 ? durationDays : 740, 0);
        const index = Math.min(durationIndex, navData.length - 1);
        const start = navData[index];
        const end = navData[0];
        if (start) {
          setStartDate(navDateToISO(start.date));
        }
        if (end) {
          setEndDate(navDateToISO(end.date));
        }
      }
    } catch (err) {
      setPinnedFunds((previous) => previous.filter((fund) => fund.schemeCode !== schemeCode));
      console.error('Failed to pin mutual fund:', err);
    } finally {
      setLoadingSchemeCodes((previous) => {
        const next = new Set(previous);
        next.delete(schemeCode);
        return next;
      });
    }
  };
  const fundAnalyses = useMemo<FundAnalysis[]>(() => {
    return pinnedFunds.map((fund) => {
      const navData = pinnedNavData[fund.schemeCode] ?? [];
      if (navData.length === 0) {
        return {
          schemeCode: fund.schemeCode,
          schemeName: fund.schemeName,
          color: fund.color,
          startNav: undefined,
          endNav: undefined,
          profit: 0,
          absProfit: 0,
          matureAmt: 0,
          profitAmt: 0,
          invested: 0,
          units: 0,
          averageNav: 0,
          installments: 0,
          xirr: undefined,
          chartData: [],
        };
      }
      const start = startDate ? getNearest(startDate, navData) : undefined;
      const end = endDate ? getNearest(endDate, navData) : undefined;
      if (!start || !end) {
        return {
          schemeCode: fund.schemeCode,
          schemeName: fund.schemeName,
          color: fund.color,
          startNav: start,
          endNav: end,
          profit: 0,
          absProfit: 0,
          matureAmt: 0,
          profitAmt: 0,
          invested: 0,
          units: 0,
          averageNav: 0,
          installments: 0,
          xirr: undefined,
          chartData: [],
        };
      }
      const startValue = parseFloat(start.nav);
      if (!Number.isFinite(startValue) || startValue <= 0) {
        return {
          schemeCode: fund.schemeCode,
          schemeName: fund.schemeName,
          color: fund.color,
          startNav: start,
          endNav: end,
          profit: 0,
          absProfit: 0,
          matureAmt: 0,
          profitAmt: 0,
          invested: 0,
          units: 0,
          averageNav: 0,
          installments: 0,
          xirr: undefined,
          chartData: [],
        };
      }
      let simulation;
      try {
        simulation = calculateSip(
          navData,
          startDate ?? '',
          endDate ?? '',
          Number(monthlyAmount),
          Number(investmentStepUp),
          Number(dayOfMonth)
        );
      } catch {
        return {
          schemeCode: fund.schemeCode,
          schemeName: fund.schemeName,
          color: fund.color,
          startNav: start,
          endNav: end,
          profit: 0,
          absProfit: 0,
          matureAmt: 0,
          profitAmt: 0,
          invested: 0,
          units: 0,
          averageNav: 0,
          installments: 0,
          xirr: undefined,
          chartData: [],
        };
      }
      const matureAmount = simulation.currentValue;
      const latestNav = getLatestNav(navData);
      const latestValue = latestNav
        ? Number((simulation.units * Number(latestNav.nav)).toFixed(2))
        : undefined;
      const absoluteReturn =
        ((latestValue ?? simulation.currentValue) / simulation.invested - 1) * 100;
      const profitAmount = Math.round(
        (latestValue ?? simulation.currentValue) - simulation.invested
      );
      return {
        schemeCode: fund.schemeCode,
        schemeName: fund.schemeName,
        color: fund.color,
        startNav: start,
        endNav: end,
        profit: simulation.xirr ? simulation.xirr * 100 : 0,
        absProfit: absoluteReturn,
        matureAmt: Number(matureAmount.toFixed(2)),
        latestValue,
        latestNavDate: latestNav?.date,
        latestXirr: simulation.latestXirr,
        profitAmt: Number(profitAmount.toFixed(2)),
        invested: simulation.invested,
        units: simulation.units,
        averageNav: simulation.invested / simulation.units,
        installments: simulation.installments,
        xirr: simulation.xirr,
      };
    });
  }, [pinnedFunds, pinnedNavData, startDate, endDate, monthlyAmount, investmentStepUp, dayOfMonth]);
  const chartDatasets = useMemo(() => {
    if (!viewChart) {
      return [];
    }
    return pinnedFunds.map((fund) => {
      const navData = pinnedNavData[fund.schemeCode] ?? [];
      if (navData.length === 0 || !startDate || !endDate) {
        return {
          label: fund.schemeName,
          color: fund.color,
          data: [],
        };
      }
      try {
        const chartData = calculateSipGrowth(
          navData,
          startDate,
          endDate,
          Number(monthlyAmount),
          Number(investmentStepUp),
          Number(dayOfMonth)
        );
        return {
          label: fund.schemeName,
          color: fund.color,
          data: chartData,
        };
      } catch {
        return {
          label: fund.schemeName,
          color: fund.color,
          data: [],
        };
      }
    });
  }, [
    viewChart,
    pinnedFunds,
    pinnedNavData,
    startDate,
    endDate,
    monthlyAmount,
    investmentStepUp,
    dayOfMonth,
  ]);
  const toggleShowDate = () => {
    const next = !showDate;
    setShowDate(next);
  };
  const toggleViewChart = () => {
    setViewChart((previous) => !previous);
  };
  const renderStatsCard = (
    start: NavType | undefined,
    end: NavType | undefined,
    matureAmount: number,
    profitAmount: number,
    installments: number,
    invested: number,
    units: number,
    averageNav: number,
    xirr: number | undefined,
    absoluteReturn: number,
    latestValue: number | undefined,
    latestNavDate: string | undefined,
    latestXirr: number | undefined,
    title: string,
    color: string
  ) => {
    return (
      <div className={styles.statCard}>
        <div className={styles.statTitle}>
          <span
            className={styles.fundColorDot}
            ref={(el) => {
              if (el) el.style.backgroundColor = color;
            }}
            aria-hidden="true"
          />
          <span title={title} className={styles.fundName}>
            {title}
          </span>
        </div>
        {!start || !end ? (
          <div style={{ padding: '1.25rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spinner size="sm" label="Loading NAV data..." />
          </div>
        ) : (
          <>
            <div className={styles.navDatesRow}>
              <div className={styles.textSecondary}>
                <div className={styles.statTitle}>{start.date}</div>
                <span>₹</span>
                {formatNav(start.nav)}
              </div>
              <div
                className={
                  parseFloat(end.nav) >= parseFloat(start.nav) ? styles.textSuccess : styles.textError
                }
              >
                <div className={styles.statTitle}>{end.date}</div>
                <span>₹</span>
                {formatNav(end.nav)}
              </div>
            </div>
            <div className={styles.statTitle}>Invested Amount</div>
            <span className={`${styles.statValueLg} ${styles.textSecondary}`}>
              {Math.round(invested).toLocaleString('en-IN')}
            </span>
            <div className={styles.statTitle}>Value as on {end.date}</div>
            <span className={`${styles.statValueLg} ${styles.textPrimary}`}>
              {Math.round(matureAmount).toLocaleString('en-IN')}
              <span className={(xirr ?? 0) >= 0 ? styles.textSuccess : styles.textError}>
                &nbsp;({xirr === undefined ? 'N/A' : `${(xirr * 100).toFixed(2)}%`})
              </span>
            </span>
            {latestValue !== undefined && latestNavDate && (
              <>
                <div className={styles.statTitle}>Value as on ({latestNavDate})</div>
                <span className={`${styles.statValueXl} ${styles.textPrimary}`}>
                  {Math.round(latestValue).toLocaleString('en-IN')}
                </span>
              </>
            )}
            <div className={`${styles.statRow} ${profitAmount >= 0 ? styles.textSuccess : styles.textError}`}>
              {profitAmount < 0 ? '-' : '+'}
              &nbsp;₹
              {Math.abs(profitAmount).toLocaleString('en-IN')}
            </div>
            <div className={styles.statRow}>
              <span>X:</span>{' '}
              <span className={(latestXirr ?? 0) >= 0 ? styles.textSuccess : styles.textError}>
                {latestXirr === undefined ? 'N/A' : `${(latestXirr * 100).toFixed(2)}%`}
              </span>
              &nbsp;|&nbsp;
              <span>A:</span>{' '}
              <span className={absoluteReturn >= 0 ? styles.textSuccess : styles.textError}>
                {absoluteReturn.toFixed(2)}%
              </span>
            </div>
            <div className={styles.statRow}>
              <span>Insts.: </span>
              <span className={styles.textPrimary}>{installments}</span>
              &nbsp;|&nbsp;
              <span>Units: </span>
              <span className={styles.textPrimary}>{units.toFixed(2)}</span>
            </div>
            <div className={styles.statRow}>
              <span>Avg. buy price: </span>
              <span className={styles.textPrimary}>₹{formatNav(String(averageNav))}</span>
            </div>
          </>
        )}
      </div>
    );
  };
  if (error.status === 'error' && deferredSearchKey.trim()) {
    return <h3 className={styles.statErrorBanner}>{error.message}</h3>;
  }
  return (
    <main className={styles.container}>
      <SEOHead
        title="Mutual Fund SIP Backtest — XIRR & Historical NAV Calculator India 2026"
        description="Backtest historical mutual fund SIP performance, XIRR returns, units accumulation, and rupee cost averaging on live AMFI data."
        keywords="mutual fund SIP calculator, mutual fund return calculator, SIP XIRR calculator, AMFI NAV history, step up SIP backtest, XIRR calculator, SIP backtest calculator"
        canonicalPath="/mutual-funds/sip"
        schema={liveSipSchema}
      />
      <header className={styles.header}>
        <div className={styles.badge}>
          AMFI Live Feed &bull; True XIRR Backtesting
        </div>
        <h1 className={styles.title}>
          Mutual Fund SIP Historical Backtest &amp; XIRR Calculator
        </h1>
        <p className={styles.subtitle}>
          Simulate actual historical SIP returns, average purchase price, unit accumulation, and
          internal rate of return (XIRR).
        </p>
      </header>
      <div className={`${styles.analyticsGrid} ${styles.lumpsumAnalyticsGrid}`}>
        <div className={styles.controlsCol}>
          <div className={styles.actionButtonGroup}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => setIsFundSelectorOpen(true)}
            >
              Select mutual funds ({pinnedFunds.length}/8)
            </button>
            <button
              type="button"
              className={styles.outlineButton}
              onClick={toggleShowDate}
            >
              {showDate ? 'Time Slots' : 'Date Picker'}
            </button>
            <button
              type="button"
              className={`${styles.chartIconButton} ${viewChart ? styles.chartIconActive : ''}`}
              onClick={toggleViewChart}
              title={viewChart ? 'Hide Chart' : 'Show Chart'}
              aria-label={viewChart ? 'Hide Chart' : 'Show Chart'}
            >
              <FiBarChart2 />
            </button>
          </div>
          {!showDate && (
            <div>
              <JoinedButtonGroup
                data={[
                  {
                    id: 'ty1',
                    title: '1D',
                    value: '1',
                  },
                  {
                    id: 'ty2',
                    title: '3D',
                    value: '3',
                  },
                  {
                    id: 'ty3',
                    title: '1W',
                    value: '5',
                  },
                  {
                    id: 'ty4',
                    title: '2W',
                    value: '10',
                  },
                  {
                    id: 'ty5',
                    title: '3W',
                    value: '15',
                  },
                  {
                    id: 'ty6',
                    title: '1M',
                    value: '20',
                  },
                  {
                    id: 'ty7',
                    title: '5W',
                    value: '26',
                  },
                  {
                    id: 'ty8',
                    title: '6W',
                    value: '30',
                  },
                ]}
                selectedValue={duration}
                updateSelectedValue={handleDurationChange}
                btnClass="rounded-bl-none rounded-br-none border-b-0"
                sizePrefix="sm"
              />
              <JoinedButtonGroup
                data={[
                  {
                    id: 'ty9',
                    title: '2M',
                    value: '39',
                  },
                  {
                    id: 'ty10',
                    title: '3M',
                    value: '63',
                  },
                  {
                    id: 'ty11',
                    title: '4M',
                    value: '84',
                  },
                  {
                    id: 'ty12',
                    title: '5M',
                    value: '105',
                  },
                  {
                    id: 'ty13',
                    title: '6M',
                    value: '126',
                  },
                  {
                    id: 'ty14',
                    title: '1Y',
                    value: '243',
                  },
                  {
                    id: 'ty15',
                    title: '1.5Y',
                    value: '366',
                  },
                  {
                    id: 'ty16',
                    title: '2Y',
                    value: '485',
                  },
                ]}
                selectedValue={duration}
                updateSelectedValue={handleDurationChange}
                btnClass="rounded-l-none rounded-r-none border-b-0"
                sizePrefix="sm"
              />
              <JoinedButtonGroup
                data={[
                  {
                    id: 'ty18',
                    title: '3Y',
                    value: '740',
                  },
                  {
                    id: 'ty19',
                    title: '4Y',
                    value: '985',
                  },
                  {
                    id: 'ty20',
                    title: '5Y',
                    value: '1235',
                  },
                  {
                    id: 'ty21',
                    title: '6Y',
                    value: '1476',
                  },
                  {
                    id: 'ty22',
                    title: '7Y',
                    value: '1725',
                  },
                  {
                    id: 'ty23',
                    title: '10Y',
                    value: '2464',
                  },
                  {
                    id: 'ty24',
                    title: '15Y',
                    value: '3695',
                  },
                  {
                    id: 'ty25',
                    title: '20Y',
                    value: '4928',
                  },
                ]}
                selectedValue={duration}
                updateSelectedValue={handleDurationChange}
                sizePrefix="sm"
                className={styles.fieldTight}
                btnClass="rounded-tl-none rounded-tr-none"
              />
            </div>
          )}
          {showDate && jsonNavData.length > 0 && (
            <ValuePicker
              variant="date-range"
              data={jsonNavData}
              startDate={startDate}
              endDate={endDate}
              setStartDate={handleStartDateChange}
              setEndDate={handleEndDateChange}
            />
          )}
          <ValuePicker
            value={monthlyAmount}
            onChange={setMonthlyAmount}
            className={styles.fieldTight}
            title="Monthly"
            singleRow={true}
            stepData={DEFAULT_AMOUNT_STEPS}
            tabs={[]}
          />
          <div className={styles.joinRow}>
            <span className={styles.joinLabel}>
              Invested on
            </span>
            <select
              className={styles.joinSelect}
              value={dayOfMonth}
              onChange={(event) => setDayOfMonth(event.target.value)}
            >
              {Array.from({ length: 31 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Day {i + 1}
                </option>
              ))}
            </select>
            <span className={styles.joinLabel}>
              Yearly increase
            </span>
            <select
              className={styles.joinSelect}
              value={investmentStepUp}
              onChange={(event) => setInvestmentStepUp(event.target.value)}
            >
              {Array.from({ length: 21 }, (_, i) => (
                <option key={i} value={i}>
                  {i}%
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={`${styles.outputCol} ${styles.lumpsumOutputCol}`}>
          {viewChart &&
            (pinnedFunds.length > 0 ? (
              <Suspense
                fallback={
                  <div className={`${styles.chartLoadingWrapper} ${styles.lumpsumLoadingWrapper}`}>
                    <Spinner size="lg" label="Loading chart..." />
                  </div>
                }
              >
                <Chart
                  className={`${styles.chartContainer} ${styles.lumpsumChartContainer}`}
                  datasets={chartDatasets}
                  investmentAmount={parseFloat(monthlyAmount) || 0}
                  dataMode="value"
                  autoHeight
                  minHeight={280}
                  startDate={startDate}
                  endDate={endDate}
                  showPresets={false}
                  isLoading={isNavLoading}
                  loadingLabel="Loading historical NAV data..."
                  emptyMessage="Select up to 8 funds to see comparison"
                />
              </Suspense>
            ) : (
              <div className={`${styles.chartPlaceholder} ${styles.lumpsumPlaceholder}`}>
                Select up to 8 funds to see comparison
              </div>
            ))}
        </div>
      </div>
      <div className={styles.statsGrid}>
        {pinnedFunds.length > 0 ? (
          <div className={styles.mfDisplayGrid}>
            {fundAnalyses.map((fund) => (
              <div
                key={fund.schemeCode}
                className={styles.mfDisplayItem}
                onClick={() => {
                  setDetailModalFund({
                    ...fund,
                    invAmt: parseFloat(monthlyAmount) || 0,
                    startDate,
                    endDate,
                    navData: pinnedNavData[fund.schemeCode] || [],
                  });
                }}
                role="button"
                tabIndex={0}
                aria-label={`${fund.schemeName} — view detailed tax and performance analysis`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setDetailModalFund({
                      ...fund,
                      invAmt: parseFloat(monthlyAmount) || 0,
                      startDate,
                      endDate,
                      navData: pinnedNavData[fund.schemeCode] || [],
                    });
                  }
                }}
              >
                {renderStatsCard(
                  fund.startNav,
                  fund.endNav,
                  fund.matureAmt,
                  fund.profitAmt,
                  fund.installments,
                  fund.invested,
                  fund.units,
                  fund.averageNav,
                  fund.xirr,
                  fund.absProfit,
                  fund.latestValue,
                  fund.latestNavDate,
                  fund.latestXirr,
                  fund.schemeName,
                  fund.color
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyStateCard}>
            <div className={styles.emptyStateIcon}>
              <FiTrendingUp />
            </div>
            <h3 className={styles.emptyStateTitle}>Select Mutual Funds to Backtest</h3>
            <p className={styles.emptyStateDescription}>
              Compare historical SIP performance, XIRR returns, and compounding growth on live AMFI data.
            </p>
            <button
              type="button"
              className={styles.emptyStateBtn}
              onClick={() => setIsFundSelectorOpen(true)}
            >
              <FiPlus />
              <span>Add Mutual Fund</span>
            </button>
          </div>
        )}
      </div>
      <MutualFundDetailModal
        fund={detailModalFund}
        onClose={() => setDetailModalFund(null)}
      />
      <MutualFundSelectorModal
        open={isFundSelectorOpen}
        onClose={() => setIsFundSelectorOpen(false)}
        searchKey={searchKey}
        setSearchKey={setSearchKey}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        selectedGrowth={selectedGrowth}
        setSelectedGrowth={setSelectedGrowth}
        funds={mfs}
        pinnedFunds={pinnedFunds}
        togglePinFund={togglePinFund}
        loadingSchemeCodes={loadingSchemeCodes}
      />
      <CalculatorContentSection
        title="Understanding Historical SIP Backtesting & XIRR Yields"
        subtitle="Evaluating mutual funds based solely on past 1-year or 3-year trailing returns often produces inaccurate expectations. Historical SIP backtesting simulates real-world monthly investments through bull and bear market cycles."
        comparisonTable={{
          headers: ['Parameter', 'Fixed Amount SIP', 'Step-Up / Top-Up SIP', 'Lumpsum Investment'],
          rows: [
            [
              'Monthly Cash Commitment',
              'Constant monthly debit',
              'Increases 5-15% annually',
              'Single initial outflow',
            ],
            [
              'Market Timing Dependency',
              'Zero (Rupee cost averaged)',
              'Zero (Rupee cost averaged)',
              'High (Depends on entry NAV)',
            ],
            [
              'Suitability for Salaried',
              'High (Matches monthly income)',
              'Very High (Matches salary hikes)',
              'Moderate (Requires lump sum)',
            ],
            [
              '15-Year Wealth Output',
              'Baseline Corpus (1.0x)',
              'Accelerated Corpus (~1.8x to 2.2x)',
              'Market dependent',
            ],
          ],
        }}
        keyBenefits={[
          {
            title: 'Exact AMFI Historical Allotment',
            description:
              'Computes fractional unit allotment based on official daily NAV figures without rough estimations.',
          },
          {
            title: 'Average Buy Price Tracker',
            description:
              'View your exact dollar-cost / rupee-cost averaged purchase price compared to the latest market NAV.',
          },
          {
            title: 'Interactive Multi-Fund Charting',
            description:
              'Graph up to 8 mutual funds side-by-side to compare rolling volatility and momentum.',
          },
        ]}
        faqs={liveSipFaqs}
      />
    </main>
  );
};
export default SIP;
