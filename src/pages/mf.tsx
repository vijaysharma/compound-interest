import { useEffect, useState } from "react";
import { MFJSONType, MFType } from "../types/types";
import JoinedButtonGroup from "../components/JoinedButtonGroup";
import InputAmount from "../components/InputAmount";

const MF = () => {
  const [jsonAllData, setJsonAllData] = useState<MFJSONType[]>([]);
  const [jsonData, setJsonData] = useState<MFJSONType[]>([]);
  const [jsonNavData, setJsonNavData] = useState<
    { date: string; nav: string }[]
  >([]);
  const [mfs, setMfs] = useState<MFType[]>([]);
  const [searchKey, setSearchKey] = useState<string>("ICICI Equity Debt");
  const [selectedType, setSelectedType] = useState("Direct");
  const [selectedGrowth, setSelectedGrowth] = useState("Growth");

  const [selectedCode, setSelectedCode] = useState("0");
  const [duration, setDuration] = useState("1");
  const [startNav, setStartNav] = useState<{ date: string; nav: string }>();
  const [endNav, setEndNav] = useState<{ date: string; nav: string }>();
  const [profit, setProfit] = useState(0);
  const [absProfit, setAbsProfit] = useState(0);
  const [invAmt, setInvAmt] = useState("100000");
  const [matureAmt, setMatureAmt] = useState(0);
  const [profitAmt, setProfitAmt] = useState(0);
  const filterMfs = (mfs: MFType[], filterKey: string) => {
    if (filterKey[0] === "!") {
      filterKey = filterKey.substring(1, filterKey.length);
      return mfs.filter((mf) => !RegExp(filterKey, "i").test(mf.name));
    }
    return mfs.filter((mf) => RegExp(filterKey, "i").test(mf.name));
  };
  useEffect(() => {
    const fetchMFData = async () => {
      const res = await fetch(`https://api.mfapi.in/mf`);
      const data = await res.json();
      setJsonAllData(data);
    };
    fetchMFData();
  }, []);
  useEffect(() => {
    const tempArr = [];
    tempArr.push(searchKey.split(" ").join("\\b)(?=.*?\\b"));
    tempArr.unshift("(?=.*?\\b");
    tempArr.push("\\b)");
    const exp = RegExp(tempArr.join(""), "i");
    const updatedData = jsonAllData.filter((mf) => {
      return exp.test(mf.schemeName);
    });
    setJsonData(updatedData);
  }, [searchKey, jsonAllData]);

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
      const percentage =
        ((parseFloat(e.nav) / parseFloat(s.nav)) **
          (365 / parseFloat(duration)) -
          1) *
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
            value: "1215",
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

      <input
        type="text"
        placeholder="Type here"
        className="input input-sm input-primary w-full mb-2"
        value={searchKey}
        onChange={(e) => setSearchKey(e.target?.value)}
      />
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
              onChange={(e) => setSelectedCode(e.target.value)}
            />
            <span className="label-text">{mf.name}</span>
          </label>
        ))}
      </div>
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
            className={`stat-value text-xl ${
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
