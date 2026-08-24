import { SetStateAction, useDeferredValue, useEffect, useState } from "react";
import { MFJSONType, MFType, NavType } from "../types/types";
import JoinedButtonGroup from "../components/JoinedButtonGroup";
import InputAmount from "../components/InputAmount";
import { getDuration } from "../utilities/utility";
import Chart from "./chart";
import { getStyleVariable, lch_to_rgba } from "../utilities/color-util";
import StartEndDate from "../components/Date";
import { fetchAllMfs, fetchMFbySchemeCode } from "../data/api_data";

// Storage key for localStorage
const STORAGE_KEY = "mutual_fund_last_state";

interface SavedState {
  searchKey: string;
  selectedType: string;
  selectedGrowth: string;
  selectedCode: string;
  duration: string;
  invAmt: string;
  showDate: boolean;
  viewChart: boolean;
  savedStartNav: NavType | null;
  savedEndNav: NavType | null;
}

const getDefaultState = (): SavedState => ({
  searchKey: "Kotak Arbitrage Fund",
  selectedType: "Direct",
  selectedGrowth: "Growth",
  selectedCode: "0",
  duration: "1",
  invAmt: "100000",
  showDate: false,
  viewChart: false,
  savedStartNav: null,
  savedEndNav: null,
});

const loadSavedState = (): SavedState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...getDefaultState(), ...parsed };
    }
  } catch (e) {
    console.warn("Failed to load saved MF state:", e);
  }
  return getDefaultState();
};

