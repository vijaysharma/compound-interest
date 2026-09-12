'use client';
import { useEffect, useMemo, useState } from 'react';
import { Link } from '@/navigation';
import ValuePicker from '../components/ValuePicker';
import DisplayCard from '../components/DisplayCard';
import CURRENCY_CODES, { IndianFormat } from '../data/currencyCodes';
import { getCurrencySymbol } from '../utilities/currency';
import { CountryPPPType, ExchangeRateType } from '../types/types';
import { fetchExchangeRates, fetchPPPData, WorldBankPPPRecord } from '../data/api_data';
import { DEFAULT_EXCHANGE_RATES } from '../data/default_exchange_rates';
import { DEFAULT_PPP_RECORDS } from '../data/default_ppp_data';
import CountrySelect from '../components/CountrySelect';
import SEOHead from '../components/SEOHead';
import CalculatorContentSection from '../components/CalculatorContentSection';
import { FiRepeat } from 'react-icons/fi';
import styles from './CalculatorPage.module.scss';
const currencyLookup = new Map(CURRENCY_CODES.map((cc) => [cc.name.toLowerCase(), cc]));
const transformPPPRecords = (records: WorldBankPPPRecord[]): Record<string, CountryPPPType> => {
  const transformed: Record<string, CountryPPPType> = {};
  // 1. Pre-seed with verified fallback records so UAE, USA, India etc. are guaranteed present
  for (const fallback of DEFAULT_PPP_RECORDS) {
    if (fallback.value == null) continue;
    const country = fallback.country.value;
    const matchedCurrency = currencyLookup.get(country.toLowerCase());
    const cName = matchedCurrency ? matchedCurrency.currency_name : 'USD';
    const cLocale = cName === 'INR' ? 'en-IN' : 'en-US';
    transformed[country] = {
      currencyName: cName,
      currencyCode: cLocale,
      [parseInt(fallback.date, 10)]: fallback.value,
    };
  }
  // 2. Overlay live fetched World Bank records
  for (const record of records) {
    if (record.value == null) continue;
    const country = record.country.value;
    if (!transformed[country]) {
      const matchedCurrency = currencyLookup.get(country.toLowerCase());
      const cName = matchedCurrency
        ? matchedCurrency.currency_name
        : country.substring(0, 3).toUpperCase();
      const cLocale = cName === 'INR' ? 'en-IN' : 'en-US';
      transformed[country] = {
        currencyName: cName,
        currencyCode: cLocale,
      };
    }
    transformed[country][parseInt(record.date, 10)] = record.value;
  }
  return transformed;
};
const DEFAULT_TRANSFORMED_PPP = transformPPPRecords(DEFAULT_PPP_RECORDS);
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
  const [data, setData] = useState<{ [key: string]: CountryPPPType }>(DEFAULT_TRANSFORMED_PPP);
  const [pppLoading, setPppLoading] = useState(false);
  const [pppError, setPppError] = useState<string | null>(null);
  const [srcCountry, setSrcCountry] = useState('India');
  const [tgtCountry, setTgtCountry] = useState('United States');
  const [srcAmt, setSrcAmt] = useState('10000');
  const [fetchedExData, setFetchExData] = useState<ExchangeRateType>(DEFAULT_EXCHANGE_RATES);
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
  useEffect(() => {
    let cancelled = false;
    const loadPPPData = async () => {
      try {
        const records = await fetchPPPData();
        if (cancelled) return;
        if (records && records.length > 0) {
          const transformed = transformPPPRecords(records);
          setData(transformed);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('Failed to fetch remote PPP data, using built-in records:', err);
          setPppError('Using offline verified PPP records.');
        }
      } finally {
        if (!cancelled) {
          setPppLoading(false);
        }
      }
    };
    void loadPPPData();
    return () => {
      cancelled = true;
    };
  }, []);
  const derivedValues = useMemo(() => {
    if (pppLoading || pppError || !data[srcCountry] || !data[tgtCountry]) return null;
    const [sourcePPP, targetPPP] = calculatePPP(srcCountry, tgtCountry, data);
    const source = data[srcCountry];
    const target = data[tgtCountry];
    const tgtAmt = calculateTargetAmount(srcAmt, sourcePPP, targetPPP);
    const sourceCurrencySymbol = getCurrencySymbol(source.currencyCode, source.currencyName);
    const targetCurrencySymbol = getCurrencySymbol(target.currencyCode, target.currencyName);
    const sAmt = parseFloat(srcAmt || '0');
    const sourceRate = fetchedExData?.[source.currencyName];
    const targetRate = fetchedExData?.[target.currencyName];
    const hasRates = Boolean(sourceRate && targetRate && sourceRate > 0 && targetRate > 0);
    const nominalForexAmt = hasRates ? (sAmt * (targetRate as number)) / (sourceRate as number) : 0;
    const tgtAmtNum = parseFloat(tgtAmt) || 0;
    const convertedToSource = hasRates
      ? (tgtAmtNum * (sourceRate as number)) / (targetRate as number)
      : 0;
    const primarySub =
      hasRates && convertedToSource > 0
        ? `(${sourceCurrencySymbol} ${convertedToSource.toLocaleString(source.currencyCode === 'en-IN' ? 'en-IN' : 'en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })})`
        : '';
    return {
      tgtAmt,
      tgtExAmt: nominalForexAmt,
      targetCurrencyName: target.currencyName,
      sourceCurrencyName: source.currencyName,
      targetCurrencySymbol,
      sourceCurrencySymbol,
      targetLocale: target.currencyCode,
      sourceLocale: source.currencyCode,
      primarySub,
    };
  }, [data, fetchedExData, pppError, pppLoading, srcAmt, srcCountry, tgtCountry]);
  useEffect(() => {
    let cancelled = false;
    const loadExchangeRates = async () => {
      try {
        const fetchedData = await fetchExchangeRates();
        if (!cancelled && fetchedData && Object.keys(fetchedData).length > 0) {
          setFetchExData(fetchedData);
        }
      } catch (err) {
        console.warn('Failed to load exchange rates in PPP calculator:', err);
      }
    };
    void loadExchangeRates();
    return () => {
      cancelled = true;
    };
  }, []);
  if (pppLoading && Object.keys(data).length === 0) {
    return (
      <div className={`${styles.container} ${styles.containerWide} ${className || ''}`}>
        {title && <h5 className={styles.sectionTitle}>{title}</h5>}
        <p className={styles.infoMessage}>Loading global World Bank purchasing power datasets...</p>
      </div>
    );
  }
  if (pppError && Object.keys(data).length === 0) {
    return (
      <div className={`${styles.container} ${styles.containerWide} ${className || ''}`}>
        {title && <h5 className={styles.sectionTitle}>{title}</h5>}
        <p className={styles.errorMessage}>{pppError}</p>
      </div>
    );
  }
  const tgtExAmt = derivedValues?.tgtExAmt ?? 0;
  return (
    <main className={`${styles.container} ${styles.containerWide} ${className || ''}`}>
      <SEOHead
        title="PPP Calculator — Purchasing Power Parity & Salary Comparison India 2026"
        description="Compare salaries and living costs across 150+ countries using World Bank PPP data. Convert Indian Rupee salary to real USD/EUR purchasing power equivalent. 100% free."
        keywords="purchasing power parity calculator, PPP calculator India to USA, salary comparison PPP, cost of living converter, World Bank PPP conversion, India US salary comparison, cost of living calculator, salary purchasing power, PPP conversion factor"
        canonicalPath="/ppp-calculator"
        schema={pppSchema}
      />
      <header className={styles.header}>
        <div className={styles.badge}>
          Global Economics &bull; World Bank Verified Data
        </div>
        <h1 className={styles.title}>
          Purchasing Power Parity (PPP) &amp; Global Salary Calculator
        </h1>
        <p className={styles.subtitle}>
          Compare real standard of living and salary equivalents across 150+ countries.
        </p>
      </header>
      <div className={styles.calculatorGrid}>
        <div className={styles.inputsCol}>
          <div className={styles.formStack}>
            {title && <h5 className={styles.sectionTitle}>{title}</h5>}
            <ValuePicker.Paired
              sourceBadgeText="Source"
              targetBadgeText="Target"
              sourceSlot={(
                <CountrySelect
                  label="source"
                  value={srcCountry}
                  countries={Object.keys(data)}
                  onChange={setSrcCountry}
                  getSecondaryText={(country) => data[country]?.currencyName}
                />
              )}
              targetSlot={(
                <CountrySelect
                  label="target"
                  value={tgtCountry}
                  countries={Object.keys(data)}
                  onChange={setTgtCountry}
                  getSecondaryText={(country) => data[country]?.currencyName}
                />
              )}
            />
            {/* Swap link */}
            <div className={styles.swapRow}>
              <button
                type="button"
                onClick={handleSwapCountries}
                className={styles.swapBtn}
              >
                <FiRepeat className={styles.swapIcon} />
                <span>Swap source &amp; target countries</span>
              </button>
            </div>
            <ValuePicker
              value={srcAmt}
              onChange={setSrcAmt}
              className={styles.fieldTight}
              title="Amount"
              tabs={[]}
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
            />
          </div>
        </div>
        <div className={styles.resultsCol}>
          <DisplayCard
            primaryAmount={parseFloat(parseFloat(derivedValues?.tgtAmt || '0').toFixed(2))}
            primarySub={`${derivedValues?.primarySub || ''}`}
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
          <div className={styles.promoCard}>
            <div className={styles.promoContent}>
              <span className={styles.promoText}>
                Looking for pure real-time foreign exchange rates across 160+ world currencies?
              </span>
              <Link
                to="/currency-converter"
                className={styles.promoLink}
              >
                <span>Try Currency Converter &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <CalculatorContentSection
        title="Why Purchasing Power Parity (PPP) Matters for Global Salaries"
        subtitle="Market exchange rates fluctuate based on capital flows and central bank policies, failing to capture true local living costs. Purchasing Power Parity (PPP) calculates the real cost of rent, healthcare, food, and daily essentials across nations."
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
