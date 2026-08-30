import { lazy, Suspense, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { MFJSONType, MFType, NavType } from '../types/types';
import InputAmount from '../components/InputAmount';
import StartEndDate from '../components/Date';
import { getNearest } from '../utilities/utility';
import { fetchAllMfs, fetchMFbySchemeCode } from '../data/api_data';
import MutualFundSelectorModal from '../components/MutualFundSelectorModal';
import { calculateSwp, calculateSwpGrowth } from '../utilities/mutualFundCalculations';
import { CHART_COLORS } from '../data/chartColors';
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
  const mfs = useMemo<MFType[]>(() => {
    if (!deferredSearchKey.trim()) {
      return [];
    }
    const allFunds: MFType[] = jsonAllData.map((fund: MFJSONType, index: number) => ({
      id: `${index}`,
      value: fund.schemeCode,
      name: fund.schemeName,
    }));
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
    const pinned = pinnedFunds
      .map((pinnedFund) => filtered.find((fund) => String(fund.value) === pinnedFund.schemeCode))
      .filter((fund): fund is MFType => Boolean(fund));
    const unpinned = searched.filter(
      (fund) => !pinnedFunds.some((pinnedFund) => pinnedFund.schemeCode === String(fund.value))
    );
    return [...pinned, ...unpinned];
  }, [jsonAllData, deferredSearchKey, selectedType, selectedGrowth, pinnedFunds]);
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
      return () => {
        cancelled = true;
      };
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
    const color = CHART_COLORS[pinnedFunds.length];
    const newPinnedFund: PinnedFund = { schemeCode, schemeName: mf.name, color };
    setPinnedFunds((previous) => [...previous, newPinnedFund]);
    setSelectedCode(schemeCode);
    try {
      const navData = await fetchMFbySchemeCode(schemeCode);
      setPinnedNavData((previous) => ({
        ...previous,
        [schemeCode]: navData,
      }));
      setSelectedCode(schemeCode);
      setJsonNavData(navData);
    } catch (err) {
      setPinnedFunds((previous) => previous.filter((fund) => fund.schemeCode !== schemeCode));
      console.error('Failed to pin mutual fund:', err);
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
      <div className="text-center w-full leading-none">
        <div className="stat-title text-xs font-semibold mb-1 max-w-full">
          <span
            className="inline-block w-2 h-2 rounded-full mr-1"
            style={{
              backgroundColor: color,
            }}
            aria-hidden="true"
          />
          <span title={title} className="inline-block fund-name max-w-full align-bottom">
            {title}
          </span>
        </div>
        {!start || !end ? (
          <div className="text-xs opacity-60 py-3">Loading NAV data...</div>
        ) : (
          <>
            <div className="flex w-full justify-around mb-1">
              <div className="text-secondary text-md ">
                <div className="stat-title font-semibold text-xs">{start.date}</div>
                <span className="text-sm">₹</span>
                {formatNav(start.nav)}
              </div>
              <div
                className={`text-md ${
                  parseFloat(end.nav) >= parseFloat(start.nav) ? 'text-success' : 'text-error'
                }`}
              >
                <div className="stat-title font-semibold text-xs">{end.date}</div>
                <span className="text-sm">₹</span>
                {formatNav(end.nav)}
              </div>
            </div>
            <div className="text-lg text-secondary font-semibold leading-none mb-1">
              <div className="stat-title text-xs">Initial Investment</div>
              {Math.round(invested).toLocaleString('en-IN')}
            </div>
            <div className="text-lg font-semibold text-primary leading-none mb-1">
              <div className="stat-title text-xs">No. of Monthly Installments</div>
              {installments}
            </div>
            <div className="text-lg font-semibold text-primary leading-none mb-1">
              <div className="stat-title text-xs">Total Withdrawal Amount</div>
              {Math.round(totalWithdrawn ?? 0).toLocaleString('en-IN')}
            </div>
            <div className="text-lg font-semibold text-primary leading-none mb-1">
              <div className="stat-title text-xs">
                Last Withdrawal {lastWithdrawalDate ?? 'N/A'}
              </div>
              {lastWithdrawalAmount === undefined
                ? 'N/A'
                : Math.round(lastWithdrawalAmount).toLocaleString('en-IN')}
            </div>
            <div className="text-lg font-semibold text-primary leading-none mb-1">
              <div className="stat-title text-xs">Value as on {end.date}</div>
              {Math.round(matureAmount).toLocaleString('en-IN')}
              <span className={`text-xs ${(xirr ?? 0) >= 0 ? 'text-success' : 'text-error'}`}>
                &nbsp;({xirr === undefined ? 'N/A' : `${(xirr * 100).toFixed(2)}%`})
              </span>
            </div>
            <div className="stat-title font-semibold mb-1">
              <span className="text-xs">Units Left: </span>
              <span className="text-primary text-sm">{units.toFixed(2)}</span>
            </div>
            <div className="stat-title font-semibold">
              <span className="text-xs">Avg. buy price: </span>
              <span className="text-primary text-md">₹{formatNav(String(averageNav))}</span>
            </div>
          </>
        )}
      </div>
    );
  };
  if (error.status === 'error' && deferredSearchKey.trim()) {
    return <h3 className="text-error">{error.message}</h3>;
  }
  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-primary btn-sm mb-2 "
          onClick={() => setIsFundSelectorOpen(true)}
        >
          Select mutual funds ({pinnedFunds.length}/8)
        </button>
        <button
          type="button"
          className="btn btn-outline btn-primary btn-sm"
          onClick={toggleViewChart}
        >
          {viewChart ? 'Hide Chart' : 'Show Chart'}
        </button>
      </div>
      <StartEndDate
        data={jsonNavData}
        startTitle="Investment Date"
        startDate={lumpsumStartDate}
        setStartDate={setLumpsumStartDate}
      />
      <InputAmount
        inputAmount={lumpSumInvestmentAmount}
        setInputAmount={setLumpSumInvestmentAmount}
        className="mb-2"
        title="Lump Sum Investment"
        stepData={[
          {
            id: 'ip1',
            value: '50000000',
            title: '5Cr',
          },
          {
            id: 'ip2',
            value: '5000000',
            title: '50L',
          },
          {
            id: 'ip3',
            value: '500000',
            title: '5L',
          },
          {
            id: 'ip4',
            value: '50000',
            title: '50K',
          },
          {
            id: 'ip5',
            value: '5000',
            title: '5K',
          },
          {
            id: 'ip6',
            value: '500',
            title: '500',
          },
          {
            id: 'ip7',
            value: '50',
            title: '50',
          },
        ]}
        typeSizePrefix="sm"
        stepSizePrefix="sm"
      />
      {jsonNavData.length > 0 && (
        <StartEndDate
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
      {viewChart &&
        (pinnedFunds.length > 0 ? (
          <Suspense
            fallback={
              <div className="h-[240px] flex items-center justify-center">
                <span className="loading loading-spinner loading-md text-primary"></span>
              </div>
            }
          >
            <Chart
              className="chart-container"
              datasets={chartDatasets}
              investmentAmount={parseFloat(monthlyWithdrawalAmount) || 0}
              dataMode="value"
            />
          </Suspense>
        ) : (
          <div className="text-center py-4 text-sm opacity-60">
            Select up to 8 funds to see comparison
          </div>
        ))}
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
      />
      <InputAmount
        inputAmount={monthlyWithdrawalAmount}
        setInputAmount={setMonthlyWithdrawalAmount}
        className="mb-2"
        title="Monthly Withdrawals"
        stepData={[
          {
            id: 'ip1',
            value: '50000000',
            title: '5Cr',
          },
          {
            id: 'ip2',
            value: '5000000',
            title: '50L',
          },
          {
            id: 'ip3',
            value: '500000',
            title: '5L',
          },
          {
            id: 'ip4',
            value: '50000',
            title: '50K',
          },
          {
            id: 'ip5',
            value: '5000',
            title: '5K',
          },
          {
            id: 'ip6',
            value: '500',
            title: '500',
          },
          {
            id: 'ip7',
            value: '50',
            title: '50',
          },
        ]}
        typeSizePrefix="sm"
        stepSizePrefix="sm"
      />
      <div className="join join-horizontal mb-3 w-full">
        <span className="join-item label bg-primary px-2 py-1 text-sm text-primary-content">
          Withdrawal on
        </span>
        <select
          className="join-item input input-sm input-primary w-full rounded-t-none"
          value={dayOfMonth}
          onChange={(event) => setDayOfMonth(event.target.value)}
        >
          {Array.from({ length: 31 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              Day {i + 1}
            </option>
          ))}
        </select>
        <span className="join-item label bg-primary px-2 py-1 text-sm text-primary-content">
          Yearly increase
        </span>
        <select
          className="join-item input input-sm input-primary w-full"
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
      {pinnedFunds.length > 0 && (
        <div className="mf-display-grid grid grid-cols-2 pb-3 w-full join join-horizontal">
          {fundAnalyses.map((fund) => (
            <div key={fund.schemeCode} className="join-item p-1 min-w-0">
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
    </>
  );
};
export default SWP;
