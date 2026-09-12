'use client';
import { lazy, Suspense, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { MFJSONType, MFType, NavType } from '../types/types';
import ValuePicker from '../components/ValuePicker';
import { getNearest } from '../utilities/utility';
import { fetchAllMfs, fetchMFbySchemeCode } from '../data/api_data';
import MutualFundSelectorModal from '../components/MutualFundSelectorModal';
import { calculateSwp, calculateSwpGrowth } from '../utilities/mutualFundCalculations';
import { CHART_COLORS } from '../data/chartColors';
import SEOHead from '../components/SEOHead';
import CalculatorContentSection from '../components/CalculatorContentSection';
import { FiBarChart2 } from 'react-icons/fi';
import styles from './MutualFundAnalytics.module.scss';
const liveSwpSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'Mutual Fund SWP Backtest — Rupee Calculator',
      url: 'https://rupees.vercel.app/mutual-funds/swp',
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
      name: 'Mutual Fund SWP Retirement Backtesting Engine India',
      description:
        'Backtests historical mutual fund Systematic Withdrawal Plans (SWP), inflation-adjusted monthly pension drawdowns, and portfolio longevity with live AMFI data.',
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
          name: 'Mutual Fund SWP Backtest',
          item: 'https://rupees.vercel.app/mutual-funds/swp',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How does historical SWP backtesting account for mutual fund market crashes?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Historical SWP backtesting uses exact daily AMFI NAV prices to simulate redemptions during market crashes (such as 2008 and 2020), revealing true sequence-of-returns risk and testing whether your portfolio could survive severe bear markets.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does step-up SWP combat retirement inflation?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Step-up SWP increases your monthly payout by a set percentage each year (e.g., 6%), matching living cost inflation while testing if your underlying mutual fund growth sustains the higher withdrawal demands.',
          },
        },
      ],
    },
  ],
};
const liveSwpFaqs = [
  {
    question: 'What is Sequence of Returns Risk in retirement SWP planning?',
    answer:
      'Sequence of Returns Risk is the risk of experiencing poor market returns in the first few years of retirement. When market NAVs crash early, more units must be liquidated to meet fixed monthly cashflows, causing permanent capital impairment unless buffered by hybrid or debt funds.',
  },
  {
    question: 'How do Hybrid / Balanced Advantage Funds help in SWP backtests?',
    answer:
      'Balanced Advantage Funds dynamically shift between equity and debt based on market valuations, limiting downside drawdowns and preventing excessive unit redemptions during market corrections.',
  },
  {
    question: 'How are capital gains taxed when redeeming units under an SWP mandate?',
    answer:
      'Each monthly SWP installment redeems a fraction of mutual fund units. Only the capital appreciation portion of the redeemed units is taxed (First-In, First-Out basis), making SWP vastly more tax-efficient than interest-bearing deposits.',
  },
];
const Chart = lazy(() => import('../components/Chart'));
const STORAGE_KEY = 'mutual_fund_swp_state';
interface PinnedFund {
  schemeCode: string;
  schemeName: string;
  color: string;
}
type StoredPinnedFund = Omit<PinnedFund, 'color'>;
export interface MutualFundSelection {
  funds: PinnedFund[];
  navData: Record<string, NavType[]>;
  startSwpDate: string | null;
  endSwpDate: string | null;
}
interface SavedState {
  searchKey: string;
  selectedType: string;
  selectedGrowth: string;
  selectedCode: string;
  monthlyWithdrawalAmount: string;
  lumpSumInvestmentAmount: string;
  viewChart: boolean;
  pinnedFunds: StoredPinnedFund[];
  startSwpDate: string | null;
  endSwpDate: string | null;
  lumpsumStartDate: string | null;
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
  totalWithdrawn?: number;
  lastWithdrawalAmount?: number;
  lastWithdrawalDate?: string;
  remainingInvested?: number;
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
  monthlyWithdrawalAmount: '100000',
  lumpSumInvestmentAmount: '30000000',
  viewChart: false,
  pinnedFunds: [],
  startSwpDate: null,
  endSwpDate: null,
  lumpsumStartDate: null,
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
    return {
      ...defaultState,
      ...parsed,
      pinnedFunds: Array.from(
        new Map(pinnedFunds.map((fund: PinnedFund) => [fund.schemeCode, fund])).values()
      ).slice(0, 8),
      startSwpDate: typeof parsed.startSwpDate === 'string' ? parsed.startSwpDate : null,
      endSwpDate: typeof parsed.endSwpDate === 'string' ? parsed.endSwpDate : null,
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
const SWP = ({
  onSelectionChange,
}: {
  onSelectionChange?: (selection: MutualFundSelection) => void;
}) => {
  const savedState = useMemo(() => loadSavedState(), []);
  const [jsonAllData, setJsonAllData] = useState<MFJSONType[]>([]);
  const [searchKey, setSearchKey] = useState<string>(savedState.searchKey);
  const deferredSearchKey = useDeferredValue(searchKey);
  const [selectedType, setSelectedType] = useState<string>(savedState.selectedType);
  const [selectedGrowth, setSelectedGrowth] = useState<string>(savedState.selectedGrowth);
  const [selectedCode, setSelectedCode] = useState<string>(savedState.selectedCode);
  const [jsonNavData, setJsonNavData] = useState<NavType[]>([]);
  const [pinnedFunds, setPinnedFunds] = useState<PinnedFund[]>(
    savedState.pinnedFunds.map((fund, index) => ({
      ...fund,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }))
  );
  const [pinnedNavData, setPinnedNavData] = useState<Record<string, NavType[]>>({});
  const pinnedFundsRef = useRef(pinnedFunds);
  const pinnedNavDataRef = useRef(pinnedNavData);
  useEffect(() => {
    pinnedFundsRef.current = pinnedFunds;
    pinnedNavDataRef.current = pinnedNavData;
  }, [pinnedFunds, pinnedNavData]);
  // Helper function to get date minus N years in YYYY-MM-DD format
  const getDateMinusYears = (years: number): string => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - years);
    return date.toISOString().split('T')[0];
  };
  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = (): string => {
    return new Date().toISOString().split('T')[0];
  };
  const [startSwpDate, setStartSwpDate] = useState<string | null>(
    savedState.startSwpDate || getDateMinusYears(3)
  );
  const [endSwpDate, setEndSwpDate] = useState<string | null>(
    savedState.endSwpDate || getTodayDate()
  );
  const [monthlyWithdrawalAmount, setMonthlyWithdrawalAmount] = useState<string>(
    savedState.monthlyWithdrawalAmount
  );
  const [lumpSumInvestmentAmount, setLumpSumInvestmentAmount] = useState<string>(
    savedState.lumpSumInvestmentAmount
  );
  const [lumpsumStartDate, setLumpsumStartDate] = useState<string | null>(
    savedState.lumpsumStartDate || getDateMinusYears(5)
  );
  const [dayOfMonth, setDayOfMonth] = useState<string>(savedState.dayOfMonth);
  const [investmentStepUp, setInvestmentStepUp] = useState(savedState.investmentStepUp);
  const [viewChart, setViewChart] = useState<boolean>(savedState.viewChart);
  const [isFundSelectorOpen, setIsFundSelectorOpen] = useState(false);
  const [loadingSchemeCodes, setLoadingSchemeCodes] = useState<Set<string>>(new Set());
  const [error, setError] = useState<{
    status: string;
    message: string;
  }>({
    status: '',
    message: '',
  });
  useEffect(() => {
    onSelectionChange?.({
      funds: pinnedFunds,
      navData: pinnedNavData,
      startSwpDate: startSwpDate,
      endSwpDate: endSwpDate,
    });
  }, [onSelectionChange, pinnedFunds, pinnedNavData, startSwpDate, endSwpDate]);
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const state: SavedState = {
      searchKey,
      selectedType,
      selectedGrowth,
      selectedCode,
      monthlyWithdrawalAmount,
      lumpSumInvestmentAmount,
      viewChart,
      pinnedFunds: pinnedFunds
        .slice(0, 8)
        .map(({ schemeCode, schemeName }) => ({ schemeCode, schemeName })),
      startSwpDate,
      endSwpDate,
      lumpsumStartDate,
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
    monthlyWithdrawalAmount,
    lumpSumInvestmentAmount,
    viewChart,
    pinnedFunds,
    startSwpDate,
    endSwpDate,
    lumpsumStartDate,
    dayOfMonth,
    investmentStepUp,
  ]);
  useEffect(() => {
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
    }, 250);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [deferredSearchKey]);
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
    let cancelled = false;
    const restorePinnedFunds = async () => {
      const results = await Promise.all(
        pinnedFunds.map(async (fund) => {
          try {
            const data = await fetchMFbySchemeCode(fund.schemeCode);
            return {
              schemeCode: fund.schemeCode,
              data,
            };
          } catch (err) {
            console.error(`Failed to restore NAV data for ${fund.schemeName}:`, err);
            return null;
          }
        })
      );
      if (cancelled) {
        return;
      }
      setPinnedNavData((previous) => {
        const next = {
          ...previous,
        };
        for (const result of results) {
          if (!result) {
            continue;
          }
          next[result.schemeCode] = result.data;
        }
        return next;
      });
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
    let cancelled = false;
    const cached = pinnedNavDataRef.current[selectedCode];
    if (cached) {
      setJsonNavData(cached);
    }
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
    setLoadingSchemeCodes((previous) => new Set([...previous, schemeCode]));
    try {
      const navData = await fetchMFbySchemeCode(schemeCode);
      setPinnedNavData((previous) => ({
        ...previous,
        [schemeCode]: navData,
      }));
      setJsonNavData(navData);
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
      const start = startSwpDate ? getNearest(startSwpDate, navData) : undefined;
      const end = endSwpDate ? getNearest(endSwpDate, navData) : undefined;
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
        simulation = calculateSwp(
          navData,
          lumpsumStartDate ?? '',
          startSwpDate ?? '',
          endSwpDate ?? '',
          Number(lumpSumInvestmentAmount),
          Number(monthlyWithdrawalAmount),
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
        simulation.withdrawn + (latestValue ?? simulation.currentValue) - simulation.invested
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
        totalWithdrawn: simulation.withdrawn,
        lastWithdrawalAmount: simulation.lastWithdrawalAmount,
        lastWithdrawalDate: simulation.lastWithdrawalDate,
        profitAmt: Number(profitAmount.toFixed(2)),
        invested: simulation.invested,
        units: simulation.units,
        averageNav:
          simulation.units > 0
            ? (simulation.remainingInvested ?? simulation.invested) / simulation.units
            : 0,
        installments: simulation.installments,
        xirr: simulation.xirr,
      };
    });
  }, [
    pinnedFunds,
    pinnedNavData,
    startSwpDate,
    endSwpDate,
    monthlyWithdrawalAmount,
    lumpSumInvestmentAmount,
    lumpsumStartDate,
    investmentStepUp,
    dayOfMonth,
  ]);
  const chartDatasets = useMemo(() => {
    if (!viewChart) {
      return [];
    }
    return pinnedFunds.map((fund) => {
      const navData = pinnedNavData[fund.schemeCode] ?? [];
      if (navData.length === 0 || !startSwpDate || !endSwpDate) {
        return {
          label: fund.schemeName,
          color: fund.color,
          data: [],
        };
      }
      try {
        const chartData = calculateSwpGrowth(
          navData,
          lumpsumStartDate ?? '',
          startSwpDate,
          endSwpDate,
          Number(lumpSumInvestmentAmount),
          Number(monthlyWithdrawalAmount),
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
    lumpsumStartDate,
    startSwpDate,
    endSwpDate,
    lumpSumInvestmentAmount,
    monthlyWithdrawalAmount,
    investmentStepUp,
    dayOfMonth,
  ]);
  const toggleViewChart = () => {
    setViewChart((previous) => !previous);
  };
  const renderStatsCard = (
    start: NavType | undefined,
    end: NavType | undefined,
    matureAmount: number,
    installments: number,
    invested: number,
    units: number,
    averageNav: number,
    xirr: number | undefined,
    totalWithdrawn: number | undefined,
    lastWithdrawalAmount: number | undefined,
    lastWithdrawalDate: string | undefined,
    title: string,
    color: string
  ) => {
    return (
      <div className={`${styles.statCard} ${styles.statCardLeadingNone}`}>
        <div className={styles.statTitle}>
          <span
            className={styles.fundColorDot}
            style={{
              backgroundColor: color,
            }}
            aria-hidden="true"
          />
          <span title={title} className={styles.fundName}>
            {title}
          </span>
        </div>
        {!start || !end ? (
          <div className={styles.statLoading}>Loading NAV data...</div>
        ) : (
          <>
            <div className={`${styles.navDatesRow} ${styles.navDatesRowSpaced}`}>
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
            <div className={`${styles.statValueLg} ${styles.textSecondary}`}>
              <div className={styles.statTitle}>Initial Investment</div>
              {Math.round(invested).toLocaleString('en-IN')}
            </div>
            <div className={`${styles.statValueLg} ${styles.textPrimary}`}>
              <div className={styles.statTitle}>No. of Monthly Installments</div>
              {installments}
            </div>
            <div className={`${styles.statValueLg} ${styles.textPrimary}`}>
              <div className={styles.statTitle}>Total Withdrawal Amount</div>
              {Math.round(totalWithdrawn ?? 0).toLocaleString('en-IN')}
            </div>
            <div className={`${styles.statValueLg} ${styles.textPrimary}`}>
              <div className={styles.statTitle}>
                Last Withdrawal {lastWithdrawalDate ?? 'N/A'}
              </div>
              {lastWithdrawalAmount === undefined
                ? 'N/A'
                : Math.round(lastWithdrawalAmount).toLocaleString('en-IN')}
            </div>
            <div className={`${styles.statValueLg} ${styles.textPrimary}`}>
              <div className={styles.statTitle}>Value as on {end.date}</div>
              {Math.round(matureAmount).toLocaleString('en-IN')}
              <span className={(xirr ?? 0) >= 0 ? styles.textSuccess : styles.textError}>
                &nbsp;({xirr === undefined ? 'N/A' : `${(xirr * 100).toFixed(2)}%`})
              </span>
            </div>
            <div className={styles.statRow}>
              <span>Units Left: </span>
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
        title="Mutual Fund SWP Backtest — Retirement Withdrawal Calculator India 2026"
        description="Backtest historical mutual fund SWP cashflows, capital longevity, monthly retirement pension drawdowns, and portfolio yields with verified AMFI daily NAVs."
        keywords="mutual fund SWP calculator, SWP backtest calculator, retirement SWP planner, AMFI NAV history, systematic withdrawal plan India, retirement pension calculator, mutual fund withdrawal planner"
        canonicalPath="/mutual-funds/swp"
        schema={liveSwpSchema}
      />
      <header className={styles.header}>
        <div className={styles.badge}>
          Retirement Engine &bull; AMFI Historical Backtest
        </div>
        <h1 className={styles.title}>
          Mutual Fund SWP Retirement Backtesting Engine
        </h1>
        <p className={styles.subtitle}>
          Backtest systematic monthly withdrawals, step-up pension payouts, and residual portfolio
          longevity using live AMFI NAV histories.
        </p>
      </header>
      <div className={styles.analyticsGrid}>
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
              className={`${styles.chartIconButton} ${viewChart ? styles.chartIconActive : ''}`}
              onClick={toggleViewChart}
              title={viewChart ? 'Hide Chart' : 'Show Chart'}
              aria-label={viewChart ? 'Hide Chart' : 'Show Chart'}
            >
              <FiBarChart2 />
            </button>
          </div>
          <ValuePicker.DateRange
            data={jsonNavData}
            startTitle="Investment Date"
            startDate={lumpsumStartDate}
            setStartDate={setLumpsumStartDate}
          />
          <ValuePicker
            value={lumpSumInvestmentAmount}
            onChange={setLumpSumInvestmentAmount}
            className={styles.fieldTight}
            title="Lump Sum Investment"
            tabs={[]}
          />
          {jsonNavData.length > 0 && (
            <ValuePicker.DateRange
              data={jsonNavData}
              startDate={startSwpDate}
              startTitle="Start SWP"
              endDate={endSwpDate}
              setStartDate={setStartSwpDate}
              setEndDate={setEndSwpDate}
              endTitle="End SWP"
              startMinDate={lumpsumStartDate ?? undefined}
            />
          )}
          <ValuePicker
            value={monthlyWithdrawalAmount}
            onChange={setMonthlyWithdrawalAmount}
            className={styles.fieldTight}
            title="Monthly Withdrawals"
            tabs={[]}
          />
          <div className={styles.joinRow}>
            <span className={styles.joinLabel}>
              Withdrawal on
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
        <div className={styles.outputCol}>
          {viewChart &&
            (pinnedFunds.length > 0 ? (
              <Suspense
                fallback={
                  <div className={styles.chartLoadingWrapper}>
                    <span className={styles.loadingSpinner}></span>
                  </div>
                }
              >
                <Chart
                  className={styles.chartContainer}
                  datasets={chartDatasets}
                  investmentAmount={parseFloat(monthlyWithdrawalAmount) || 0}
                  dataMode="value"
                />
              </Suspense>
            ) : (
              <div className={styles.chartPlaceholder}>
                Select up to 8 funds to see comparison
              </div>
            ))}
          {pinnedFunds.length > 0 && (
            <div className={styles.mfDisplayGrid}>
              {fundAnalyses.map((fund) => (
                <div key={fund.schemeCode} className={styles.mfDisplayItem}>
                  {renderStatsCard(
                    fund.startNav,
                    fund.endNav,
                    fund.matureAmt,
                    fund.installments,
                    fund.invested,
                    fund.units,
                    fund.averageNav,
                    fund.xirr,
                    fund.totalWithdrawn,
                    fund.lastWithdrawalAmount,
                    fund.lastWithdrawalDate,
                    fund.schemeName,
                    fund.color
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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
        title="Testing Real-World Retirement Resilience with SWP Backtests"
        subtitle="Simulating Systematic Withdrawal Plans against real historical mutual fund data exposes your retirement portfolio to actual historical market drawdowns, inflation cycles, and recovery periods."
        comparisonTable={{
          headers: ['Feature', 'Historical SWP Backtest', 'Static Calculator', 'Insurance Annuity'],
          rows: [
            [
              'Market Volatility Impact',
              'True daily NAV swings captured',
              'Assumes smooth constant CAGR',
              'Zero market link (Fixed rate)',
            ],
            [
              'Sequence of Returns Risk',
              'Fully backtested through crises',
              'Ignored / Overlooked',
              'Not applicable',
            ],
            [
              'Real Inflation Test',
              'Tests Step-Up vs. Real NAVs',
              'Rough mathematical guess',
              'Loses value to inflation',
            ],
          ],
        }}
        keyBenefits={[
          {
            title: 'Exact AMFI Historical Pricing',
            description:
              'Simulate the exact day-by-day unit redemption dynamics during real Indian market bull and bear cycles.',
          },
          {
            title: 'Capital Longevity Stress Testing',
            description:
              'Determine whether a 4%, 5%, or 6% initial withdrawal rate survives major market corrections.',
          },
          {
            title: 'Tax-Efficient Drawdown Insights',
            description:
              'Evaluate remaining capital gains vs. principal return under Indian LTCG rules.',
          },
        ]}
        faqs={liveSwpFaqs}
      />
    </main>
  );
};
export default SWP;
