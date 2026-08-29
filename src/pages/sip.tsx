import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { MFJSONType, MFType, NavType } from '../types/types';
import JoinedButtonGroup from '../components/JoinedButtonGroup';
import InputAmount from '../components/InputAmount';
import StartEndDate from '../components/Date';
import { getNearest, navDateToISO } from '../utilities/utility';
import { fetchAllMfs, fetchMFbySchemeCode } from '../data/api_data';
import Chart from '../components/Chart';
import MutualFundSelectorModal from '../components/MutualFundSelectorModal';
import { calculateSip, calculateSipGrowth } from '../utilities/mutualFundCalculations';
import { CHART_COLORS } from '../data/chartColors';
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
  chartData: {
    date: string;
    nav: number;
  }[];
}
const getDefaultState = (): SavedState => ({
  searchKey: 'Kotak Arbitrage Fund',
  selectedType: 'Direct',
  selectedGrowth: 'Growth',
  selectedCode: '0',
  duration: '1',
  monthlyAmount: '100000',
  showDate: false,
  viewChart: false,
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
    return {
      ...defaultState,
      ...parsed,
      pinnedFunds: Array.from(
        new Map(pinnedFunds.map((fund: PinnedFund) => [fund.schemeCode, fund])).values()
      ).slice(0, 8),
      startDate: typeof parsed.startDate === 'string' ? parsed.startDate : null,
      endDate: typeof parsed.endDate === 'string' ? parsed.endDate : null,
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
  const [startDate, setStartDate] = useState<string | null>(savedState.startDate);
  const [endDate, setEndDate] = useState<string | null>(savedState.endDate);
  const [duration, setDuration] = useState<string>(savedState.duration);
  const [showDate, setShowDate] = useState<boolean>(savedState.showDate);
  const [monthlyAmount, setMonthlyAmount] = useState<string>(savedState.monthlyAmount);
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
      startDate,
      endDate,
    });
  }, [onSelectionChange, pinnedFunds, pinnedNavData, startDate, endDate]);
  useEffect(() => {
    if (typeof window === 'undefined') {
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
    const search = deferredSearchKey.trim();
    if (!search) {
      return;
    }
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      fetchAllMfs(search)
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
  useEffect(() => {
    if (jsonNavData.length === 0 || startDate || endDate) {
      return;
    }
    const durationIndex = Math.max(parseInt(duration, 10) || 1, 0);
    const index = Math.min(durationIndex, jsonNavData.length - 1);
    const start = jsonNavData[index];
    const end = jsonNavData[0];
    Promise.resolve().then(() => {
      if (start) {
        setStartDate(navDateToISO(start.date));
      }
      if (end) {
        setEndDate(navDateToISO(end.date));
      }
    });
  }, [jsonNavData, startDate, endDate, duration]);
  const handleDurationChange = (value: string) => {
    setDuration(value);
    if (jsonNavData.length === 0) {
      return;
    }
    const durationIndex = Math.max(parseInt(value, 10) || 1, 0);
    const index = Math.min(durationIndex, jsonNavData.length - 1);
    const start = jsonNavData[index];
    const end = jsonNavData[0];
    if (start) {
      setStartDate(navDateToISO(start.date));
    }
    if (end) {
      setEndDate(navDateToISO(end.date));
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
    try {
      const navData = await fetchMFbySchemeCode(schemeCode);
      const color = CHART_COLORS[pinnedFunds.length];
      const newPinnedFund: PinnedFund = {
        schemeCode,
        schemeName: mf.name,
        color,
      };
      setPinnedFunds((previous) => [...previous, newPinnedFund]);
      setPinnedNavData((previous) => ({
        ...previous,
        [schemeCode]: navData,
      }));
      setSelectedCode(schemeCode);
      setJsonNavData(navData);
      if (!startDate || !endDate) {
        const durationIndex = Math.max(parseInt(duration, 10) || 1, 0);
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
      const chartData = calculateSipGrowth(
        navData,
        startDate ?? '',
        endDate ?? '',
        Number(monthlyAmount),
        Number(investmentStepUp),
        Number(dayOfMonth)
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
        chartData,
      };
    });
  }, [pinnedFunds, pinnedNavData, startDate, endDate, monthlyAmount, investmentStepUp, dayOfMonth]);
  const chartDatasets = useMemo(
    () =>
      fundAnalyses
        .filter((fund) => fund.chartData.length > 0)
        .map((fund) => ({
          label: fund.schemeName,
          color: fund.color,
          data: fund.chartData,
        })),
    [fundAnalyses]
  );
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
      <div className="flex flex-col items-center text-center w-full">
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
            <div className="flex gap-3">
              <div className="text-secondary text-md">
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
            <div className="stat-title text-xs">Invested Amount</div>
            <span className="text-lg text-secondary font-semibold">
              {Math.round(invested).toLocaleString('en-IN')}
            </span>
            <div className="stat-title text-xs">Value as on {end.date}</div>
            <span className="text-lg font-semibold text-primary">
              {Math.round(matureAmount).toLocaleString('en-IN')}
              <span className={`text-xs ${(xirr ?? 0) >= 0 ? 'text-success' : 'text-error'}`}>
                &nbsp;({xirr === undefined ? 'N/A' : `${(xirr * 100).toFixed(2)}%`})
              </span>
            </span>
            {latestValue !== undefined && latestNavDate && (
              <>
                <div className="stat-title text-xs">Value as on ({latestNavDate})</div>
                <span className="text-xl font-semibold text-primary">
                  {Math.round(latestValue).toLocaleString('en-IN')}
                </span>
              </>
            )}
            <div className={`font-semibold ${profitAmount >= 0 ? 'text-success' : 'text-error'}`}>
              {profitAmount < 0 ? '-' : '+'}
              &nbsp;₹
              {Math.abs(profitAmount).toLocaleString('en-IN')}
            </div>
            <div className="stat-title font-semibold">
              <span className="text-xs">X:</span>{' '}
              <span className={(latestXirr ?? 0) >= 0 ? 'text-success' : 'text-error'}>
                {latestXirr === undefined ? 'N/A' : `${(latestXirr * 100).toFixed(2)}%`}
              </span>
              &nbsp;|&nbsp;
              <span className="text-xs">A:</span>{' '}
              <span className={absoluteReturn >= 0 ? 'text-success' : 'text-error'}>
                {absoluteReturn.toFixed(2)}%
              </span>
            </div>
            <div className="stat-title font-semibold">
              <span className="text-xs">Insts.: </span>
              <span className="text-primary text-sm">{installments}</span>
              &nbsp;|&nbsp;
              <span className="text-xs">Units: </span>
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
    <div>
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
          onClick={toggleShowDate}
        >
          {showDate ? 'Time Slots' : 'Date Picker'}
        </button>
        <button
          type="button"
          className="btn btn-outline btn-primary btn-sm"
          onClick={toggleViewChart}
        >
          {viewChart ? 'Hide Chart' : 'Show Chart'}
        </button>
      </div>
      {!showDate && (
        <>
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
            className="mb-2"
            btnClass="rounded-tl-none rounded-tr-none"
          />
        </>
      )}
      {showDate && jsonNavData.length > 0 && (
        <StartEndDate
          data={jsonNavData}
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
        />
      )}
      {viewChart &&
        (pinnedFunds.length > 0 ? (
          <Chart
            className="chart-container"
            datasets={chartDatasets}
            investmentAmount={parseFloat(monthlyAmount) || 0}
            dataMode="value"
          />
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
        inputAmount={monthlyAmount}
        setInputAmount={setMonthlyAmount}
        className="mb-2"
        title="Monthly"
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
          Invested on
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
            <option key={i + 1} value={i + 1}>
              {i}%
            </option>
          ))}
        </select>
      </div>
      {pinnedFunds.length > 0 && (
        <div className="mf-display-grid grid grid-cols-2 w-full join join-horizontal">
          {fundAnalyses.map((fund) => (
            <div key={fund.schemeCode} className="join-item p-1 min-w-0">
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
      )}
    </div>
  );
};
export default SIP;
