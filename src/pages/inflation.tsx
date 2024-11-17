import { useEffect, useState } from "react";
import InputAmount from "../components/InputAmount";
import INFLATION from "../utilities/inflationData";
import DisplayCard from "../components/DisplayCard";
import { INFLATION_TYPE } from "../types/types";
const Inflation = ({
  className,
  title,
}: {
  className?: string;
  title?: string;
}) => {
  const [place, setPlace] = useState("India");
  const [principal, setPrincipal] = useState("100");
  const [startYear, setStartYear] = useState("2004");
  const [endYear, setEndYear] = useState("2024");
  const [inflatedAmount, setInflatedAmount] = useState(0);
  const [deflatedAmount, setDeflatedAmount] = useState(0);
  const [currencySymbol, setCurrencySymbol] = useState("₹");
  const [locale, setLocale] = useState("en-IN");

  const checkNAYear = (d: INFLATION_TYPE, p: string): boolean =>
    d[p as "India" | "USA" | "EU" | "World"] !== "n/a";
  const calculateInflatedPrice = (
    principal: string,
    startYear: string,
    endYear: string,
    place: string,
    data: INFLATION_TYPE[]
  ): number[] => {
    principal = principal || "0";
    const stYear = parseInt(startYear);
    const edYear = parseInt(endYear);
    const splitData = data.filter((d) => {
      return d.Year >= stYear && d.Year < edYear && checkNAYear(d, place);
    });
    const updatedSplitData = splitData
      .map((d) => ({
        year: d.Year,
        ir: parseFloat(
          d[place as "India" | "USA" | "EU" | "World"].replace("%", "")
        ),
      }))
      .reverse();
    let ia = parseFloat(principal);
    for (let i = 0; i < updatedSplitData.length; i++) {
      ia = ia * (1 + updatedSplitData[i]["ir"] / 100);
    }
    let da = parseFloat(principal);
    for (let i = 0; i < updatedSplitData.length; i++) {
      da = da / (1 + updatedSplitData[i]["ir"] / 100);
    }
    return [ia, da];
  };
  const getCurrencySymbol = (place: string) => {
    let sym = "₹";
    let locale = "en-IN";
    switch (place) {
      case "India":
        sym = "₹";
        locale = "en-IN";
        break;
      case "USA":
        sym = "$";
        locale = "en-US";
        break;
      case "EU":
        sym = "€";
        locale = "en-EU";
        break;
      default:
        sym = "₹";
        locale = "en-IN";
    }
    return [sym, locale];
  };
  useEffect(() => {
    const [ia, da] = calculateInflatedPrice(
      principal,
      startYear,
      endYear,
      place,
      INFLATION
    );
    const [sym, locale] = getCurrencySymbol(place);
    setInflatedAmount(ia);
    setDeflatedAmount(da);
    setCurrencySymbol(sym);
    setLocale(locale);
  }, [principal, startYear, endYear, place]);
  return (
    <div className={className}>
      {title && <h5>{title}</h5>}
      <InputAmount
        className="mb-3"
        inputAmount={principal}
        setInputAmount={setPrincipal}
        type={place}
        setType={setPlace}
        typeData={[
          { id: "ty1", value: "India", title: "India" },
          { id: "ty2", value: "World", title: "World" },
          { id: "ty3", value: "USA", title: "USA" },
          { id: "ty4", value: "EU", title: "EU" },
        ]}
        stepData={[
          {
            id: "p1",
            value: "50000000",
            title: `${
              locale === "en-US" || locale === "en-EU" ? "50M" : "5Cr"
            }`,
          },
          {
            id: "p2",
            value: "5000000",
            title: `${locale === "en-US" || locale === "en-EU" ? "5M" : "50L"}`,
          },
          {
            id: "p3",
            value: "500000",
            title: `${
              locale === "en-US" || locale === "en-EU" ? "500K" : "5L"
            }`,
          },
          { id: "p4", value: "50000", title: "50K" },
          { id: "p5", value: "5000", title: "5K" },
          { id: "p6", value: "500", title: "500" },
          { id: "p7", value: "50", title: "50" },
        ]}
        currencySymbol={currencySymbol}
        locale={locale}
        typeSizePrefix="base"
        stepSizePrefix="sm"
      />
      <div className="join mb-3 w-full">
        <div className="join-item px-2 grow bg-primary text-primary-content border-primary text-center text-sm/[46px]">
          Start Year
        </div>
        <select
          className="join-item w-24 grow select select-bordered border-primary focus:border-primary focus:outline-none shadow-none"
          value={startYear}
          onChange={(e) => setStartYear(e.target.value)}
        >
          {INFLATION.map((inf) => {
            return (
              checkNAYear(inf, place) && (
                <option key={`s-${inf.id}`} value={inf.Year}>
                  {inf.Year}
                </option>
              )
            );
          })}
        </select>
        <select
          className="join-item w-24 grow select select-bordered border-primary focus:border-primary focus:outline-none shadow-none"
          value={endYear}
          onChange={(e) => setEndYear(e.target.value)}
        >
          {INFLATION.map((inf) => (
            <option key={`e-${inf.id}`} value={inf.Year}>
              {inf.Year}
            </option>
          ))}
        </select>

        <div className="join-item px-2 grow bg-primary text-primary-content border-primary text-center text-sm/[46px]">
          End Year
        </div>
      </div>

      <DisplayCard
        currencySymbol={currencySymbol}
        locale={locale}
        primaryAmount={Math.round(inflatedAmount)}
        title={`Cost of ${currencySymbol}${principal.toLocaleString()} in ${endYear}`}
        secondaryInfo={{
          title: `Purchase power of ${currencySymbol}${principal.toLocaleString()} in ${endYear}`,
          amount: Math.round(deflatedAmount),
        }}
      />
    </div>
  );
};

export default Inflation;
