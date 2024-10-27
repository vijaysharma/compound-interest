import { useEffect, useState } from "react";
import PPP_DATA from "../utilities/pppData";
import InputAmount from "../components/InputAmount";
import DisplayCard from "../components/DisplayCard";
import CURRENCY_CODES from "../utilities/currencyCodes";
import { getCurrencySymbol } from "../utilities/currency";
import { CountryPPPType } from "../types/types";
const PPP = () => {
  const [data, setData] = useState<{ [key: string]: CountryPPPType }>({});
  const [srcCountry, setSrcCountry] = useState("India");
  const [tgtCountry, setTgtCountry] = useState("United States");
  const [srcAmt, setSrcAmt] = useState("10000");
  const [tgtAmt, setTgtAmt] = useState("0");
  const [targetCurrencySymbol, setTargetCurrencySymbol] = useState("XYZ");
  const [sourceCurrencySymbol, setSourceCurrencySymbol] = useState("XYZ");
  const [targetLocale, setTargetLocale] = useState("en-IN");
  const [sourceLocale, setSourceLocale] = useState("en-IN");
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
    console.log(data);
    setData(data);
    const [sourcePPP, targetPPP] = calculatePPP(srcCountry, tgtCountry, data);
    setTgtAmt(calculateTargetAmount(srcAmt, sourcePPP, targetPPP));
    setTargetCurrencySymbol(
      getCurrencySymbol(
        data[tgtCountry].currencyCode,
        data[tgtCountry]?.currencyName
      )
    );
    setTargetLocale(data[tgtCountry].currencyCode);
    setSourceCurrencySymbol(
      getCurrencySymbol(
        data[srcCountry].currencyCode,
        data[srcCountry].currencyName
      )
    );
    setSourceLocale(data[srcCountry].currencyCode);
  }, [srcCountry, tgtCountry, srcAmt]);
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
        title="Amount at source country"
        stepData={[
          {
            id: "ip1",
            value: "50000000",
            title: `${sourceLocale !== "en-IN" ? "50M" : "5Cr"}`,
          },
          {
            id: "ip2",
            value: "5000000",
            title: `${sourceLocale !== "en-IN" ? "5M" : "5OL"}`,
          },
          {
            id: "ip3",
            value: "500000",
            title: `${sourceLocale !== "en-IN" ? "500K" : "5L"}`,
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
        primaryAmount={Math.round(parseFloat(tgtAmt))}
        currencySymbol={targetCurrencySymbol}
        locale={targetLocale}
        title={`Equivalent amount in ${tgtCountry}'s local currency`}
      />
    </>
  );
};
export default PPP;
