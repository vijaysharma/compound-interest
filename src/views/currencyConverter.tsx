'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from '@/navigation';
import { FiArrowRight, FiInfo, FiRefreshCw, FiRepeat, FiTrendingUp } from 'react-icons/fi';
import ValuePicker from '../components/ValuePicker';
import DisplayCard from '../components/DisplayCard';
import CURRENCY_CODES, { IndianFormat } from '../data/currencyCodes';
import { getCurrencySymbol } from '../utilities/currency';
import { fetchExchangeRates } from '../data/api_data';
import { DEFAULT_EXCHANGE_RATES } from '../data/default_exchange_rates';
import SEOHead from '../components/SEOHead';
import CalculatorContentSection from '../components/CalculatorContentSection';
import CountrySelect from '../components/CountrySelect';
import styles from './CurrencyConverter.module.scss';
interface CountryCurrencyInfo {
  country: string;
  code: string;
  name: string;
  symbol: string;
  locale: string;
}
const CURRENCY_NAME_MAP: Record<string, string> = {
  USD: 'US Dollar',
  INR: 'Indian Rupee',
  EUR: 'Euro',
  GBP: 'British Pound',
  AED: 'UAE Dirham',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  SGD: 'Singapore Dollar',
  JPY: 'Japanese Yen',
  CHF: 'Swiss Franc',
  SAR: 'Saudi Riyal',
  QAR: 'Qatari Riyal',
  KWD: 'Kuwaiti Dinar',
  THB: 'Thai Baht',
  MYR: 'Malaysian Ringgit',
  CNY: 'Chinese Yuan',
  NZD: 'New Zealand Dollar',
  BRL: 'Brazilian Real',
  ZAR: 'South African Rand',
  RUB: 'Russian Ruble',
  KRW: 'South Korean Won',
  SEK: 'Swedish Krona',
  NOK: 'Norwegian Krone',
  DKK: 'Danish Krone',
  TRY: 'Turkish Lira',
  IDR: 'Indonesian Rupiah',
  HKD: 'Hong Kong Dollar',
  MXN: 'Mexican Peso',
  PLN: 'Polish Zloty',
  PHP: 'Philippine Peso',
  VND: 'Vietnamese Dong',
  BDT: 'Bangladeshi Taka',
  PKR: 'Pakistani Rupee',
  LKR: 'Sri Lankan Rupee',
  NPR: 'Nepalese Rupee',
};
const cleanCountryName = (rawName: string): string => {
  let s = rawName
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  s = s
    .replace(/\s*\(the\)$/i, '')
    .replace(/\s*\(french Part\)$/i, '')
    .trim();
  if (s === 'United States Of America') return 'United States';
  if (s.startsWith('United Kingdom Of Great Britain')) return 'United Kingdom';
  if (s.includes('Korea (The Republic Of)')) return 'South Korea';
  if (s.includes('Democratic People’s Republic')) return 'North Korea';
  if (s === 'Viet Nam') return 'Vietnam';
  if (s === 'Russian Federation') return 'Russia';
  if (s.includes('Iran')) return 'Iran';
  if (s.includes('Taiwan')) return 'Taiwan';
  if (s.includes('Moldova')) return 'Moldova';
  if (s.includes('Venezuela')) return 'Venezuela';
  if (s.includes('Syrian')) return 'Syria';
  if (s.includes('Virgin Islands (British)')) return 'British Virgin Islands';
  if (s.includes('Virgin Islands (U.S.)')) return 'U.S. Virgin Islands';
  return s;
};
const currencyConverterSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'Currency Converter — Rupee Calculator',
      url: 'https://rupees.vercel.app/currency-converter',
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
      name: 'Live Foreign Exchange Currency Converter',
      description:
        'Convert 160+ world currencies with live mid-market exchange rates. Free real-time currency conversion for USD, INR, EUR, GBP, AED, CAD, and more.',
      category: 'CurrencyConversion',
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
          name: 'Currency Converter',
          item: 'https://rupees.vercel.app/currency-converter',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How are real-time currency conversion rates determined?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Currency conversion rates are determined by the global foreign exchange (forex) market where currencies are traded 24 hours a day. Rates fluctuate continuously based on supply, demand, interest rates, inflation expectations, and geopolitical events.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the difference between mid-market rate and bank retail exchange rate?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The mid-market rate is the midpoint between the buy and sell prices on global wholesale markets—the real exchange rate without retail markups. Banks, airports, and card issuers usually add a 1% to 4% markup or forex markup fee on top of this rate.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the difference between Currency Conversion and Purchasing Power Parity (PPP)?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Currency conversion tells you the exact financial amount you receive when exchanging currencies at current market prices. Purchasing Power Parity (PPP) tells you how much money you need in another country to buy the same lifestyle and basket of goods, taking into account local rent, groceries, and living costs.',
          },
        },
        {
          '@type': 'Question',
          name: 'How frequently are the currency exchange rates updated?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Exchange rates on Rupee Calculator are sourced from real-time open forex market feeds and updated continuously to reflect live global mid-market values.',
          },
        },
      ],
    },
  ],
};
const currencyFaqs = [
  {
    question: 'How are real-time currency conversion rates determined?',
    answer:
      'Currency conversion rates are determined by the global foreign exchange (forex) market where currencies are traded 24 hours a day. Rates fluctuate continuously based on supply, demand, central bank interest rates, inflation expectations, trade balances, and geopolitical events.',
  },
  {
    question: 'What is the difference between mid-market rate and bank retail exchange rate?',
    answer:
      'The mid-market rate (or interbank rate) is the midpoint between buy and sell quotes on global wholesale markets. It represents the purest, uninflated price of a currency. Retail banks, credit cards, and money changers typically charge an additional 1% to 4% spread above this rate.',
  },
  {
    question:
      'What is the difference between Currency Conversion and Purchasing Power Parity (PPP)?',
    answer:
      'Currency conversion calculates the nominal market value when changing one currency to another (e.g. $100 = ~₹8,680). Purchasing Power Parity (PPP) compares what that money actually buys in local terms (e.g. rent, groceries, healthcare). While $100 converts to ~₹8,680 nominally, in terms of domestic Indian living standard it equates to roughly ₹2,450.',
  },
  {
    question: 'How do international credit card forex markup fees work?',
    answer:
      'When you make a purchase in a foreign currency using an Indian debit or credit card, the transaction is converted using Visa/Mastercard network rates plus an issuing bank forex markup fee (usually 1.5% to 3.5% + 18% GST). Zero-forex markup cards use the exact network rate without this bank fee.',
  },
];
const CurrencyConverter = () => {
  const [rates, setRates] = useState<Record<string, number>>(DEFAULT_EXCHANGE_RATES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [srcCountry, setSrcCountry] = useState('United States');
  const [tgtCountry, setTgtCountry] = useState('India');
  const [amount, setAmount] = useState('1');
  const [lastRefreshed, setLastRefreshed] = useState(() => new Date().toLocaleTimeString());
  const countryData = useMemo(() => {
    const map = new Map<string, CountryCurrencyInfo>();
    for (const item of CURRENCY_CODES) {
      const code = item.currency_name?.trim().toUpperCase();
      if (!code || code.length !== 3) continue;
      const country = cleanCountryName(item.name);
      if (!map.has(country)) {
        const locale = code === 'INR' ? 'en-IN' : item.currency_code || 'en-US';
        const symbol = getCurrencySymbol(locale, code) || code;
        const name = CURRENCY_NAME_MAP[code] || item.name;
        map.set(country, {
          country,
          code,
          name,
          symbol,
          locale,
        });
      }
    }
    if (!map.has('European Union')) {
      map.set('European Union', {
        country: 'European Union',
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        locale: 'en-EU',
      });
    }
    return map;
  }, []);
  const availableCountries = useMemo(() => {
    const list = Array.from(countryData.keys());
    const priority = [
      'India',
      'United States',
      'United Kingdom',
      'United Arab Emirates',
      'Canada',
      'Australia',
      'Singapore',
      'Japan',
      'Germany',
      'France',
      'European Union',
      'Switzerland',
      'Saudi Arabia',
      'Qatar',
      'Kuwait',
      'Thailand',
      'Malaysia',
      'China',
      'New Zealand',
      'Brazil',
      'South Africa',
      'South Korea',
      'Russia',
    ];
    list.sort((a, b) => {
      const aIdx = priority.indexOf(a);
      const bIdx = priority.indexOf(b);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.localeCompare(b);
    });
    return list;
  }, [countryData]);
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchExchangeRates(false);
      if (data && Object.keys(data).length > 0) {
        setRates(data);
        setError(null);
        setLastRefreshed(new Date().toLocaleTimeString());
      } else {
        setError('Unable to fetch live exchange rates right now. Please try again in a moment.');
      }
    } catch (err) {
      console.error('Failed to load exchange rates:', err);
      setError('Unable to fetch live exchange rates right now. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    let cancelled = false;
    const fetchInitialRates = async () => {
      try {
        const data = await fetchExchangeRates(false);
        if (!cancelled) {
          if (data && Object.keys(data).length > 0) {
            setRates(data);
            setError(null);
            setLastRefreshed(new Date().toLocaleTimeString());
          } else {
            setError(
              'Unable to fetch live exchange rates right now. Please try again in a moment.'
            );
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load exchange rates:', err);
          setError('Unable to fetch live exchange rates right now. Please try again in a moment.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void fetchInitialRates();
    return () => {
      cancelled = true;
    };
  }, []);
  const sourceCurrency = useMemo(
    () =>
      countryData.get(srcCountry) || {
        country: srcCountry,
        code: 'INR',
        name: 'Indian Rupee',
        symbol: '₹',
        locale: 'en-IN',
      },
    [countryData, srcCountry]
  );
  const targetCurrency = useMemo(
    () =>
      countryData.get(tgtCountry) || {
        country: tgtCountry,
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        locale: 'en-US',
      },
    [countryData, tgtCountry]
  );
  const numericAmount = parseFloat(amount) || 0;
  const sourceRate = rates[sourceCurrency.code] ?? DEFAULT_EXCHANGE_RATES[sourceCurrency.code] ?? 0;
  const targetRate = rates[targetCurrency.code] ?? DEFAULT_EXCHANGE_RATES[targetCurrency.code] ?? 0;
  const exchangeRate = sourceRate > 0 && targetRate > 0 ? targetRate / sourceRate : 0;
  const inverseRate = exchangeRate > 0 ? 1 / exchangeRate : 0;
  const convertedAmount = numericAmount * exchangeRate;
  const handleSwapCountries = () => {
    setSrcCountry(tgtCountry);
    setTgtCountry(srcCountry);
  };
  return (
    <main className={styles.container}>
      <SEOHead
        title="Currency Converter — Live Foreign Exchange Rates India 2026"
        description="Free real-time currency converter with live mid-market forex rates for 160+ currencies including USD to INR, EUR to INR, GBP to INR, AED to INR. 100% private."
        keywords="currency converter, live exchange rates, USD to INR, EUR to INR, GBP to INR, AED to INR, foreign exchange converter India, forex rates live, currency exchange calculator"
        canonicalPath="/currency-converter"
        schema={currencyConverterSchema}
      />
      <header className={styles.header}>
        <div className={styles.badge}>
          Forex &bull; Live Mid-Market Rates
        </div>
        <h1 className={styles.title}>
          Live Currency Converter &amp; Exchange Rates
        </h1>
        <p className={styles.subtitle}>
          Convert 160+ global currencies in real time with zero bank markup.
        </p>
      </header>
      <div className={styles.converterSection}>
        <ValuePicker.Paired
          sourceBadgeText="Source"
          targetBadgeText="Target"
          sourceSlot={(
            <CountrySelect
              label="source"
              value={srcCountry}
              countries={availableCountries}
              onChange={setSrcCountry}
              getSecondaryText={(country) => countryData.get(country)?.code}
            />
          )}
          targetSlot={(
            <CountrySelect
              label="target"
              value={tgtCountry}
              countries={availableCountries}
              onChange={setTgtCountry}
              getSecondaryText={(country) => countryData.get(country)?.code}
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
            <FiRepeat />
            <span>Swap source &amp; target countries</span>
          </button>
        </div>
        <ValuePicker
          value={amount}
          onChange={setAmount}
          className={styles.amountField}
          title="Amount"
          tabs={[]}
          stepData={[
            {
              id: 'ip1',
              value: '50000000',
              title: `${IndianFormat.includes(sourceCurrency.locale) ? '5Cr' : '50M'}`,
            },
            {
              id: 'ip2',
              value: '5000000',
              title: `${IndianFormat.includes(sourceCurrency.locale) ? '50L' : '5M'}`,
            },
            {
              id: 'ip3',
              value: '500000',
              title: `${IndianFormat.includes(sourceCurrency.locale) ? '5L' : '500K'}`,
            },
            { id: 'ip4', value: '50000', title: '50K' },
            { id: 'ip5', value: '5000', title: '5K' },
            { id: 'ip6', value: '500', title: '500' },
            { id: 'ip7', value: '50', title: '50' },
          ]}
          currencySymbol={sourceCurrency.symbol}
          locale={sourceCurrency.locale}
        />
        {/* Error notification */}
        {error && (
          <div className={styles.errorAlert}>
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void handleRefresh()}
              className={styles.retryBtn}
            >
              Retry
            </button>
          </div>
        )}
        {/* Converted Amount Display Card */}
        <DisplayCard
          primaryAmount={exchangeRate > 0 ? parseFloat(convertedAmount.toFixed(2)) : 0}
          currencySymbol={targetCurrency.symbol}
          locale={targetCurrency.locale}
          title={
            exchangeRate > 0
              ? `${numericAmount.toLocaleString(sourceCurrency.locale)} ${sourceCurrency.code} (${srcCountry}) =`
              : `No live exchange rate available for ${tgtCountry} (${targetCurrency.code})`
          }
        />
        {/* Live exchange rate details bar */}
        <div className={styles.rateBar}>
          <div className={styles.rateLeft}>
            <FiTrendingUp className={styles.rateTrendIcon} />
            <span>
              1 {sourceCurrency.code} ={' '}
              <strong className={styles.rateStrong}>
                {exchangeRate > 0 ? exchangeRate.toFixed(4) : 'N/A'} {targetCurrency.code}
              </strong>
            </span>
            {inverseRate > 0 && (
              <>
                <span className={styles.rateDot}>&bull;</span>
                <span className={styles.rateInverse}>
                  1 {targetCurrency.code} = {inverseRate.toFixed(4)} {sourceCurrency.code}
                </span>
              </>
            )}
          </div>
          <div className={styles.rateRight}>
            <span>Updated: {lastRefreshed}</span>
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={loading}
              className={styles.refreshBtn}
              title="Refresh live exchange rates"
              aria-label="Refresh live exchange rates"
            >
              <FiRefreshCw className={loading ? styles.spinning : ''} />
            </button>
          </div>
        </div>
      </div>
      {/* Purchasing Power Parity (PPP) Promo Card */}
      <div className={styles.promoCard}>
        <div className={styles.promoInner}>
          <div className={styles.promoIconBox}>
            <FiInfo />
          </div>
          <div>
            <h3 className={styles.promoTitle}>
              Need to compare purchasing power instead of exchange rates?
            </h3>
            <p className={styles.promoDesc}>
              Nominal exchange rates don&apos;t account for local costs of living, rent, groceries,
              and services. Use our Purchasing Power Parity (PPP) calculator to see the real
              standard of living equivalent of your income abroad.
            </p>
            <Link
              to="/ppp-calculator"
              className={styles.promoLink}
            >
              <span>Compare salaries using PPP Calculator</span>
              <FiArrowRight />
            </Link>
          </div>
        </div>
      </div>
      {/* Comprehensive Educational Content & FAQs */}
      <CalculatorContentSection
        title="Live Foreign Exchange (Forex) Rates & Currency Conversion"
        subtitle="Global exchange rates change by the millisecond driven by interest rate decisions, global trade flows, inflation rates, and geopolitical shifts. Understand mid-market rates to make smarter travel, remittance, and international business transactions."
        keyBenefits={[
          {
            title: 'Real Mid-Market Rates',
            description:
              'View true wholesale interbank foreign exchange rates without hidden fees or markups.',
          },
          {
            title: '160+ Currencies Supported',
            description:
              'Convert between any sovereign currencies worldwide with instant bidirectional updates.',
          },
          {
            title: 'Zero Latency & 100% Private',
            description:
              'Calculations run client-side in your browser. None of your conversion amounts are logged.',
          },
        ]}
        faqs={currencyFaqs}
      />
    </main>
  );
};
export default CurrencyConverter;
