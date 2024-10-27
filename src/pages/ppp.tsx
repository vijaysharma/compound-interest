import { useEffect, useState } from "react";
import PPP_DATA from "../utilities/pppData";
import InputAmount from "../components/InputAmount";
import DisplayCard from "../components/DisplayCard";
import CURRENCY_CODES, { IndianFormat } from "../utilities/currencyCodes";
import { getCurrencySymbol } from "../utilities/currency";
import { CountryPPPType, ExchangeRateType } from "../types/types";
const PPP = () => {
  const [data, setData] = useState<{ [key: string]: CountryPPPType }>({});
  const [srcCountry, setSrcCountry] = useState("India");
  const [tgtCountry, setTgtCountry] = useState("United States");
  const [srcAmt, setSrcAmt] = useState("10000");
  const [tgtAmt, setTgtAmt] = useState("0");
  const [tgtExAmt, setTgtExAmt] = useState(0);
  const [targetCurrencySymbol, setTargetCurrencySymbol] = useState("XYZ");
  const [sourceCurrencySymbol, setSourceCurrencySymbol] = useState("XYZ");
  const [targetCurrencyName, setTargetCurrencyName] = useState("USD");
  const [sourceCurrencyName, setSourceCurrencyName] = useState("INR");
  const [targetLocale, setTargetLocale] = useState("en-IN");
  const [sourceLocale, setSourceLocale] = useState("en-IN");
  const [fetchedExData, setFetchExData] = useState<ExchangeRateType>();
  const calculatePPP = (
    srcCountry: string,
    tgtCountry: string,
    pppData: { [key: string]: CountryPPPType }
  ) => {
    const sourceCountry = srcCountry;
    const targetCountry = tgtCountry;

    const SourcePPP =
      pppData[sourceCountry][
        Math.max(
          ...Object.keys(pppData[sourceCountry])
            .filter((x) => x !== "currencyName" && x !== "currencyCode")
            .map((x) => parseInt(x))
        )
      ];
    const TargetPPP =
      pppData[targetCountry][
        Math.max(
          ...Object.keys(pppData[targetCountry])
            .filter((x) => x !== "currencyName" && x !== "currencyCode")
            .map((x) => parseInt(x))
        )
      ];
    return [SourcePPP, TargetPPP];
  };

  const calculateTargetAmount = (
    srcAmt: string,
    srcPPP: number,
    tgtPPP: number
  ) => {
    const targetAmount = (parseFloat(srcAmt) / srcPPP) * tgtPPP;
    return `${targetAmount}`;
  };
  useEffect(() => {
    const data: { [key: string]: CountryPPPType } = PPP_DATA.filter(
      (x) => x.value != null
    )
      .map((x) => {
        return { country: x.country.value, date: x.date, ppp: x.value };
      })
      .reduce((acc, curr) => {
        return Object.assign(Object.assign({}, acc), {
          [curr.country]: Object.assign(
            Object.assign({}, acc[curr.country as keyof typeof acc] || []),
            {
              [curr.date]: curr.ppp,
              currencyName: CURRENCY_CODES.find(
                (cc) => cc.name.toLowerCase() === curr.country.toLowerCase()
              )
                ? CURRENCY_CODES.find(
                    (cc) => cc.name.toLowerCase() === curr.country.toLowerCase()
                  )?.currency_name
                : curr.country.substring(0, 3).toUpperCase(),
              currencyCode: CURRENCY_CODES.find(
                (cc) => cc.name.toLowerCase() === curr.country.toLowerCase()
              )
                ? CURRENCY_CODES.find(
                    (cc) => cc.name.toLowerCase() === curr.country.toLowerCase()
                  )?.currency_code
                : "en-US",
            }
          ),
        });
      }, {});
    setData(data);
    const [sourcePPP, targetPPP] = calculatePPP(srcCountry, tgtCountry, data);
    setTgtAmt(calculateTargetAmount(srcAmt, sourcePPP, targetPPP));
    setTargetCurrencyName(data[tgtCountry].currencyName);
    setTargetCurrencySymbol(
      getCurrencySymbol(
        data[tgtCountry].currencyCode,
        data[tgtCountry]?.currencyName
      )
    );
    setTargetLocale(data[tgtCountry].currencyCode);
    setSourceCurrencyName(data[srcCountry].currencyName);
    setSourceCurrencySymbol(
      getCurrencySymbol(
        data[srcCountry].currencyCode,
        data[srcCountry].currencyName
      )
    );
    setSourceLocale(data[srcCountry].currencyCode);
    const getExchangeRates = async () => {
      if (!fetchedExData) {
        const res = await fetch(`https://open.er-api.com/v6/latest`);
        const data = await res.json();
        const fetchedData = data.rates;
        setFetchExData(fetchedData);
        setTgtExAmt(
          fetchedData[targetCurrencyName] && fetchedData[sourceCurrencyName]
            ? (parseFloat(srcAmt) * fetchedData[targetCurrencyName]) /
                fetchedData[sourceCurrencyName]
            : 0
        );
      } else {
        const exhangeAmt =
          fetchedExData[targetCurrencyName] && fetchedExData[sourceCurrencyName]
            ? (parseFloat(srcAmt) * fetchedExData[targetCurrencyName]) /
              fetchedExData[sourceCurrencyName]
            : 0;
        setTgtExAmt(exhangeAmt);
      }
    };
    getExchangeRates();
  }, [
    srcCountry,
    tgtCountry,
    sourceCurrencyName,
    targetCurrencyName,
    fetchedExData,
    srcAmt,
  ]);
  return (
    <>
      <div className="join mb-3 w-full">
        <div className="join-item px-2 grow bg-primary text-primary-content border-primary text-center text-sm/[46px]">
          Source Country
        </div>
        <select
          className="join-item grow w-60 select select-bordered border-primary focus:border-primary focus:outline-none shadow-none"
          value={srcCountry}
          onChange={(e) => setSrcCountry(e.target.value)}
        >
          {Object.keys(data).map((c) => {
            return (
              <option key={`src-${c}`} value={c}>
                {c}
              </option>
            );
          })}
        </select>
      </div>

      <InputAmount
        inputAmount={srcAmt}
        setInputAmount={setSrcAmt}
        className="mb-3"
        title="Amount in the source country"
        stepData={[
          {
            id: "ip1",
            value: "50000000",
            title: `${IndianFormat.includes(sourceLocale) ? "5Cr" : "50M"}`,
          },
          {
            id: "ip2",
            value: "5000000",
            title: `${IndianFormat.includes(sourceLocale) ? "50L" : "5M"}`,
          },
          {
            id: "ip3",
            value: "500000",
            title: `${IndianFormat.includes(sourceLocale) ? "5L" : "500K"}`,
          },
          { id: "ip4", value: "50000", title: "50K" },
          { id: "ip5", value: "5000", title: "5K" },
          { id: "ip6", value: "500", title: "500" },
          { id: "ip7", value: "50", title: "50" },
        ]}
        currencySymbol={sourceCurrencySymbol}
        locale={sourceLocale}
        typeSizePrefix="base"
        stepSizePrefix="sm"
      />

      <div className="join mb-3 w-full">
        <div className="join-item px-2 grow bg-primary text-primary-content border-primary text-center text-sm/[46px]">
          Target Country
        </div>
        <select
          className="join-item w-60 grow select select-bordered border-primary focus:border-primary focus:outline-none shadow-none"
          value={tgtCountry}
          onChange={(e) => setTgtCountry(e.target.value)}
        >
          {Object.keys(data).map((c) => (
            <option key={`tgt-${c}`} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <DisplayCard
        primaryAmount={parseFloat(parseFloat(tgtAmt).toFixed(2))}
        currencySymbol={targetCurrencySymbol}
        locale={targetLocale}
        title={`Equivalent amount in ${tgtCountry}'s local currency`}
      />
      <br />
      <br />
      <DisplayCard
        primaryAmount={parseFloat(tgtExAmt.toFixed(2))}
        currencySymbol={targetCurrencySymbol}
        locale={targetLocale}
        title={`${
          tgtExAmt === 0
            ? `No exhange data available for ${tgtCountry}'s local currency`
            : `Converted value in ${tgtCountry}'s local currency`
        }`}
      />
    </>
  );
};
export default PPP;
