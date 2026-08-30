import { lazy, Suspense, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { MFJSONType, MFType, NavType } from '../types/types';
import JoinedButtonGroup from '../components/JoinedButtonGroup';
import InputAmount from '../components/InputAmount';
import StartEndDate from '../components/Date';
import { getDuration, getNearest, navDateToISO } from '../utilities/utility';
import { fetchAllMfs, fetchMFbySchemeCode } from '../data/api_data';
import MutualFundSelectorModal from '../components/MutualFundSelectorModal';
import { CHART_COLORS } from '../data/chartColors';
const Chart = lazy(() => import('../components/Chart'));
const STORAGE_KEY = 'mutual_fund_lumpsum_state';
interface PinnedFund {
  schemeCode: string;
  schemeName: string;
  color: string;
}
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
  invAmt: string;
  showDate: boolean;
  viewChart: boolean;
  pinnedFunds: PinnedFund[];
  startDate: string | null;
  endDate: string | null;
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
  profitAmt: number;
}
const getDefaultState = (): SavedState => ({
  searchKey: 'Kotak Arbitrage Fund',
  selectedType: 'Direct',
  selectedGrowth: 'Growth',
  selectedCode: '0',
  duration: '1',
  invAmt: '100000',
  showDate: false,
  viewChart: false,
  pinnedFunds: [],
  startDate: null,
  endDate: null,
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
      ? parsed.pinnedFunds.filter((fund: PinnedFund) => Boolean(fund?.schemeCode))
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
const getNavDateTime = (date: string): number => {
  const parts = date.split('-');
  if (parts.length !== 3) {
    return Number.NaN;
  }
  const day = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const year = Number(parts[2]);
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
    return Number.NaN;
  }
  return new Date(year, month, day).getTime();
};
const Lumpsum = ({
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
  const [pinnedFunds, setPinnedFunds] = useState<PinnedFund[]>(savedState.pinnedFunds);
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
  const [invAmt, setInvAmt] = useState<string>(savedState.invAmt);
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
      invAmt,
      showDate,
      viewChart,
      pinnedFunds: pinnedFunds.slice(0, 8),
      startDate,
      endDate,
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
    invAmt,
    showDate,
    viewChart,
    pinnedFunds,
    startDate,
    endDate,
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
    /*
     * Fetch latest data.
     */
    fetchMFbySchemeCode(selectedCode)
      .then((data) => {
        if (cancelled) {
          return;
        }
        setJsonNavData(data);
        /*
         * Update ONLY this fund's cache.
         */
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
  /*
   * ==========================================================
   * INITIAL DATE RANGE
   * ==========================================================
   */
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
  /*
   * ==========================================================
   * DURATION BUTTON
   * ==========================================================
   */
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
  /*
   * ==========================================================
   * PIN / UNPIN
   * ==========================================================
   */
  const togglePinFund = async (mf: MFType) => {
    const schemeCode = String(mf.value);
    const existing = pinnedFunds.find((fund) => fund.schemeCode === schemeCode);
    /*
     * ======================================================
     * UNPIN
     * ======================================================
     */
    if (existing) {
      const remaining = pinnedFunds.filter((fund) => fund.schemeCode !== schemeCode);
      setPinnedFunds(remaining);
      /*
       * Remove ONLY this fund's cache.
       */
      setPinnedNavData((previous) => {
        const next = {
          ...previous,
        };
        delete next[schemeCode];
        return next;
      });
      /*
       * If active, move to another pinned fund.
       */
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
          chartData: [],
        };
      }
      /*
       * Resolve global dates against
       * this fund's individual NAV data.
       */
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
          chartData: [],
        };
      }
      const startValue = parseFloat(start.nav);
      const endValue = parseFloat(end.nav);
      const investment = parseFloat(invAmt) || 0;
      /*
       * Invalid NAV.
       */
      if (!Number.isFinite(startValue) || !Number.isFinite(endValue) || startValue <= 0) {
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
          chartData: [],
        };
      }
      /*
       * Duration.
       */
      const durationYears = Math.max(
        getDuration({
          startDate: start.date,
          endDate: end.date,
        }),
        1 / 365
      );
      /*
       * CAGR.
       */
      const cagr = (endValue / startValue) ** (1 / durationYears) - 1;
      /*
       * Absolute return.
       */
      const absoluteReturn = ((endValue - startValue) / startValue) * 100;
      /*
       * Investment value.
       */
      const matureAmount = (investment / startValue) * endValue;
      const profitAmount = matureAmount - investment;
      return {
        schemeCode: fund.schemeCode,
        schemeName: fund.schemeName,
        color: fund.color,
        startNav: start,
        endNav: end,
        profit: cagr * 100,
        absProfit: absoluteReturn,
        matureAmt: Number(matureAmount.toFixed(2)),
        profitAmt: Number(profitAmount.toFixed(2)),
      };
    });
  }, [pinnedFunds, pinnedNavData, startDate, endDate, invAmt]);
  /*
   * ==========================================================
   * CHART DATASETS
   * ==========================================================
   */
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
      const start = getNearest(startDate, navData);
      const end = getNearest(endDate, navData);
      if (!start || !end) {
        return {
          label: fund.schemeName,
          color: fund.color,
          data: [],
        };
      }
      const startTime = getNavDateTime(start.date);
      const endTime = getNavDateTime(end.date);
      const lowerTime = Math.min(startTime, endTime);
      const upperTime = Math.max(startTime, endTime);
      const chartData = navData
        .map((nav) => ({
          date: nav.date,
          nav: parseFloat(nav.nav),
          time: getNavDateTime(nav.date),
        }))
        .filter(
          (point) =>
            Number.isFinite(point.nav) &&
            Number.isFinite(point.time) &&
            point.time >= lowerTime &&
            point.time <= upperTime
        )
        .sort((a, b) => a.time - b.time)
        .map(({ date, nav }) => ({
          date,
          nav,
        }));
      return {
        label: fund.schemeName,
        color: fund.color,
        data: chartData,
      };
    });
  }, [viewChart, pinnedFunds, pinnedNavData, startDate, endDate]);
  /*
   * ==========================================================
   * SHOW DATE / TIME SLOTS
   * ==========================================================
   */
  const toggleShowDate = () => {
    const next = !showDate;
    setShowDate(next);
  };
  /*
   * ==========================================================
   * CHART / LIST
   * ==========================================================
   */
  const toggleViewChart = () => {
    setViewChart((previous) => !previous);
  };
  /*
   * ==========================================================
   * STATS CARD
   * ==========================================================
   */
  const renderStatsCard = (
    start: NavType | undefined,
    end: NavType | undefined,
    matureAmount: number,
    profitAmount: number,
    cagr: number,
    absoluteReturn: number,
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
                {parseFloat(start.nav).toFixed(2)}
              </div>
              <div
                className={`text-md ${
                  parseFloat(end.nav) >= parseFloat(start.nav) ? 'text-success' : 'text-error'
                }`}
              >
                <div className="stat-title font-semibold text-xs">{end.date}</div>
                <span className="text-sm">₹</span>
                {parseFloat(end.nav).toFixed(2)}
              </div>
            </div>
            <div className="stat-title text-xs">Final Amount</div>
            <span className="text-xl text-primary font-semibold">
              ₹ {Math.round(matureAmount).toLocaleString('en-IN')}
            </span>
            <div className={`font-semibold ${profitAmount >= 0 ? 'text-success' : 'text-error'}`}>
              {profitAmount < 0 ? '-' : '+'}
              &nbsp;₹
              {Math.round(profitAmount).toLocaleString('en-IN')}
            </div>
            <div className="stat-title font-semibold text-sm">
              <span className="text-xs">C:</span>{' '}
              <span className={cagr >= 0 ? 'text-success' : 'text-error'}>{cagr.toFixed(2)}%</span>
              &nbsp;|&nbsp;
              <span className="text-xs">A:</span>{' '}
              <span className={absoluteReturn >= 0 ? 'text-success' : 'text-error'}>
                {absoluteReturn.toFixed(2)}%
              </span>
            </div>
          </>
        )}
      </div>
    );
  };
  /*
   * ==========================================================
   * ERROR
   * ==========================================================
   */
  if (error.status === 'error' && deferredSearchKey.trim()) {
    return <h3 className="text-error">{error.message}</h3>;
  }
  /*
   * ==========================================================
   * RENDER
   * ==========================================================
   */
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
      {/*
       * ======================================================
       * TIME SLOTS
       * ======================================================
       */}
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
      {/*
       * ======================================================
       * CUSTOM DATE PICKER
       * ======================================================
       */}
      {showDate && jsonNavData.length > 0 && (
        <StartEndDate
          data={jsonNavData}
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
        />
      )}
      {/*
       * ======================================================
       * FUND LIST / CHART
       * ======================================================
       */}
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
              investmentAmount={parseFloat(invAmt) || 0}
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
      {/*
       * ======================================================
       * INVESTMENT AMOUNT
       * ======================================================
       */}
      <InputAmount
        inputAmount={invAmt}
        setInputAmount={setInvAmt}
        className="mb-2"
        title="Invested"
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
      {/*
       * ======================================================
       * STATS
       *
       * EXACTLY TWO CARDS PER ROW.
       *
       * 1  2
       * 3  4
       * ======================================================
       */}
      {pinnedFunds.length > 0 && (
        <div className="mf-display-grid grid grid-cols-2 w-full join join-horizontal">
          {fundAnalyses.map((fund) => (
            <div key={fund.schemeCode} className="join-item p-1 min-w-0">
              {renderStatsCard(
                fund.startNav,
                fund.endNav,
                fund.matureAmt,
                fund.profitAmt,
                fund.profit,
                fund.absProfit,
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
export default Lumpsum;
