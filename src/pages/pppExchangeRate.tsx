import { useEffect, useMemo, useState } from 'react';
import InputAmount from '../components/InputAmount';
import DisplayCard from '../components/DisplayCard';
import CURRENCY_CODES, { IndianFormat } from '../data/currencyCodes';
import { getCurrencySymbol } from '../utilities/currency';
import { CountryPPPType, ExchangeRateType } from '../types/types';
import { fetchExchangeRates, fetchPPPData } from '../data/api_data';
const PPPExchangeRate = ({ className, title }: { className?: string; title?: string }) => {
  const [data, setData] = useState<{ [key: string]: CountryPPPType }>({});
  const [pppLoading, setPppLoading] = useState(true);
  const [pppError, setPppError] = useState<string | null>(null);
  const [srcCountry, setSrcCountry] = useState('India');
  const [tgtCountry, setTgtCountry] = useState('United States');
  const [srcAmt, setSrcAmt] = useState('10000');
  const [tgtExAmt, setTgtExAmt] = useState(0);
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
            .filter((x) => x !== 'currencyName' && x !== 'currencyCode')
            .map((x) => parseInt(x))
        )
      ];
    const TargetPPP =
      pppData[targetCountry][
        Math.max(
          ...Object.keys(pppData[targetCountry])
            .filter((x) => x !== 'currencyName' && x !== 'currencyCode')
            .map((x) => parseInt(x))
        )
      ];
    return [SourcePPP, TargetPPP];
  };
  const calculateTargetAmount = (srcAmt: string, srcPPP: number, tgtPPP: number) => {
    srcAmt = srcAmt || '0';
    const targetAmount = (parseFloat(srcAmt) / srcPPP) * tgtPPP;
    return `${targetAmount}`;
  };
  // Handle swap: swap source and target countries
  const handleSwapCountries = () => {
    setSrcCountry(tgtCountry);
    setTgtCountry(srcCountry);
  };
  // Fetch PPP data from the World Bank API once on mount. This replaces the
  // old static PPP_DATA import — the API's response shape already matches
  // what the transform below expects (country.value / date / value).
  useEffect(() => {
    let cancelled = false;
    const loadPPPData = async () => {
      setPppLoading(true);
      setPppError(null);
      try {
        const records = await fetchPPPData();
        if (cancelled) return;
        const transformed: { [key: string]: CountryPPPType } = records
          .filter((x) => x.value != null)
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
                    : 'en-US',
                }
              ),
            });
          }, {});
        setData(transformed);
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch PPP data:', err);
          setPppError('Unable to load purchasing power data right now. Please try again shortly.');
        }
      } finally {
        if (!cancelled) setPppLoading(false);
      }
    };
    loadPPPData();
    return () => {
      cancelled = true;
    };
  }, []);
  const derivedValues = useMemo(() => {
    if (pppLoading || pppError || !data[srcCountry] || !data[tgtCountry]) return null;
    const [sourcePPP, targetPPP] = calculatePPP(srcCountry, tgtCountry, data);
    const source = data[srcCountry];
    const target = data[tgtCountry];
    return {
      tgtAmt: calculateTargetAmount(srcAmt, sourcePPP, targetPPP),
      targetCurrencyName: target.currencyName,
      sourceCurrencyName: source.currencyName,
      targetCurrencySymbol: getCurrencySymbol(target.currencyCode, target.currencyName),
      sourceCurrencySymbol: getCurrencySymbol(source.currencyCode, source.currencyName),
      targetLocale: target.currencyCode,
      sourceLocale: source.currencyCode,
    };
  }, [data, pppError, pppLoading, srcAmt, srcCountry, tgtCountry]);
  useEffect(() => {
    if (!derivedValues) return;
    const { sourceCurrencyName, targetCurrencyName } = derivedValues;
    const getExchangeRates = async () => {
      const sAmt = srcAmt || '0';
      if (!fetchedExData) {
        const fetchedData = await fetchExchangeRates();
        setFetchExData(fetchedData);
        setTgtExAmt(
          fetchedData[targetCurrencyName] && fetchedData[sourceCurrencyName]
            ? (parseFloat(sAmt) * fetchedData[targetCurrencyName]) / fetchedData[sourceCurrencyName]
            : 0
        );
      } else {
        const exhangeAmt =
          fetchedExData[targetCurrencyName] && fetchedExData[sourceCurrencyName]
            ? (parseFloat(sAmt) * fetchedExData[targetCurrencyName]) /
              fetchedExData[sourceCurrencyName]
            : 0;
        setTgtExAmt(exhangeAmt);
      }
    };
    getExchangeRates();
  }, [derivedValues, fetchedExData, srcAmt]);
  if (pppLoading) {
    return (
      <div className={className}>
        {title && <h5>{title}</h5>}
        <p className="text-sm opacity-70">Loading purchasing power data…</p>
      </div>
    );
  }
  if (pppError) {
    return (
      <div className={className}>
        {title && <h5>{title}</h5>}
        <p className="text-sm text-error">{pppError}</p>
      </div>
    );
  }
  return (
    <div className={className}>
      {title && <h5>{title}</h5>}
      <div className="join mb-3 w-full">
        <div className="join-item px-2 grow bg-primary text-primary-content border-primary text-center text-sm/[46px]">
          Source
        </div>
        <select
          className="join-item grow w-24 select border-primary focus:border-primary focus:outline-none shadow-none"
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
        <select
          className="join-item w-24 grow select border-primary focus:border-primary focus:outline-none shadow-none"
          value={tgtCountry}
          onChange={(e) => setTgtCountry(e.target.value)}
        >
          {Object.keys(data).map((c) => (
            <option key={`tgt-${c}`} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="join-item px-2 grow bg-primary text-primary-content border-primary text-center text-sm/[46px]">
          Target
        </div>
      </div>
      {/* Swap link */}
      <div className="text-center mb-3">
        <button
          onClick={handleSwapCountries}
          className="text-sm text-primary hover:underline focus:outline-none"
        >
          Swap source & target countries
        </button>
      </div>
      <InputAmount
        inputAmount={srcAmt}
        setInputAmount={setSrcAmt}
        className="mb-3"
        title="Amount in the source country"
        stepData={[
          {
            id: 'ip1',
            value: '50000000',
            title: `${IndianFormat.includes(derivedValues?.sourceLocale || '') ? '5Cr' : '50M'}`,
          },
          {
            id: 'ip2',
            value: '5000000',
            title: `${IndianFormat.includes(derivedValues?.sourceLocale || '') ? '50L' : '5M'}`,
          },
          {
            id: 'ip3',
            value: '500000',
            title: `${IndianFormat.includes(derivedValues?.sourceLocale || '') ? '5L' : '500K'}`,
          },
          { id: 'ip4', value: '50000', title: '50K' },
          { id: 'ip5', value: '5000', title: '5K' },
          { id: 'ip6', value: '500', title: '500' },
          { id: 'ip7', value: '50', title: '50' },
        ]}
        currencySymbol={derivedValues?.sourceCurrencySymbol || 'XYZ'}
        locale={derivedValues?.sourceLocale || 'en-US'}
        typeSizePrefix="base"
        stepSizePrefix="sm"
      />
      <DisplayCard
        primaryAmount={parseFloat(parseFloat(derivedValues?.tgtAmt || '0').toFixed(2))}
        currencySymbol={derivedValues?.targetCurrencySymbol || 'XYZ'}
        locale={derivedValues?.targetLocale || 'en-US'}
        title={`Equivalent amount in ${tgtCountry}'s local currency`}
      />
      <br />
      <br />
      <DisplayCard
        primaryAmount={parseFloat(tgtExAmt.toFixed(2))}
        currencySymbol={derivedValues?.targetCurrencySymbol || 'XYZ'}
        locale={derivedValues?.targetLocale || 'en-US'}
        title={`${
          tgtExAmt === 0
            ? `No exchange data available for ${tgtCountry}'s local currency`
            : `Converted value in ${tgtCountry}'s local currency`
        }`}
      />
    </div>
  );
};
export default PPPExchangeRate;
