import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiInfo, FiRefreshCw, FiRepeat, FiTrendingUp } from 'react-icons/fi';
import InputAmount from '../components/InputAmount';
import DisplayCard from '../components/DisplayCard';
import CURRENCY_CODES, { IndianFormat } from '../data/currencyCodes';
import { getCurrencySymbol } from '../utilities/currency';
import { fetchExchangeRates } from '../data/api_data';
import SEOHead from '../components/SEOHead';
import CalculatorContentSection from '../components/CalculatorContentSection';
interface CurrencyOption {
  code: string;
  name: string;
  country: string;
  locale: string;
  symbol: string;
}
const POPULAR_CURRENCIES = [
  'USD',
  'INR',
  'EUR',
  'GBP',
  'AED',
  'CAD',
  'AUD',
  'SGD',
  'JPY',
  'CHF',
  'SAR',
  'QAR',
  'KWD',
  'THB',
  'MYR',
  'CNY',
  'NZD',
];
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
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceCode, setSourceCode] = useState('USD');
  const [targetCode, setTargetCode] = useState('INR');
  const [amount, setAmount] = useState('1000');
  const [lastRefreshed, setLastRefreshed] = useState(() => new Date().toLocaleTimeString());
  const allCurrencies = useMemo(() => {
    const map = new Map<string, CurrencyOption>();
    for (const item of CURRENCY_CODES) {
      const code = item.currency_name?.trim().toUpperCase();
      if (!code || code.length !== 3) continue;
      if (!map.has(code)) {
        const locale = item.currency_code || 'en-US';
        const symbol = getCurrencySymbol(locale, code);
        const name = CURRENCY_NAME_MAP[code] || item.name;
        map.set(code, {
          code,
          name,
          country: item.name,
          locale,
          symbol: symbol || code,
        });
      }
    }
    const list = Array.from(map.values());
    list.sort((a, b) => {
      const aPop = POPULAR_CURRENCIES.indexOf(a.code);
      const bPop = POPULAR_CURRENCIES.indexOf(b.code);
      if (aPop !== -1 && bPop !== -1) return aPop - bPop;
      if (aPop !== -1) return -1;
      if (bPop !== -1) return 1;
      return a.code.localeCompare(b.code);
    });
    return list;
  }, []);
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchExchangeRates(false);
      setRates(data);
      setLastRefreshed(new Date().toLocaleTimeString());
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
          setRates(data);
          setLastRefreshed(new Date().toLocaleTimeString());
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
      allCurrencies.find((c) => c.code === sourceCode) || {
        code: sourceCode,
        name: CURRENCY_NAME_MAP[sourceCode] || sourceCode,
        country: sourceCode,
        locale: 'en-US',
        symbol: sourceCode,
      },
    [allCurrencies, sourceCode]
  );
  const targetCurrency = useMemo(
    () =>
      allCurrencies.find((c) => c.code === targetCode) || {
        code: targetCode,
        name: CURRENCY_NAME_MAP[targetCode] || targetCode,
        country: targetCode,
        locale: 'en-IN',
        symbol: targetCode,
      },
    [allCurrencies, targetCode]
  );
  const numericAmount = parseFloat(amount) || 0;
  const sourceRate = rates[sourceCode] ?? 1;
  const targetRate = rates[targetCode] ?? 1;
  const exchangeRate = sourceRate > 0 && targetRate > 0 ? targetRate / sourceRate : 0;
  const inverseRate = exchangeRate > 0 ? 1 / exchangeRate : 0;
  const convertedAmount = numericAmount * exchangeRate;
  const handleSwap = () => {
    setSourceCode(targetCode);
    setTargetCode(sourceCode);
  };
  const conversionSteps = useMemo(() => {
    const values = [1, 5, 10, 25, 50, 100, 500, 1000, 5000];
    return values.map((val) => ({
      val,
      converted: (val * exchangeRate).toLocaleString(targetCurrency.locale, {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      }),
      inverseConverted: (val * inverseRate).toLocaleString(sourceCurrency.locale, {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      }),
    }));
  }, [exchangeRate, inverseRate, sourceCurrency.locale, targetCurrency.locale]);
  return (
    <main className="w-full max-w-4xl mx-auto px-2 py-4">
      <SEOHead
        title="Currency Converter — Live Foreign Exchange Rates India 2026"
        description="Free real-time currency converter with live mid-market forex rates for 160+ currencies including USD to INR, EUR to INR, GBP to INR, AED to INR. 100% private."
        keywords="currency converter, live exchange rates, USD to INR, EUR to INR, GBP to INR, AED to INR, foreign exchange converter India, forex rates live, currency exchange calculator"
        canonicalPath="/currency-converter"
        schema={currencyConverterSchema}
      />
      <header className="mb-6 text-center sm:text-left">
        <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-2 uppercase tracking-wider">
          Forex &bull; Live Mid-Market Rates
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Live Currency Converter &amp; Exchange Rates
        </h1>
        <p className="mt-1 text-xs sm:text-sm opacity-70">
          Convert 160+ global currencies in real time with zero bank markup.
        </p>
      </header>
      <div className="card bg-base-100 border border-base-300 p-4 sm:p-6 shadow-sm mb-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="space-y-1.5">
            <label
              htmlFor="source-currency"
              className="block text-xs font-bold uppercase tracking-wider opacity-75"
            >
              From Currency
            </label>
            <select
              id="source-currency"
              value={sourceCode}
              onChange={(e) => setSourceCode(e.target.value)}
              className="select select-bordered select-primary w-full text-sm font-semibold"
            >
              {allCurrencies.map((c) => (
                <option key={`src-${c.code}`} value={c.code}>
                  {c.code} &mdash; {c.name} ({c.symbol})
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-center pt-2 sm:pt-5">
            <button
              type="button"
              onClick={handleSwap}
              className="btn btn-circle btn-primary btn-sm sm:btn-md shadow hover:scale-105 transition-transform"
              title="Swap currencies"
              aria-label="Swap source and target currencies"
            >
              <FiRepeat className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="target-currency"
              className="block text-xs font-bold uppercase tracking-wider opacity-75"
            >
              To Currency
            </label>
            <select
              id="target-currency"
              value={targetCode}
              onChange={(e) => setTargetCode(e.target.value)}
              className="select select-bordered select-primary w-full text-sm font-semibold"
            >
              {allCurrencies.map((c) => (
                <option key={`tgt-${c.code}`} value={c.code}>
                  {c.code} &mdash; {c.name} ({c.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>
        <InputAmount
          inputAmount={amount}
          setInputAmount={setAmount}
          className="mb-1"
          title={`Amount (${sourceCurrency.code})`}
          stepData={[
            {
              id: 'c1',
              value: '100000',
              title: `${IndianFormat.includes(sourceCurrency.locale) ? '1L' : '100K'}`,
            },
            {
              id: 'c2',
              value: '50000',
              title: '50K',
            },
            {
              id: 'c3',
              value: '10000',
              title: '10K',
            },
            {
              id: 'c4',
              value: '5000',
              title: '5K',
            },
            {
              id: 'c5',
              value: '1000',
              title: '1K',
            },
            {
              id: 'c6',
              value: '500',
              title: '500',
            },
            {
              id: 'c7',
              value: '100',
              title: '100',
            },
          ]}
          currencySymbol={sourceCurrency.symbol}
          locale={sourceCurrency.locale}
          typeSizePrefix="base"
          stepSizePrefix="sm"
        />
        {error ? (
          <div className="alert alert-error text-xs p-3">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void handleRefresh()}
              className="btn btn-xs btn-ghost underline"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <DisplayCard
              primaryAmount={parseFloat(convertedAmount.toFixed(2))}
              currencySymbol={targetCurrency.symbol}
              locale={targetCurrency.locale}
              title={`${numericAmount.toLocaleString(sourceCurrency.locale)} ${sourceCurrency.code} =`}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-base-200/50 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <FiTrendingUp className="text-primary h-4 w-4 shrink-0" />
                <span className="font-medium">
                  1 {sourceCurrency.code} ={' '}
                  <strong className="text-primary font-bold">
                    {exchangeRate.toFixed(4)} {targetCurrency.code}
                  </strong>
                </span>
                <span className="opacity-50">&bull;</span>
                <span className="opacity-80">
                  1 {targetCurrency.code} = {inverseRate.toFixed(4)} {sourceCurrency.code}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] opacity-65">
                <span>Updated: {lastRefreshed}</span>
                <button
                  type="button"
                  onClick={() => void handleRefresh()}
                  disabled={loading}
                  className="btn btn-ghost btn-xs p-0 h-auto min-h-0 text-primary hover:bg-transparent"
                  title="Refresh rates"
                >
                  <FiRefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="card bg-base-100 border border-base-300 p-4 sm:p-6 shadow-sm mb-6">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
            <FiInfo className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-base-content">
              Need to compare purchasing power instead of exchange rates?
            </h3>
            <p className="text-xs opacity-75 mt-0.5">
              Nominal exchange rates don&apos;t account for local costs of living, rent, groceries,
              and services. Use our Purchasing Power Parity (PPP) calculator to see the real
              standard of living equivalent of your income abroad.
            </p>
            <Link
              to="/ppp-calculator"
              className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline mt-2"
            >
              <span>Compare salaries using PPP Calculator</span>
              <FiArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="card bg-base-100 border border-base-300 p-4 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider opacity-70 mb-3">
            Convert {sourceCurrency.code} to {targetCurrency.code}
          </h3>
          <div className="overflow-x-auto">
            <table className="table table-xs w-full">
              <thead>
                <tr>
                  <th>{sourceCurrency.code}</th>
                  <th className="text-right">{targetCurrency.code}</th>
                </tr>
              </thead>
              <tbody>
                {conversionSteps.map((step) => (
                  <tr key={`fwd-${step.val}`} className="hover:bg-base-200/50">
                    <td className="font-semibold">
                      {step.val} {sourceCurrency.code}
                    </td>
                    <td className="text-right">
                      {targetCurrency.symbol} {step.converted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card bg-base-100 border border-base-300 p-4 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider opacity-70 mb-3">
            Convert {targetCurrency.code} to {sourceCurrency.code}
          </h3>
          <div className="overflow-x-auto">
            <table className="table table-xs w-full">
              <thead>
                <tr>
                  <th>{targetCurrency.code}</th>
                  <th className="text-right">{sourceCurrency.code}</th>
                </tr>
              </thead>
              <tbody>
                {conversionSteps.map((step) => (
                  <tr key={`inv-${step.val}`} className="hover:bg-base-200/50">
                    <td className="font-semibold">
                      {step.val} {targetCurrency.code}
                    </td>
                    <td className="text-right">
                      {sourceCurrency.symbol} {step.inverseConverted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <CalculatorContentSection
        title="Live Foreign Exchange (Forex) Rates & Currency Conversion"
        subtitle="Global exchange rates change by the millisecond driven by interest rate decisions, global trade flows, inflation rates, and geopolitical shifts. Understand mid-market rates to make smarter travel, remittance, and international business transactions."
        comparisonTable={{
          headers: [
            'Currency Pair',
            'Typical Mid-Market Rate',
            'Standard Bank Rate (2-3% Spread)',
            'Best Use Case',
          ],
          rows: [
            [
              'USD / INR',
              '₹86.50 – ₹87.00',
              '₹84.50 – ₹89.00',
              'Tech Salaries, US Stocks, Software Subscriptions',
            ],
            [
              'EUR / INR',
              '₹92.00 – ₹94.00',
              '₹89.50 – ₹96.50',
              'Eurozone Travel, Higher Education in Europe',
            ],
            [
              'GBP / INR',
              '₹108.00 – ₹111.00',
              '₹105.00 – ₹114.00',
              'UK Tuition Fees, Expat Remittances',
            ],
            [
              'AED / INR',
              '₹23.50 – ₹23.80',
              '₹22.80 – ₹24.40',
              'Gulf Expat Remittances, Dubai Tourism',
            ],
            [
              'CAD / INR',
              '₹61.00 – ₹63.00',
              '₹59.00 – ₹65.00',
              'Canadian Permanent Residency, Tuition Fees',
            ],
            [
              'SGD / INR',
              '₹64.00 – ₹66.00',
              '₹62.00 – ₹68.00',
              'Southeast Asia Business, Tech Hub Commerce',
            ],
          ],
        }}
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
