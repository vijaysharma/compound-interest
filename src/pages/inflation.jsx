import { useEffect, useState } from "react";
import PrincipalInput from "../components/PrincipalInput";
import INFLATION from "../utilities/inflationData";
import FinalPaymentCard from "../components/FinalPaymentCard";
const Inflation = () => {
  const [place, setPlace] = useState("India");
  const [principal, setPrincipal] = useState(100);
  const [startYear, setStartYear] = useState(2004);
  const [endYear, setEndYear] = useState(2024);
  const [inflatedAmount, setInflatedAmount] = useState(0);
  const [deflatedAmount, setDeflatedAmount] = useState(0);
  const [currencySymbol, setCurrencySymbol] = useState("₹");
  const [locale, setLocale] = useState("en-IN");

  const calculateInflatedPrice = (
    principal,
    startYear,
    endYear,
    place,
    data
  ) => {
    let splitData = data.filter((d) => {
      return d.Year >= startYear && d.Year < endYear && d[place] !== "n/a";
    });
    splitData = splitData
      .map((d) => ({ year: d.Year, ir: parseFloat(d[place].replace("%", "")) }))
      .reverse();
    let ia = principal;
    for (let i = 0; i < splitData.length; i++) {
      ia = ia * (1 + splitData[i]["ir"] / 100);
    }
    let da = principal;
    for (let i = 0; i < splitData.length; i++) {
      da = da / (1 + splitData[i]["ir"] / 100);
    }
    return [ia, da];
  };
  const getCurrencySymbol = (place) => {
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
      case "World":
        sym = "₹";
        locale = "en-IN";
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
  }, [startYear, endYear, place, principal]);
  return (
    <>
      <PrincipalInput
        className="mb-3"
        principalAmount={principal}
        setPrincipalAmount={setPrincipal}
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
            value: 50000000,
            title: `${
              locale === "en-US" || locale === "en-EU" ? "50M" : "5Cr"
            }`,
          },
          {
            id: "p2",
            value: 5000000,
            title: `${locale === "en-US" || locale === "en-EU" ? "5M" : "50L"}`,
          },
          {
            id: "p3",
            value: 500000,
            title: `${
              locale === "en-US" || locale === "en-EU" ? "500K" : "5L"
            }`,
          },
          { id: "p4", value: 50000, title: "50K" },
          { id: "p5", value: 5000, title: "5K" },
          { id: "p6", value: 500, title: "500" },
          { id: "p7", value: 50, title: "50" },
        ]}
        currencySymbol={currencySymbol}
        locale={locale}
        size="base"
        stepSize="sm"
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
              inf[place] !== "n/a" && (
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

      <FinalPaymentCard
        currencySymbol={currencySymbol}
        locale={locale}
        finalAmount={Math.round(inflatedAmount)}
        title={`Cost of ${currencySymbol}${principal.toLocaleString(
          "en-IN"
        )} in ${endYear}`}
        additonalAmount={{
          title: `Purchase power of ${currencySymbol}${principal.toLocaleString(
            "en-IN"
          )} in ${endYear}`,
          amount: Math.round(deflatedAmount),
        }}
      />
    </>
  );
};

export default Inflation;
