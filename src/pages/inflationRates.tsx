import { useEffect, useState } from 'react';
import InputAmount from '../components/InputAmount';
import DisplayCard from '../components/DisplayCard';
import {
  calculateInflatedPrice,
  checkNAYear,
  getCurrencySymbolAndLocale,
} from '../utilities/utility';
import { fetchInflationData, InflationRow } from '../data/api_data';
import StartEndDate from '../components/Date';
import SEOHead from '../components/SEOHead';
import CalculatorContentSection from '../components/CalculatorContentSection';
const YEAR = new Date().getFullYear();
const START_YEAR = (YEAR - 30).toString();
const CURRENT_YEAR = YEAR.toString();
const inflationSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FinancialProduct',
      name: 'Inflation & Purchasing Power Calculator India',
      description:
        'Models historical purchasing power erosion and future cost inflation across India, USA, EU, and World using official World Bank and IMF consumer price index (CPI) datasets.',
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
          name: 'Inflation Calculator',
          item: 'https://rupees.vercel.app/inflation-calculator',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How does inflation affect the future purchasing power of money in India?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Inflation reduces the purchasing power of money over time. At an average annual inflation rate of 6%, ₹1,00,000 today will have the purchasing power of only approximately ₹55,800 in 10 years and ₹31,180 in 20 years.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the Rule of 72 for inflation?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The Rule of 72 estimates how many years it will take for prices to double (or your purchasing power to halve). Divide 72 by the annual inflation rate. For example, at a 6% inflation rate: 72 / 6 = 12 years to halve your money purchasing power.',
          },
        },
        {
          '@type': 'Question',
          name: 'Which investment asset classes historically beat inflation in India?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Diversified Equity Mutual Funds (12-15% CAGR) and Gold (9-11% CAGR) have historically generated positive real (inflation-adjusted) returns over long horizons in India, whereas traditional savings accounts (3-4%) and post-tax fixed deposits (4.5-5.5%) often result in negative real returns.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does inflation affect savings and fixed deposits?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'If your savings account earns 3.5% and inflation is 6%, your real (inflation-adjusted) return is −2.5% per year. Over 10 years, ₹10 Lakh in a savings account grows nominally to ~₹14.1 Lakh, but its purchasing power drops to only ~₹7.9 Lakh in today\'s terms. Even FDs at 7% barely break even after 30% tax (effective 4.9%) against 6% inflation. Equity investments averaging 12–15% are the primary inflation-beating asset class for Indian investors.',
          },
        },
      ],
    },
    {
      '@type': 'WebApplication',
      name: 'Inflation Calculator — Rupee Calculator',
      url: 'https://rupees.vercel.app/inflation-calculator',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'All',
      browserRequirements: 'Requires JavaScript',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
      },
    },
  ],
};
const inflationFaqs = [
  {
    question: 'How is historical Consumer Price Index (CPI) inflation measured in India?',
    answer:
      'In India, the Consumer Price Index (CPI) published by the Ministry of Statistics and Programme Implementation (MoSPI) tracks price changes across a weighted basket of goods and services including food, fuel, housing, education, and healthcare.',
  },
  {
    question: 'What is the difference between Nominal Return and Real Return?',
    answer:
      'Nominal Return is the stated percentage gain on an investment (e.g., 7% in a Fixed Deposit). Real Return adjusts this for inflation and taxes using the Fisher equation: Real Return ≈ Nominal Return - Inflation Rate - Tax Rate.',
  },
  {
    question: 'Why does lifestyle and healthcare inflation exceed general CPI in India?',
    answer:
      'While general headline CPI inflation averages 5-6% in India, specialized sectors like medical healthcare and private school/college education often experience inflation rates between 10% and 14% annually.',
  },
  {
    question: 'How should I account for inflation when planning retirement?',
    answer:
      'When calculating your target retirement corpus, always project your current annual living expenses to your retirement age using an expected inflation rate of 6-7%, and ensure your post-retirement withdrawal plan assumes continued annual cost escalation.',
  },
  {
    question: 'How does inflation affect savings and fixed deposits?',
    answer:
      'If your savings account earns 3.5% and inflation is 6%, your real (inflation-adjusted) return is −2.5% per year. Over 10 years, ₹10 Lakh in a savings account grows nominally to ~₹14.1 Lakh, but its purchasing power drops to only ~₹7.9 Lakh in today\'s terms. Even FDs at 7% barely break even after 30% tax (effective 4.9%) against 6% inflation. Equity investments averaging 12–15% are the primary inflation-beating asset class for Indian investors.',
  },
];
const InflationRates = ({ className, title }: { className?: string; title?: string }) => {
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
  const startYearOptions = inflationData
    .filter((inflation) => checkNAYear(inflation, place))
    .map((inflation) => String(inflation.Year));
  const endYearOptions = inflationData.map((inflation) => String(inflation.Year));
  if (inflationLoading) {
    return (
      <div className={`w-full max-w-4xl mx-auto px-2 py-4 ${className || ''}`}>
        {title && <h5>{title}</h5>}
        <p className="text-sm opacity-70">Loading verified inflation datasets...</p>
      </div>
    );
  }
  if (inflationError) {
    return (
      <div className={`w-full max-w-4xl mx-auto px-2 py-4 ${className || ''}`}>
        {title && <h5>{title}</h5>}
        <p className="text-sm text-error">{inflationError}</p>
      </div>
    );
  }
  return (
    <main className={`w-full max-w-4xl mx-auto px-2 py-4 ${className || ''}`}>
      <SEOHead
        title="Inflation Calculator India — Future Value of Money & Purchasing Power 2026"
        description="Free inflation calculator with IMF historical CPI data. See how ₹1 Lakh today compares to future purchasing power. Plan retirement with real inflation projections."
        keywords="inflation calculator India, future value of money calculator, historical inflation calculator India, IMF inflation forecast, purchasing power calculator India, CPI calculator, cost of living calculator, salary purchasing power, inflation rate calculator, historical inflation calculator"
        canonicalPath="/inflation-calculator"
        schema={inflationSchema}
      />
      <header className="mb-6 text-center sm:text-left">
        <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-2 uppercase tracking-wider">
          Macroeconomic Intelligence &bull; IMF &amp; World Bank Data
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Historical Inflation &amp; Future Purchasing Power Calculator India
        </h1>
        <p className="mt-1 text-xs sm:text-sm opacity-70">
          Analyze purchasing power depreciation, future living expenses, and historical inflation
          benchmarks since 1990.
        </p>
      </header>
      <div className="card bg-base-100 border border-base-300 p-4 sm:p-6 rounded-2xl shadow-sm space-y-4">
        {title && <h5 className="font-bold">{title}</h5>}
        <InputAmount
          className="mb-1"
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
        <StartEndDate
          mode="year"
          startDate={startYear}
          endDate={endYear}
          setStartDate={setStartYear}
          setEndDate={setEndYear}
          startOptions={startYearOptions}
          endOptions={endYearOptions}
        />
        <DisplayCard
          currencySymbol={currencySymbol}
          locale={locale}
          primaryAmount={Math.round(inflatedAmount)}
          title={`Cost of ${currencySymbol}${Number(principal).toLocaleString()} in ${endYear}`}
          secondaryInfo={{
            title: `Purchase power of ${currencySymbol}${Number(principal).toLocaleString()} in ${endYear}`,
            amount: Math.round(deflatedAmount),
          }}
        />
        {endYearIsEstimate && (
          <p className="text-xs opacity-60 mt-2">
            * {endYear} figure for {place} is an IMF projection — the World Bank has not published a
            confirmed final value for this year yet.
          </p>
        )}
      </div>
      <CalculatorContentSection
        title="The Hidden Wealth Destroyer: Compounding Inflation Explained"
        subtitle="Inflation represents the steady increase in the general price level of goods and services over time. Left unaddressed in fixed-cash accounts, inflation quietly erodes real wealth and retirement readiness."
        formulaTitle="Future Price & Purchasing Power Formulas"
        formula="Future Price = Present Cost × ∏ (1 + r_t)  |  Purchasing Power = Present Value / ∏ (1 + r_t)"
        formulaExplanation={[
          {
            symbol: 'Future Price',
            label: 'Equivalent rupee cost required in future year to purchase the same goods',
          },
          {
            symbol: 'Purchasing Power',
            label: 'Real purchasing value remaining of a fixed rupee sum',
          },
          { symbol: 'r_t', label: 'Annual CPI inflation rate observed in year t' },
        ]}
        workedExample={{
          title: 'Worked Example: Impact of 20 Years of India Inflation on ₹1,00,000',
          description:
            'A monthly household basket costing ₹1,00,000 in 2004 compounded across 20 years of real historical Indian inflation (averaging ~6.1% p.a.):',
          calculation:
            '₹1,00,000 (2004) -> Needs ₹3,28,000 in 2024 to purchase the exact same basket of items',
          result:
            'Total Price Increase: +228% | Purchasing Power of Uninvested Cash Halved Every 11.8 Years',
        }}
        comparisonTable={{
          headers: [
            'Asset Class',
            'Historical Nominal Return',
            'Inflation Hedging Ability',
            'Real Post-Tax Return',
          ],
          rows: [
            [
              'Equity Mutual Funds',
              '12% - 15% CAGR',
              'Very High (Companies adjust prices)',
              '+5% to +8% Positive Alpha',
            ],
            [
              'Physical Gold / SGBs',
              '9% - 11% CAGR',
              'High (Classic monetary hedge)',
              '+3% to +4% Positive Alpha',
            ],
            [
              'Real Estate (Tier 1/2)',
              '8% - 11% CAGR',
              'Moderate to High',
              '+1% to +3% Positive Alpha',
            ],
            [
              'Bank Fixed Deposits',
              '6.5% - 7.5% p.a.',
              'Low (Negative after 30% tax)',
              '-1% to 0% Real Drag',
            ],
            [
              'Savings Account / Cash',
              '2.5% - 3.5% p.a.',
              'None (Severe purchasing loss)',
              '-3% to -4% Real Destruction',
            ],
          ],
        }}
        keyBenefits={[
          {
            title: 'Verified Historical Datasets',
            description:
              'Calculated using official World Bank and IMF economic indicators spanning 30+ rolling years.',
          },
          {
            title: 'Multi-Region Comparison',
            description:
              'Compare historical inflation between India, USA, European Union, and Global aggregates.',
          },
          {
            title: 'Realistic Retirement Targeting',
            description:
              'Calibrate your long-term financial independence targets against real inflation.',
          },
        ]}
        faqs={inflationFaqs}
      />
    </main>
  );
};
export default InflationRates;