const MutualFund = ({
  showDate: propShowDate,
  setShowDate: propSetShowDate,
}: {
  showDate?: boolean;
  setShowDate: React.Dispatch<SetStateAction<boolean>>;
}) => {
  const savedState = loadSavedState();

  const [jsonAllData, setJsonAllData] = useState<MFJSONType[]>([]);
  const [jsonData, setJsonData] = useState<MFJSONType[]>([]);
  const [jsonNavData, setJsonNavData] = useState<NavType[]>([]);
  const [mfs, setMfs] = useState<MFType[]>([]);

  // Search and filters
  const [searchKey, setSearchKey] = useState<string>(savedState.searchKey);
  const deferredSearchKey = useDeferredValue(searchKey);
  const [selectedType, setSelectedType] = useState(savedState.selectedType);
  const [selectedGrowth, setSelectedGrowth] = useState(savedState.selectedGrowth);

  // Selected fund
  const [selectedCode, setSelectedCode] = useState(savedState.selectedCode);
  const [selectedMF, setSelectedMF] = useState("");

  // UI state
  const [viewChart, setViewChart] = useState(savedState.viewChart);
  const [showDate, setShowDate] = useState(savedState.showDate);

  // Duration (for time slots)
  const [duration, setDuration] = useState(savedState.duration);

  // NAV data
  const [startNav, setStartNav] = useState<NavType | undefined>(
    savedState.savedStartNav || undefined
  );
  const [endNav, setEndNav] = useState<NavType | undefined>(savedState.savedEndNav || undefined);

  // Calculations
  const [profit, setProfit] = useState(0);
  const [absProfit, setAbsProfit] = useState(0);
  const [invAmt, setInvAmt] = useState(savedState.invAmt);
  const [matureAmt, setMatureAmt] = useState(0);
  const [profitAmt, setProfitAmt] = useState(0);
  const [chartData, setChartData] = useState<{ date: string; nav: number }[]>([]);
  const [chartLineColor, setChartLineColor] = useState("black");
  const [error, setError] = useState({ status: "", message: "" });

  // Flag to track if we've restored from saved state
  const [isRestored, setIsRestored] = useState(false);

  // Save state to localStorage
  useEffect(() => {
    const stateToSave: SavedState = {
      searchKey,
      selectedType,
      selectedGrowth,
      selectedCode,
      duration,
      invAmt,
      showDate,
      viewChart,
      savedStartNav: startNav || null,
      savedEndNav: endNav || null,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn("Failed to save MF state:", e);
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
    startNav,
    endNav,
  ]);

  const filterMfs = (mfs: MFType[], filterKey: string) => {
    if (filterKey === "Growth") filterKey = "Growth|Cumulative";
    if (filterKey[0] === "!") {
      filterKey = filterKey.substring(1, filterKey.length);
      return mfs.filter((mf) => !RegExp(filterKey, "i").test(mf.name));
    }
    return mfs.filter((mf) => RegExp(filterKey, "i").test(mf.name));
  };

  // Fetch all MF data on mount
  useEffect(() => {
    fetchAllMfs()
      .then((d) => setJsonAllData(d))
      .catch((err) => {
        setError({ status: "error", message: err.message });
      });
  }, []);

  // Filter MF data based on search key
  useEffect(() => {
    if (deferredSearchKey.trim().length > 0) {
      const tempArr = [];
      tempArr.push(deferredSearchKey.split(" ").join(")(?=.*?\\b"));
      tempArr.unshift("(?=.*?\\b");
      tempArr.push(")");
      const exp = RegExp(tempArr.join(""), "ig");
      const updatedData = jsonAllData.filter((mf) => {
        return exp.test(mf.schemeName);
      });
      setJsonData(updatedData);
    } else {
      setJsonData(jsonAllData);
    }
  }, [deferredSearchKey, jsonAllData]);

  // Build MF list from filtered data and apply type/growth filters
  useEffect(() => {
    let updatedData: MFType[] = jsonData.map((d: MFJSONType, i: number) => {
      return {
        id: `${i}`,
        value: d.schemeCode,
        name: d.schemeName,
      };
    });
    updatedData = filterMfs(updatedData, selectedType);
    updatedData = filterMfs(updatedData, selectedGrowth);

    if (updatedData.length > 0) {
      updatedData[0].default = true;

      const existingSelection = updatedData.find((mf) => String(mf.value) === String(selectedCode));

      if (existingSelection) {
        setSelectedMF(existingSelection.name);
      } else {
        setSelectedCode(`${updatedData[0].value}`);
        setSelectedMF(`${updatedData[0].name}`);
        // If no saved state, reset duration
        if (!isRestored) {
          setDuration("1");
        }
      }
    }
    setMfs(updatedData);
  }, [jsonData, selectedType, selectedGrowth]);

  // Fetch NAV data when selectedCode changes
  useEffect(() => {
    if (selectedCode !== "0") {
      // Check if we have saved NAV data for this fund
      const hasSavedNav = savedState.savedStartNav && savedState.savedEndNav && isRestored;

      if (!hasSavedNav) {
        // Only fetch if we don't have saved data
        fetchMFbySchemeCode(selectedCode)
          .then((d) => {
            setJsonNavData(d);
          })
          .catch((err) => {
            console.error("Failed to fetch NAV data:", err);
          });
      } else {
        // We have saved data, use it
        setIsRestored(true);
      }
    }
  }, [selectedCode]);

  // Set startNav and endNav from jsonNavData (only when data loads fresh)
  useEffect(() => {
    // Don't override if we're restored from saved state
    if (isRestored) return;

    if (jsonNavData.length === 0) return;

    const durationIndex = parseInt(duration);
    const safeIndex = Math.min(durationIndex, jsonNavData.length - 1);
    const end = jsonNavData[0];
    const start = jsonNavData[safeIndex];

    setStartNav(start);
    setEndNav(end);
  }, [duration, jsonNavData, isRestored]);

  // Mark as restored after first load
  useEffect(() => {
    if (jsonNavData.length > 0 && !isRestored) {
      // If we have saved data, use it
      if (savedState.savedStartNav && savedState.savedEndNav) {
        // Verify the saved data exists in the current NAV data
        const startExists = jsonNavData.find((n) => n.date === savedState.savedStartNav?.date);
        const endExists = jsonNavData.find((n) => n.date === savedState.savedEndNav?.date);

        if (startExists && endExists) {
          setStartNav(savedState.savedStartNav);
          setEndNav(savedState.savedEndNav);
        }
      }
      setIsRestored(true);
    }
  }, [jsonNavData, isRestored]);

  // Calculate profit, CAGR, etc.
  useEffect(() => {
    const e = endNav;
    const s = startNav;
    if (e && s) {
      const trueDuration = getDuration({ startDate: s.date, endDate: e.date }) || 1;

      const percentage = ((parseFloat(e.nav) / parseFloat(s.nav)) ** (1 / trueDuration) - 1) * 100;
      setProfit(percentage);

      const abPercent = ((parseFloat(e.nav) - parseFloat(s.nav)) / parseFloat(s.nav)) * 100;
      setAbsProfit(abPercent);

      const matureAmount = (parseFloat(invAmt) / parseFloat(s.nav)) * parseFloat(e.nav);
      setMatureAmt(parseFloat(matureAmount.toFixed(2)));

      const profitAmount = matureAmount - parseFloat(invAmt);
      setProfitAmt(parseFloat(profitAmount.toFixed(2)));
    }
  }, [startNav, endNav, invAmt]);

  // Update chart data
  useEffect(() => {
    if (startNav && endNav && jsonNavData.length > 0) {
      const startIndex = jsonNavData.findIndex((jd) => jd.date === startNav.date);
      const endIndex = jsonNavData.findIndex((jd) => jd.date === endNav.date);

      if (startIndex !== -1 && endIndex !== -1) {
        const chartJsonData = jsonNavData
          .slice(Math.min(startIndex, endIndex), Math.max(startIndex, endIndex) + 1)
          .map((d) => ({ date: d.date, nav: parseFloat(d.nav) }));
        setChartData(chartJsonData);
        setChartLineColor(
          parseFloat(endNav.nav) > parseFloat(startNav.nav)
            ? lch_to_rgba(getStyleVariable(".stat", "--su"))
            : lch_to_rgba(getStyleVariable(".stat", "--er"))
        );
      }
    }
  }, [jsonNavData, startNav, endNav]);

  // Handle fund selection
  const handleFundSelect = (mf: MFType) => {
    setSelectedCode(String(mf.value));
    setSelectedMF(mf.name);
    setDuration("1");
    setStartNav(undefined);
    setEndNav(undefined);
    setJsonNavData([]);
    setIsRestored(false);
    // Fetch new data
    fetchMFbySchemeCode(String(mf.value))
      .then((d) => {
        setJsonNavData(d);
      })
      .catch((err) => {
        console.error("Failed to fetch NAV data:", err);
      });
  };

  // Handle duration change (time slots)
  const handleDurationChange = (val: string) => {
    setDuration(val);
    setIsRestored(false); // Reset restored flag to trigger recalculation
    // Update NAV based on new duration
    if (jsonNavData.length > 0) {
      const durationIndex = parseInt(val);
      const safeIndex = Math.min(durationIndex, jsonNavData.length - 1);
      const end = jsonNavData[0];
      const start = jsonNavData[safeIndex];
      setStartNav(start);
      setEndNav(end);
    }
  };

  // Handle custom date change from StartEndDate
  const handleCustomDateChange = (start: NavType | undefined, end: NavType | undefined) => {
    if (start && end) {
      setStartNav(start);
      setEndNav(end);
      setIsRestored(true);
    }
  };

  // Toggle view mode
  const toggleViewChart = () => {
    setViewChart((prev) => !prev);
  };

  // Toggle date picker
  const toggleShowDate = () => {
    const newVal = !showDate;
    setShowDate(newVal);
    propSetShowDate(newVal);
  };

  return error.status === "error" ? (
    <h3 className="text-error">{error.message}</h3>
  ) : (
    <div>
      <div className="flex gap-2">
        <JoinedButtonGroup
          data={[
            { id: "t1", title: "Direct", value: "Direct" },
            { id: "t2", title: "Regular", value: "!Direct" },
          ]}
          selectedValue={selectedType}
          updateSelectedValue={setSelectedType}
          className="mb-2"
          sizePrefix="sm"
        />
        <JoinedButtonGroup
          data={[
            { id: "g1", title: "Growth", value: "Growth" },
            { id: "g2", title: "Dividend", value: "Dividend" },
            { id: "g3", title: "IDCW", value: "IDCW" },
          ]}
          selectedValue={selectedGrowth}
          updateSelectedValue={setSelectedGrowth}
          className="mb-2"
          sizePrefix="sm"
        />
      </div>

      {!showDate && (
        <>
          <JoinedButtonGroup
            data={[
              { id: "ty1", title: "1D", value: "1" },
              { id: "ty2", title: "3D", value: "3" },
              { id: "ty3", title: "1W", value: "5" },
              { id: "ty4", title: "2W", value: "10" },
              { id: "ty5", title: "3W", value: "15" },
              { id: "ty6", title: "1M", value: "20" },
              { id: "ty7", title: "5W", value: "26" },
              { id: "ty8", title: "6W", value: "30" },
            ]}
            selectedValue={duration}
            updateSelectedValue={handleDurationChange}
            btnClass="rounded-bl-none rounded-br-none border-b-0"
            sizePrefix="sm"
          />
          <JoinedButtonGroup
            data={[
              { id: "ty9", title: "2M", value: "39" },
              { id: "ty10", title: "3M", value: "63" },
              { id: "ty11", title: "4M", value: "84" },
              { id: "ty12", title: "5M", value: "105" },
              { id: "ty13", title: "6M", value: "126" },
              { id: "ty14", title: "1Y", value: "243" },
              { id: "ty15", title: "1.5Y", value: "366" },
              { id: "ty16", title: "2Y", value: "485" },
            ]}
            selectedValue={duration}
            updateSelectedValue={handleDurationChange}
            btnClass="rounded-l-none rounded-r-none border-b-0"
            sizePrefix="sm"
          />
          <JoinedButtonGroup
            data={[
              { id: "ty18", title: "3Y", value: "740" },
              { id: "ty19", title: "4Y", value: "985" },
              { id: "ty20", title: "5Y", value: "1235" },
              { id: "ty21", title: "6Y", value: "1476" },
              { id: "ty22", title: "7Y", value: "1725" },
              { id: "ty23", title: "10Y", value: "2464" },
              { id: "ty24", title: "15Y", value: "3695" },
              { id: "ty25", title: "20Y", value: "4928" },
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
          startNav={startNav}
          endNav={endNav}
          setStartNav={(nav) => {
            if (nav) {
              setStartNav(nav);
              setIsRestored(true);
            }
          }}
          setEndNav={(nav) => {
            if (nav) {
              setEndNav(nav);
              setIsRestored(true);
            }
          }}
        />
      )}

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search Mutual Funds..."
          className="input input-sm input-primary w-full mb-2"
          value={searchKey}
          onChange={(e) => setSearchKey(e.target?.value.replace(/[.*+?^${}()|[\]\\]/g, ""))}
        />
        <button className="btn btn-outline btn-primary btn-sm" onClick={toggleShowDate}>
          {showDate ? "Time Slots" : "Date Picker"}
        </button>
        <button className="btn btn-outline btn-primary btn-sm" onClick={toggleViewChart}>
          {viewChart ? "List View" : "Chart View"}
        </button>
      </div>

      {viewChart && chartData.length > 0 ? (
        <Chart
          className="chart-container"
          jsonData={chartData}
          mf={selectedMF}
          color={chartLineColor}
        />
      ) : (
        <div className="mf-container max-h-60 overflow-y-auto">
          {mfs.map((mf) => (
            <label className="label px-0 py-0 pb-2 cursor-pointer justify-start gap-2" key={mf.id}>
              <input
                type="radio"
                name="mf"
                className="radio radio-primary"
                value={mf.value}
                checked={String(mf.value) === String(selectedCode)}
                onChange={() => handleFundSelect(mf)}
              />
              <span className="label-text">{mf.name}</span>
            </label>
          ))}
        </div>
      )}

      <InputAmount
        inputAmount={invAmt}
        setInputAmount={setInvAmt}
        className="mb-2"
        title="Invested Amount"
        stepData={[
          { id: "ip1", value: "50000000", title: "5Cr" },
          { id: "ip2", value: "5000000", title: "50L" },
          { id: "ip3", value: "500000", title: "5L" },
          { id: "ip4", value: "50000", title: "50K" },
          { id: "ip5", value: "5000", title: "5K" },
          { id: "ip6", value: "500", title: "500" },
          { id: "ip7", value: "50", title: "50" },
        ]}
        typeSizePrefix="sm"
        stepSizePrefix="sm"
      />

      <div className="stats border-solid border border-primary w-full">
        <div className="stat px-2 py-2">
          <div className="flex flex-col items-center text-center">
            <div className="flex gap-2">
              <div className="text-secondary text-xl">
                <div className="stat-title text-xs">{startNav?.date || "N/A"}</div>
                <span className="text-sm">₹</span>
                {startNav && parseFloat(startNav.nav).toFixed(2)}
              </div>
              <div
                className={`text-xl ${endNav && startNav && parseFloat(endNav.nav) > parseFloat(startNav.nav) ? "text-success" : "text-error"}`}
              >
                <div className="stat-title text-xs">{endNav?.date || "N/A"}</div>
                <span className="text-sm">₹</span>
                {endNav && parseFloat(endNav.nav).toFixed(2)}
              </div>
            </div>
            <div className="text-xl">
              <div className="stat-title text-xs">Final Amount</div>
              <span className="font-semibold">
                ₹ {matureAmt && matureAmt.toLocaleString("en-IN")}
              </span>
              <div
                className={`text-sm ${matureAmt > parseFloat(invAmt) ? "text-success" : "text-error"}`}
              >
                {profitAmt < 0 ? "-" : "+"}&nbsp;₹
                {Math.abs(profitAmt).toLocaleString("en-IN")}
              </div>
            </div>
            <div className="stat-title text-sm">
              <span className="text-xs">CAGR:</span>{" "}
              <span className={`${profit > 0 ? "text-success" : "text-error"}`}>
                {profit.toFixed(2)}%{" "}
              </span>
              |&nbsp;<span className="text-xs">Abs.</span>{" "}
              <span className={`${profit > 0 ? "text-success" : "text-error"}`}>
                {absProfit.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MutualFund;
