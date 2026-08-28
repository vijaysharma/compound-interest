import { useEffect, useState } from 'react';
import InputAmount from '../components/InputAmount';
import DisplayCard from '../components/DisplayCard';
import {
  calculateInflatedPrice,
  checkNAYear,
  getCurrencySymbolAndLocale,
} from '../utilities/utility';
import { fetchInflationData, InflationRow } from '../data/api_data';
const YEAR = new Date().getFullYear();
const START_YEAR = (YEAR - 30).toString();
const CURRENT_YEAR = YEAR.toString();
const Inflation = ({ className, title }: { className?: string; title?: string }) => {
  const [inflationData, setInflationData] = useState<InflationRow[]>([]);
  const [inflationLoading, setInflationLoading] = useState(true);
  const [inflationError, setInflationError] = useState<string | null>(null);
  const [place, setPlace] = useState('India');
  const [principal, setPrincipal] = useState('100');
  const [startYear, setStartYear] = useState(START_YEAR);
  const [endYear, setEndYear] = useState(CURRENT_YEAR);
  // Fetch inflation data from the World Bank API once on mount.
  useEffect(() => {
    let cancelled = false;
    const loadInflationData = async () => {
      setInflationLoading(true);
      setInflationError(null);
      try {
        const rows = await fetchInflationData();
        if (cancelled) return;
        setInflationData(rows);
        // Keep startYear/endYear valid for whatever range actually came back,
        // rather than assuming 2004/2025 exist in the fetched data.
        if (rows.length > 0) {
          const years = rows.map((r) => r.Year);
          const earliest = Math.min(...years);
          const latest = Math.max(...years);
          setStartYear((prev) => (years.includes(parseInt(prev, 10)) ? prev : String(earliest)));
          setEndYear((prev) => (years.includes(parseInt(prev, 10)) ? prev : String(latest)));
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch inflation data:', err);
          setInflationError('Unable to load inflation data right now. Please try again shortly.');
        }
      } finally {
        if (!cancelled) setInflationLoading(false);
      }
    };
    loadInflationData();
    return () => {
      cancelled = true;
    };
  }, []);
  const endYearIsEstimate = (() => {
    const row = inflationData.find((r) => String(r.Year) === endYear);
    const value = row?.[place as keyof Omit<InflationRow, 'Year' | 'id'>];
    return typeof value === 'string' && value.endsWith('*');
  })();
  const [inflatedAmount, deflatedAmount] =
    inflationData.length > 0
      ? calculateInflatedPrice(principal, startYear, endYear, place, inflationData)
      : [0, 0];
  const [currencySymbol, locale] = getCurrencySymbolAndLocale(place);
  if (inflationLoading) {
    return (
      <div className={className}>
        {title && <h5>{title}</h5>}
        <p className="text-sm opacity-70">Loading inflation data…</p>
      </div>
    );
  }
  if (inflationError) {
    return (
      <div className={className}>
        {title && <h5>{title}</h5>}
        <p className="text-sm text-error">{inflationError}</p>
      </div>
    );
  }
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
          { id: 'ty1', value: 'India', title: 'India' },
          { id: 'ty2', value: 'World', title: 'World' },
          { id: 'ty3', value: 'USA', title: 'USA' },
          { id: 'ty4', value: 'EU', title: 'EU' },
        ]}
        stepData={[
          {
            id: 'p1',
            value: '50000000',
            title: `${locale === 'en-US' || locale === 'en-EU' ? '50M' : '5Cr'}`,
          },
          {
            id: 'p2',
            value: '5000000',
            title: `${locale === 'en-US' || locale === 'en-EU' ? '5M' : '50L'}`,
          },
          {
            id: 'p3',
            value: '500000',
            title: `${locale === 'en-US' || locale === 'en-EU' ? '500K' : '5L'}`,
          },
          { id: 'p4', value: '50000', title: '50K' },
          { id: 'p5', value: '5000', title: '5K' },
          { id: 'p6', value: '500', title: '500' },
          { id: 'p7', value: '50', title: '50' },
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
          className="join-item w-24 grow select border-primary focus:border-primary focus:outline-none shadow-none"
          value={startYear}
          onChange={(e) => setStartYear(e.target.value)}
        >
          {inflationData.map((inf) => {
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
          className="join-item w-24 grow select border-primary focus:border-primary focus:outline-none shadow-none"
          value={endYear}
          onChange={(e) => setEndYear(e.target.value)}
        >
          {inflationData.map((inf) => (
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
      {endYearIsEstimate && (
        <p className="text-xs opacity-60 mt-2">
          * {endYear} figure for {place} is an IMF projection — the World Bank hasn't published a
          confirmed value for this year yet.
        </p>
      )}
    </div>
  );
};
export default Inflation;
