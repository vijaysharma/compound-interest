import { useDeferredValue, useEffect, useState } from "react";
import { MFJSONType, MFType, NavType } from "../types/types";
import JoinedButtonGroup from "../components/JoinedButtonGroup";
import InputAmount from "../components/InputAmount";
import { getDuration } from "../utilities/utility";
import Chart from "./chart";
import { getStyleVariable, lch_to_rgba } from "../utilities/color-util";

const MF = () => {
  const [jsonAllData, setJsonAllData] = useState<MFJSONType[]>([]);
  const [jsonData, setJsonData] = useState<MFJSONType[]>([]);
  const [jsonNavData, setJsonNavData] = useState<NavType[]>([]);
  const [mfs, setMfs] = useState<MFType[]>([]);
  const [searchKey, setSearchKey] = useState<string>("ICICI Equity Debt");
  const deferredSearchKey = useDeferredValue(searchKey);
  const [selectedType, setSelectedType] = useState("Direct");
  const [selectedGrowth, setSelectedGrowth] = useState("Growth");
  const [viewChart, setViewChart] = useState(false);
  const [chartData, setChartData] = useState<{ date: string; nav: number }[]>(
    []
  );
  const [chartLineColor, setChartLineColor] = useState("black");

  const [selectedCode, setSelectedCode] = useState("0");
  const [selectedMF, setSelectedMF] = useState("");
  const [duration, setDuration] = useState("1");
  const [startNav, setStartNav] = useState<NavType>();
  const [endNav, setEndNav] = useState<NavType>();
  const [profit, setProfit] = useState(0);
  const [absProfit, setAbsProfit] = useState(0);
  const [invAmt, setInvAmt] = useState("100000");
  const [matureAmt, setMatureAmt] = useState(0);
  const [profitAmt, setProfitAmt] = useState(0);
  const filterMfs = (mfs: MFType[], filterKey: string) => {
    if (filterKey === "Growth") filterKey = "Growth|Cumulative";
    if (filterKey[0] === "!") {
      filterKey = filterKey.substring(1, filterKey.length);
      return mfs.filter((mf) => !RegExp(filterKey, "i").test(mf.name));
    }
    const result = mfs.filter((mf) => RegExp(filterKey, "i").test(mf.name));
    console.log(filterKey, result);
    return result;
  };
  useEffect(() => {
    const fetchMFData = async () => {
      const res = await fetch(`https://api.mfapi.in/mf`);
      const data = await res.json();
      const filteredData = data.filter(
        (fd: { schemeCode: number; schemeName: string }, i: number) => {
          if (i === 0) return true;

          if (i > 0) return fd.schemeCode !== data[i - 1].schemeCode;
        }
      );
      const sortedData = filteredData.sort(
        (a: { schemeName: string }, b: { schemeName: string }) => {
          if (a.schemeName < b.schemeName) {
            return -1;
          }
          if (a.schemeName > b.schemeName) {
            return 1;
          }
          return 0;
        }
      );
      console.log(sortedData);
      setJsonAllData(sortedData);
    };
    fetchMFData();
  }, []);
  useEffect(() => {
    if (deferredSearchKey.trim().length > 0) {
      // Search Logic -- filtering the entire data
      const tempArr = [];
      tempArr.push(deferredSearchKey.split(" ").join(")(?=.*?\\b"));
      tempArr.unshift("(?=.*?\\b");
      tempArr.push(")");
      const exp = RegExp(tempArr.join(""), "ig");
      const updatedData = jsonAllData.filter((mf) => {
        return exp.test(mf.schemeName);
      });
      console.log(updatedData);
      setJsonData(updatedData);
    }
  }, [deferredSearchKey, jsonAllData]);

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
      setSelectedCode(`${updatedData[0].value}`);
      setSelectedMF(`${updatedData[0].name}`);
    }
    setMfs(updatedData);
  }, [jsonData, selectedType, selectedGrowth]);

  useEffect(() => {
    const fetchMFByCode = async (schemeCode: string) => {
      const res = await fetch(
        `https://api.mfapi.in/mf/${encodeURIComponent(schemeCode)}`
      );
      const data = await res.json();
      setJsonNavData(data.data);
    };
    if (selectedCode !== "0") fetchMFByCode(selectedCode);
  }, [selectedCode]);

  useEffect(() => {
    const s =
      jsonNavData[parseInt(duration)] || jsonNavData[jsonNavData.length - 1];
    const e = jsonNavData[0];
    setEndNav(e);
    setStartNav(s);
    if (e && s) {
      const trueDuration = getDuration({ startDate: s.date, endDate: e.date });
      const percentage =
        ((parseFloat(e.nav) / parseFloat(s.nav)) ** (1 / trueDuration) - 1) *
        100;
      setProfit(percentage);

      const abPercent =
        ((parseFloat(e.nav) - parseFloat(s.nav)) / parseFloat(s.nav)) * 100;
      setAbsProfit(abPercent);

      const matureAmount =
        (parseFloat(invAmt) / parseFloat(s.nav)) * parseFloat(e.nav);
      setMatureAmt(parseFloat(matureAmount.toFixed(2)));

      const profitAmount = matureAmount - parseFloat(invAmt);
      setProfitAmt(parseFloat(profitAmount.toFixed(2)));

      const chartJsonData = jsonNavData
        .slice(0, jsonNavData.findIndex((jd) => jd.date === s.date) + 1)
        .map((d) => ({ date: d.date, nav: parseFloat(d.nav) }))
        .reverse();
      setChartData(chartJsonData);
      setChartLineColor(
        parseFloat(e.nav) > parseFloat(s.nav)
          ? lch_to_rgba(getStyleVariable(".stat", "--su"))
          : lch_to_rgba(getStyleVariable(".stat", "--er"))
      );
    }
  }, [jsonNavData, duration, invAmt]);
  return (
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
      <JoinedButtonGroup
        data={[
          {
            id: "ty1",
            title: "1D",
            value: "1",
          },
          {
            id: "ty2",
            title: "3D",
            value: "3",
          },
          {
            id: "ty3",
            title: "1W",
            value: "5",
          },
          {
            id: "ty4",
            title: "2W",
            value: "10",
          },
          {
            id: "ty5",
            title: "3W",
            value: "15",
          },
          {
            id: "ty6",
            title: "1M",
            value: "20",
          },
          {
            id: "ty7",
            title: "5W",
            value: "26",
          },
          {
            id: "ty8",
            title: "6W",
            value: "30",
          },
        ]}
        selectedValue={duration}
        updateSelectedValue={setDuration}
        btnClass="rounded-bl-none rounded-br-none border-b-0"
        sizePrefix="sm"
      />

      <JoinedButtonGroup
        data={[
          {
            id: "ty9",
            title: "2M",
            value: "39",
          },
          {
            id: "ty10",
            title: "3M",
            value: "63",
          },
          {
            id: "ty11",
            title: "4M",
            value: "84",
          },
          {
            id: "ty12",
            title: "5M",
            value: "105",
          },
          {
            id: "ty13",
            title: "6M",
            value: "126",
          },
          {
            id: "ty14",
            title: "1Y",
            value: "243",
          },
          {
            id: "ty15",
            title: "1.5Y",
            value: "366",
          },
          {
            id: "ty16",
            title: "2Y",
            value: "485",
          },
        ]}
        selectedValue={duration}
        updateSelectedValue={setDuration}
        btnClass="rounded-l-none rounded-r-none border-b-0"
        sizePrefix="sm"
      />
      <JoinedButtonGroup
        data={[
          {
            id: "ty18",
            title: "3Y",
            value: "740",
          },
          {
            id: "ty19",
            title: "4Y",
            value: "985",
          },
          {
            id: "ty20",
            title: "5Y",
            value: "1235",
          },
          {
            id: "ty21",
            title: "6Y",
            value: "1476",
          },
          {
            id: "ty22",
            title: "7Y",
            value: "1725",
          },
          {
            id: "ty23",
            title: "10Y",
            value: "2464",
          },
          {
            id: "ty24",
            title: "15Y",
            value: "3695",
          },
          {
            id: "ty25",
            title: "20Y",
            value: "4928",
          },
        ]}
        selectedValue={duration}
        updateSelectedValue={setDuration}
        sizePrefix="sm"
        className="mb-2"
        btnClass="rounded-tl-none rounded-tr-none"
      />
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Type here"
          className="input input-sm input-primary w-full mb-2"
          value={searchKey}
          onChange={(e) => setSearchKey(e.target?.value)}
        />
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setViewChart(() => !viewChart)}
        >
          Chart
        </button>
      </div>
      {viewChart ? (
        <Chart
          className="chart-container"
          jsonData={chartData}
          mf={selectedMF}
          color={chartLineColor}
        />
      ) : (
        <div className="mf-container">
          {mfs.map((mf) => (
            <label
              className="label px-0 py-0 pb-2 cursor-pointer justify-start gap-2"
              key={mf.id}
            >
              <input
                type="radio"
                name="mf"
                className="radio radio-primary"
                value={mf.value}
                defaultChecked={mf.default}
                onChange={(e) => {
                  setSelectedCode(e.target.value);
                  setSelectedMF(mf.name);
                }}
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
          {
            id: "ip1",
            value: "50000000",
            title: "5Cr",
          },
          {
            id: "ip2",
            value: "5000000",
            title: "50L",
          },
          {
            id: "ip3",
            value: "500000",
            title: "5L",
          },
          { id: "ip4", value: "50000", title: "50K" },
          { id: "ip5", value: "5000", title: "5K" },
          { id: "ip6", value: "500", title: "500" },
          { id: "ip7", value: "50", title: "50" },
        ]}
        typeSizePrefix="sm"
        stepSizePrefix="sm"
      />

      <div className="stats border-solid border border-primary rounded-bl-none rounded-br-none border-b-0 w-full">
        <div className="stat px-2 py-2">
          <div
            className={`stat-value text-xl ${
              matureAmt > parseFloat(invAmt) ? "text-success" : "text-error"
            }`}
          >
            <span className="stat-title text-xs">
              {`Total Amount on ${endNav?.date}`}
              &nbsp;
            </span>
            <span className="text-sm">₹</span>
            {matureAmt && matureAmt.toLocaleString("en-IN")}
          </div>
          <div
            className={`stat-value text-xl check ${
              profitAmt > 0 ? "text-success" : "text-error"
            }`}
          >
            <span className="stat-title text-xs">Amount gained/lost&nbsp;</span>
            <span className="text-sm">₹</span>
            {profitAmt && profitAmt.toLocaleString("en-IN")}
          </div>
        </div>
      </div>
      <div className="stats border-solid border border-primary rounded-tl-none rounded-tr-none w-full">
        <div className="stat px-2 py-2">
          <div className="stat-value text-secondary text-xl">
            <span className="stat-title text-xs">
              {`Nav on ${startNav?.date}`}&nbsp;
            </span>
            <span className="text-sm">₹</span>
            {startNav && parseFloat(startNav.nav).toFixed(2)}
          </div>
          <div
            className={`stat-value text-xl ${
              endNav &&
              startNav &&
              parseFloat(endNav.nav) > parseFloat(startNav.nav)
                ? "text-success"
                : "text-error"
            }`}
          >
            <span className="stat-title text-xs">
              {`Nav on ${endNav?.date}`}&nbsp;
            </span>
            <span className="text-sm">₹</span>
            {endNav && parseFloat(endNav.nav).toFixed(2)}
          </div>
        </div>
        <div className="stat px-2 py-2">
          <div
            className={`stat-value text-xl ${
              profit > 0 ? "text-success" : "text-error"
            }`}
          >
            <span className="stat-title text-xs">CAGR&nbsp;</span>
            {profit.toFixed(2)}%
          </div>
          <div
            className={`stat-value text-xl ${
              absProfit > 0 ? "text-success" : "text-error"
            }`}
          >
            <span className="stat-title text-xs">Absolute&nbsp;</span>
            {absProfit.toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default MF;
