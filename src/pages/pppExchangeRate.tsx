import { useEffect, useMemo, useState } from 'react';
import InputAmount from '../components/InputAmount';
import DisplayCard from '../components/DisplayCard';
import CURRENCY_CODES, { IndianFormat } from '../data/currencyCodes';
import { getCurrencySymbol } from '../utilities/currency';
import { CountryPPPType, ExchangeRateType } from '../types/types';
import { fetchExchangeRates, fetchPPPData } from '../data/api_data';
import CountrySelect from '../components/CountrySelect';
import SEOHead from '../components/SEOHead';
import CalculatorContentSection from '../components/CalculatorContentSection';
const pppSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'PPP Calculator — Rupee Calculator',
      url: 'https://rupees.vercel.app/ppp-calculator',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'All',
      browserRequirements: 'Requires JavaScript',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
      },
    },
    {
      '@type': 'FinancialProduct',
      name: 'Purchasing Power Parity (PPP) Salary & Cost of Living Calculator',
      description:
        'Calculates real purchasing power parity and equivalent standard-of-living salaries across 150+ countries using official World Bank conversion factors and real-time exchange rates.',
      category: 'EconomicAnalysis',
      provider: {
        '@type': 'Organization',
        name: 'Rupee Calculator',
        url: 'https://rupees.vercel.app/',
      },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://rupees.vercel.app/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'PPP Calculator',
          item: 'https://rupees.vercel.app/ppp-calculator',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is Purchasing Power Parity (PPP)?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Purchasing Power Parity (PPP) is an economic metric that measures the amount of local currency required to purchase an identical basket of goods and services in different countries, accounting for price differences and living costs rather than currency exchange rates alone.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the PPP conversion factor between India and the United States?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'According to World Bank data, the PPP conversion factor for India is approximately ~₹23-25 per 1 US Dollar (compared to nominal exchange rates of ~₹83-87 per USD). This means ₹25 Lakhs in India offers equivalent domestic purchasing power to roughly $100,000 in the USA.',
          },
        },
        {
          '@type': 'Question',
          name: 'Why do nominal currency conversions mislead global salary comparisons?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Converting salary using market foreign exchange rates ignores local rent, healthcare, groceries, and services. A $100,000 salary in New York or San Francisco may purchase a similar lifestyle to ₹20-25 Lakhs in Bengaluru or Hyderabad once living costs are factored in.',
          },
        },
      ],
    },
  ],
};
const pppFaqs = [
  {
    question: 'How do multinational companies use PPP for remote employee compensation?',
    answer:
      'Global tech companies and remote work organizations use World Bank PPP conversion factors to adjust local compensation packages, ensuring fair real purchasing power regardless of geographic location.',
  },
  {
    question: 'How does PPP assist NRIs and expats planning to return to India?',
    answer:
      'For NRIs considering returning to India (R2I), PPP calculations reveal the realistic domestic salary required in Indian Rupees to maintain their current foreign lifestyle, housing standard, and disposable income.',
  },
  {
    question: 'How frequently does the World Bank update global PPP conversion factors?',
    answer:
      'The World Bank International Comparison Program (ICP) updates comprehensive global PPP datasets annually across 150+ sovereign economies.',
  },
  {
    question: 'What is the difference between Market FX Rate and PPP Rate?',
    answer:
      'The Market Exchange Rate reflects international trade demand, currency trading, and interest rate differentials. The PPP Rate reflects the true domestic purchasing power of ordinary consumers buying non-tradable goods like rent, meals, transport, and utilities.',
  },
];
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
  const handleSwapCountries = () => {
    setSrcCountry(tgtCountry);
    setTgtCountry(srcCountry);
  };
  const currencyLookup = useMemo(
    () => new Map(CURRENCY_CODES.map((cc) => [cc.name.toLowerCase(), cc])),
    []
  );
  useEffect(() => {
    let cancelled = false;
    const loadPPPData = async () => {
      setPppLoading(true);
      setPppError(null);
      try {
        const records = await fetchPPPData();
        if (cancelled) return;
        const transformed: { [key: string]: CountryPPPType } = {};
        for (const record of records) {
          if (record.value == null) continue;
          const country = record.country.value;
          if (!transformed[country]) {
            const matchedCurrency = currencyLookup.get(country.toLowerCase());
            transformed[country] = {
              currencyName: matchedCurrency
                ? matchedCurrency.currency_name
                : country.substring(0, 3).toUpperCase(),
              currencyCode: matchedCurrency ? matchedCurrency.currency_code : 'en-US',
            };
          }
          transformed[country][parseInt(record.date, 10)] = record.value;
        }
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
  }, [currencyLookup]);
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
      <div className={`w-full max-w-4xl mx-auto px-2 py-4 ${className || ''}`}>
        {title && <h5>{title}</h5>}
        <p className="text-sm opacity-70">Loading global World Bank purchasing power datasets...</p>
      </div>
    );
  }
  if (pppError) {
    return (
      <div className={`w-full max-w-4xl mx-auto px-2 py-4 ${className || ''}`}>
        {title && <h5>{title}</h5>}
        <p className="text-sm text-error">{pppError}</p>
      </div>
    );
  }
  return (
    <main className={`w-full max-w-4xl mx-auto px-2 py-4 ${className || ''}`}>
      <SEOHead
        title="PPP Calculator — Purchasing Power Parity & Salary Comparison India 2026"
        description="Compare salaries and living costs across 150+ countries using World Bank PPP data. Convert Indian Rupee salary to real USD/EUR purchasing power equivalent. 100% free."
        keywords="purchasing power parity calculator, PPP calculator India to USA, salary comparison PPP, cost of living converter, World Bank PPP conversion, India US salary comparison, cost of living calculator, salary purchasing power, PPP conversion factor"
        canonicalPath="/ppp-calculator"
        schema={pppSchema}
      />
      <header className="mb-6 text-center sm:text-left">
        <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-2 uppercase tracking-wider">
          Global Economics &bull; World Bank Verified Data
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Purchasing Power Parity (PPP) &amp; Global Salary Calculator
        </h1>
        <p className="mt-1 text-xs sm:text-sm opacity-70">
          Compare real standard of living and salary equivalents across 150+ countries.
        </p>
      </header>
      <div className="card bg-base-100 border border-base-300 p-4 sm:p-6 rounded-2xl shadow-sm space-y-4">
        {title && <h5 className="font-bold">{title}</h5>}
        <div className="join mb-1 w-full">
          <div className="label join-item px-2 w-16 bg-primary text-primary-content border-primary text-center text-xs font-semibold">
            Source
          </div>
          <CountrySelect
            label="source"
            value={srcCountry}
            countries={Object.keys(data)}
            onChange={setSrcCountry}
          />
          <CountrySelect
            label="target"
            value={tgtCountry}
            countries={Object.keys(data)}
            onChange={setTgtCountry}
          />
          <div className="label join-item px-2 w-16 bg-primary text-primary-content border-primary text-center text-xs font-semibold">
            Target
          </div>
        </div>
        {/* Swap link */}
        <div className="text-center">
          <button
            onClick={handleSwapCountries}
            className="text-xs text-primary font-semibold hover:underline focus:outline-none cursor-pointer"
          >
            &harr; Swap source &amp; target countries
          </button>
        </div>
        <InputAmount
          inputAmount={srcAmt}
          setInputAmount={setSrcAmt}
          className="mb-1"
          title="Source Amount"
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
          title={`Equivalent Purchasing Power in ${tgtCountry}`}
        />
        <DisplayCard
          primaryAmount={parseFloat(tgtExAmt.toFixed(2))}
          currencySymbol={derivedValues?.targetCurrencySymbol || 'XYZ'}
          locale={derivedValues?.targetLocale || 'en-US'}
          title={`${
            tgtExAmt === 0
              ? `No live exchange rate available for ${tgtCountry}`
              : `Nominal Forex Conversion in ${tgtCountry}`
          }`}
        />
      </div>
      <CalculatorContentSection
        title="Why Purchasing Power Parity (PPP) Matters for Global Salaries"
        subtitle="Market exchange rates fluctuate based on capital flows and central bank policies, failing to capture true local living costs. Purchasing Power Parity (PPP) calculates the real cost of rent, healthcare, food, and daily essentials across nations."
        formulaTitle="World Bank Purchasing Power Parity Conversion Formula"
        formula="Target Equivalent = (Source Amount / Source PPP Factor) × Target PPP Factor"
        formulaExplanation={[
          {
            symbol: 'Target Equivalent',
            label: 'Local currency needed in target country to match source lifestyle',
          },
          { symbol: 'Source Amount', label: 'Income or expense in origin country local currency' },
          {
            symbol: 'Source PPP Factor',
            label: 'World Bank PPP conversion factor for source economy',
          },
          {
            symbol: 'Target PPP Factor',
            label: 'World Bank PPP conversion factor for destination economy',
          },
        ]}
        workedExample={{
          title: 'Worked Example: ₹25 Lakhs India Salary vs. USA Equivalent',
          description:
            'With India PPP factor of ~24.5 and USA factor of 1.0, converting a ₹25,00,000 Indian annual income to US Dollar lifestyle equivalence:',
          calculation: 'Equivalent USD = ₹25,00,000 / 24.5 = $102,040 in the United States',
          result:
            'Real Purchasing Equivalent: ~$102,000 in USA (Compared to just $29,000 at nominal Forex rates)',
        }}
        comparisonTable={{
          headers: [
            'Country',
            'Nominal FX (1 USD)',
            'PPP Factor (1 USD)',
            '₹25L Equivalent Salary',
          ],
          rows: [
            ['India (INR)', '₹86.50', '₹24.50', '₹25,00,000 (Base)'],
            ['United States (USD)', '$1.00', '$1.00', '$102,000'],
            ['United Kingdom (GBP)', '£0.79', '£0.70', '£71,400'],
            ['Germany (EUR)', '€0.92', '€0.78', '€79,500'],
            ['Canada (CAD)', 'C$1.41', 'C$1.25', 'C$127,500'],
            ['United Arab Emirates (AED)', '3.67 AED', '2.20 AED', '224,000 AED'],
          ],
        }}
        keyBenefits={[
          {
            title: 'Accurate Global Job Offer Analysis',
            description:
              'Evaluate whether an overseas job offer in the US, Europe, or Gulf actually improves your disposable income.',
          },
          {
            title: 'Expat & NRI Repatriation Planning',
            description:
              'Determine the exact domestic rupee compensation required when moving back to India.',
          },
          {
            title: 'Remote Freelance Rate Card',
            description:
              'Set fair, competitive pricing for international clients based on real economic value.',
          },
        ]}
        faqs={pppFaqs}
      />
    </main>
  );
};
export default PPPExchangeRate;
