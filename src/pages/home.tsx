import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiBarChart2,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiGlobe,
  FiLayers,
  FiPercent,
  FiShield,
  FiTool,
  FiTrendingUp,
  FiZap,
} from 'react-icons/fi';
import { useAuth } from '../context/useAuth';
import convertToWords, { getCurrencySymbol } from '../utilities/currency';
import SEOHead from '../components/SEOHead';
import { trackCalculatorEvent } from '../utilities/analytics';
const homeSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://rupees.vercel.app/#website',
      url: 'https://rupees.vercel.app/',
      name: 'Rupee Calculator',
      description:
        'Free institutional-grade financial calculators for Indian investors — SIP, SWP, FD, EMI, Inflation & PPP. 100% private, client-side execution.',
      inLanguage: 'en-IN',
      publisher: { '@id': 'https://rupees.vercel.app/#organization' },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://rupees.vercel.app/mutual-funds/sip?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://rupees.vercel.app/#organization',
      name: 'Rupee Calculator',
      url: 'https://rupees.vercel.app/',
      logo: 'https://rupees.vercel.app/images/logo.svg',
      sameAs: [],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Are the financial calculations on Rupee Calculator 100% free and private?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. All mathematical models, compounding algorithms, and EMI amortization schedules run 100% client-side in your browser. No financial numbers or personal inputs are transmitted to external servers.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does Rupee Calculator source its mutual fund and macroeconomic data?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Mutual fund NAV histories are retrieved directly from AMFI (Association of Mutual Funds in India), while purchasing power parity and inflation datasets are verified via the World Bank and International Monetary Fund (IMF).',
          },
        },
        {
          '@type': 'Question',
          name: 'What calculators are available on Rupee Calculator?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Rupee Calculator provides 8+ institutional-grade tools including SIP Calculator, SWP Calculator, Fixed Deposit (FD) Compounding Calculator, Recurring Deposit (RD) Calculator, Loan EMI & Amortization Calculator, Inflation Calculator, Purchasing Power Parity (PPP) Converter, and Mutual Fund CAGR Analytics Engine.',
          },
        },
      ],
    },
  ],
};
const homeFaqs = [
  {
    question: 'Are calculations on Rupee Calculator 100% free and private?',
    answer:
      'Yes. All mathematical algorithms, compounding models, and EMI schedules execute locally in your web browser. No confidential financial figures or calculation inputs are stored or transmitted to external servers.',
  },
  {
    question: 'How accurate is the Mutual Fund and Macroeconomic data?',
    answer:
      'Mutual fund historical NAVs are retrieved directly via official AMFI feeds. Global Purchasing Power Parity (PPP) and inflation statistics are sourced from the World Bank Open Data catalog and the International Monetary Fund (IMF) DataMapper.',
  },
  {
    question: 'How is this different from Groww or ET Money calculators?',
    answer:
      'Unlike commercial portals that push advertisements, lead-generation forms, or simplistic calculators, Rupee Calculator offers institutional-grade precision, zero ads, dynamic loan prepayments (part payments), interest rate shift models, and multi-fund backtesting with up to 8 simultaneous mutual funds.',
  },
  {
    question: 'Can I use Rupee Calculator for tax and retirement planning in India?',
    answer:
      'Yes. Our SIP, SWP, and FD tools include practical notes on Section 80C, 80TTB senior citizen exemptions, post-Budget LTCG/STCG tax brackets, and sustainable safe withdrawal rates (SWR) for FIRE (Financial Independence, Retire Early) planning.',
  },
];
const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const [monthlySip, setMonthlySip] = useState(15000);
  const [expectedRoi, setExpectedRoi] = useState(12);
  const [tenureYears, setTenureYears] = useState(10);
  const quickCalc = useMemo(() => {
    const months = tenureYears * 12;
    const monthlyRate = expectedRoi / 100 / 12;
    const totalInvested = monthlySip * months;
    let maturityAmount = 0;
    for (let i = 1; i <= months; i++) {
      maturityAmount += monthlySip * Math.pow(1 + monthlyRate, months - i + 1);
    }
    const estimatedReturns = Math.max(0, maturityAmount - totalInvested);
    const wealthMultiple = (maturityAmount / (totalInvested || 1)).toFixed(1);
    return {
      totalInvested: Math.round(totalInvested),
      estimatedReturns: Math.round(estimatedReturns),
      maturityAmount: Math.round(maturityAmount),
      wealthMultiple,
    };
  }, [monthlySip, expectedRoi, tenureYears]);
  const currencySymbol = getCurrencySymbol('en-IN', 'INR');
  return (
    <div className="w-full text-base-content">
      <SEOHead
        title="Free Online Financial Calculators India — SIP, EMI, FD, SWP & More | Rupee Calculator"
        description="Calculate SIP returns, compound interest, EMI amortization, SWP withdrawals, inflation impact & PPP with 100% free, private financial tools. Trusted by Indian investors."
        keywords="rupee calculator, compound interest calculator India, SIP calculator, SWP calculator, mutual fund return calculator, EMI calculator, inflation calculator India, PPP calculator, financial planning tools India, financial calculator online, investment calculator, loan calculator, savings calculator, retirement calculator, mutual fund calculator, FD calculator, RD calculator"
        canonicalPath="/"
        schema={homeSchema}
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 lg:py-20">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
            Institutional Precision &bull; 100% Free &amp; Private &bull; Real-Time Data
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-balance">
            Rupee Calculator —{' '}
            <span className="text-primary bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Free SIP, FD, EMI &amp; Mutual Fund Tools for India
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg opacity-80 leading-relaxed">
            High-performance financial intelligence engine. Simulate Compound Interest, backtest SIP
            &amp; SWP scenarios, compare historical Mutual Fund NAVs, and model global Purchasing
            Power Parity in real time.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/sip-calculator"
              className="btn btn-primary btn-md sm:btn-lg shadow-lg hover:shadow-primary/30 transition-all font-semibold"
            >
              Open SIP Calculator &rarr;
            </Link>
            <Link
              to="/mutual-funds/lumpsum"
              className="btn btn-outline btn-md sm:btn-lg font-semibold"
            >
              Mutual Fund Engine
            </Link>
            <Link to="/fd-calculator" className="btn btn-ghost btn-md sm:btn-lg font-semibold">
              Deposit &amp; EMI Tools &rarr;
            </Link>
          </div>
          {isAuthenticated && user && (
            <p className="mt-3 text-xs opacity-60">
              Signed in as <span className="font-semibold">{user.email}</span>
            </p>
          )}
          {/* Trust Metrics */}
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 border-y border-base-300 py-6 text-center">
            <div>
              <div className="text-2xl font-black text-primary">10+</div>
              <div className="text-xs opacity-70">Financial &amp; Utility Tools</div>
            </div>
            <div>
              <div className="text-2xl font-black text-primary">0ms</div>
              <div className="text-xs opacity-70">Client Calculation Lag</div>
            </div>
            <div>
              <div className="text-2xl font-black text-primary">AMFI &amp; IMF</div>
              <div className="text-xs opacity-70">Verified Live Data</div>
            </div>
            <div>
              <div className="text-2xl font-black text-primary">100%</div>
              <div className="text-xs opacity-70">Private &amp; Local</div>
            </div>
          </div>
        </div>
      </section>
      {/* Interactive Quick Calculator Preview */}
      <section className="py-8 lg:py-12 bg-base-200/50 rounded-2xl mx-2 sm:mx-4 p-4 sm:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold">Interactive Wealth Growth Simulator</h2>
            <p className="mt-2 text-sm opacity-70">
              See the mathematical magic of compound interest and systematic compounding in action.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Interactive Inputs */}
            <div className="lg:col-span-6 space-y-5 bg-base-100 p-6 rounded-xl border border-base-300 shadow-sm">
              <div>
                <div className="flex justify-between items-center text-sm font-medium mb-1">
                  <span>Monthly Investment</span>
                  <span className="text-primary font-bold">
                    {currencySymbol}
                    {monthlySip.toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="100000"
                  step="1000"
                  value={monthlySip}
                  onChange={(e) => {
                    setMonthlySip(Number(e.target.value));
                    trackCalculatorEvent(
                      'home_quick_sip',
                      'slider_changed',
                      'monthly_sip',
                      Number(e.target.value)
                    );
                  }}
                  className="range range-primary range-sm w-full"
                />
                <span className="text-[11px] opacity-60 capitalize">
                  {convertToWords(monthlySip, 'en-IN')}
                </span>
              </div>
              <div>
                <div className="flex justify-between items-center text-sm font-medium mb-1">
                  <span>Expected Annual Return (CAGR)</span>
                  <span className="text-primary font-bold">{expectedRoi}%</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="25"
                  step="0.5"
                  value={expectedRoi}
                  onChange={(e) => {
                    setExpectedRoi(Number(e.target.value));
                    trackCalculatorEvent(
                      'home_quick_sip',
                      'slider_changed',
                      'roi',
                      Number(e.target.value)
                    );
                  }}
                  className="range range-primary range-sm w-full"
                />
              </div>
              <div>
                <div className="flex justify-between items-center text-sm font-medium mb-1">
                  <span>Investment Horizon</span>
                  <span className="text-primary font-bold">{tenureYears} Years</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="35"
                  step="1"
                  value={tenureYears}
                  onChange={(e) => {
                    setTenureYears(Number(e.target.value));
                    trackCalculatorEvent(
                      'home_quick_sip',
                      'slider_changed',
                      'tenure_years',
                      Number(e.target.value)
                    );
                  }}
                  className="range range-primary range-sm w-full"
                />
              </div>
            </div>
            {/* Live Result Card */}
            <div className="lg:col-span-6 bg-gradient-to-br from-primary/10 via-base-100 to-secondary/10 p-6 rounded-xl border border-primary/20 shadow-md">
              <div className="text-xs uppercase tracking-wider font-semibold opacity-70 mb-1">
                Projected Maturity Value
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-primary mb-1">
                {currencySymbol}
                {quickCalc.maturityAmount.toLocaleString('en-IN')}
              </div>
              <div className="text-xs opacity-75 mb-6 capitalize">
                {convertToWords(quickCalc.maturityAmount, 'en-IN')}
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-base-300">
                <div>
                  <div className="text-xs opacity-60">Total Invested</div>
                  <div className="text-base font-bold">
                    {currencySymbol}
                    {quickCalc.totalInvested.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div className="text-xs opacity-60">Estimated Wealth Gained</div>
                  <div className="text-base font-bold text-success">
                    +{currencySymbol}
                    {quickCalc.estimatedReturns.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-base-300/50 flex items-center justify-between text-xs">
                <span className="opacity-70">Wealth Multiplier:</span>
                <span className="badge badge-primary font-bold">
                  {quickCalc.wealthMultiple}x Capital
                </span>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row gap-2">
                <Link to="/sip-calculator" className="btn btn-primary p-2 flex-1">
                  Open SIP Calculator &rarr;
                </Link>
                <Link to="/mutual-funds/sip" className="btn btn-outline text-sm p-2 flex-1">
                  Mutual Fund SIP &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Product Feature Pillars */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold">Explore Financial Calculators</h2>
            <p className="mt-2 text-base opacity-70">
              Engineered for precision, clarity, and comprehensive financial decision-making.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card bg-base-100 border border-base-300 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2">
                  <FiTrendingUp className="h-5 w-5 inline text-primary mr-1" /> Mutual Fund Engine
                </h3>
                <p className="text-sm opacity-70 mb-4">
                  Search thousands of AMFI mutual funds with live NAV history. Analyze CAGR,
                  benchmark growth, and visualize historical lumpsum and SIP performance.
                </p>
              </div>
              <Link
                to="/mutual-funds/lumpsum"
                className="text-xs text-primary font-semibold hover:underline"
              >
                Explore Mutual Funds &rarr;
              </Link>
            </div>
            <div className="card bg-base-100 border border-base-300 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2">
                  <FiClock className="h-5 w-5 inline text-primary mr-1" /> SIP &amp; SWP Planning
                </h3>
                <p className="text-sm opacity-70 mb-4">
                  Calculate forward systematic investments or retirement withdrawals. Model target
                  capital accumulation or monthly income sustainability.
                </p>
              </div>
              <Link
                to="/sip-calculator"
                className="text-xs text-primary font-semibold hover:underline"
              >
                Explore Systematic Plans &rarr;
              </Link>
            </div>
            <div className="card bg-base-100 border border-base-300 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2">
                  <FiLayers className="h-5 w-5 inline text-primary mr-1" /> Fixed &amp; Recurring
                  Deposits
                </h3>
                <p className="text-sm opacity-70 mb-4">
                  High-precision compound interest calculator with support for monthly, quarterly,
                  semi-annual, and annual compounding frequencies.
                </p>
              </div>
              <Link
                to="/fd-calculator"
                className="text-xs text-primary font-semibold hover:underline"
              >
                Explore Deposit Plans &rarr;
              </Link>
            </div>
            <div className="card bg-base-100 border border-base-300 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2">
                  <FiGlobe className="h-5 w-5 inline text-primary mr-1" /> Purchasing Power Parity
                  (PPP)
                </h3>
                <p className="text-sm opacity-70 mb-4">
                  Convert salary and living costs across 150+ countries using real World Bank PPP
                  conversion factors and currency mappings.
                </p>
              </div>
              <Link
                to="/ppp-calculator"
                className="text-xs text-primary font-semibold hover:underline"
              >
                Calculate Global PPP &rarr;
              </Link>
            </div>
            <div className="card bg-base-100 border border-base-300 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2">
                  <FiBarChart2 className="h-5 w-5 inline text-primary mr-1" /> Inflation Modeling
                </h3>
                <p className="text-sm opacity-70 mb-4">
                  Understand the true purchasing power erosion over decades with IMF historical
                  inflation data and forward forecasts.
                </p>
              </div>
              <Link
                to="/inflation-calculator"
                className="text-xs text-primary font-semibold hover:underline"
              >
                Explore Inflation Rates &rarr;
              </Link>
            </div>
            <div className="card bg-base-100 border border-base-300 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2">
                  <FiPercent className="h-5 w-5 inline text-primary mr-1" /> EMI &amp; Loan
                  Amortization
                </h3>
                <p className="text-sm opacity-70 mb-4">
                  Calculate home, personal, or vehicle loan EMIs with full month-by-month principal
                  vs interest repayment breakdown schedules.
                </p>
              </div>
              <Link
                to="/emi-calculator"
                className="text-xs text-primary font-semibold hover:underline"
              >
                Calculate Loan EMI &rarr;
              </Link>
            </div>
            <div className="card bg-base-100 border border-base-300 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2">
                  <FiTool className="h-5 w-5 inline text-primary mr-1" /> Mathematical Calculator
                </h3>
                <p className="text-sm opacity-70 mb-4">
                  Full-featured basic and scientific calculator with trigonometry, logarithms,
                  powers, factorials, and degree/radian support.
                </p>
              </div>
              <Link to="/calculator" className="text-xs text-primary font-semibold hover:underline">
                Open Calculator &rarr;
              </Link>
            </div>
            <div className="card bg-base-100 border border-base-300 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2">
                  <FiCalendar className="h-5 w-5 inline text-primary mr-1" /> Date Calculator
                </h3>
                <p className="text-sm opacity-70 mb-4">
                  Calculate exact days, weeks, months, and years between dates or add and subtract
                  time intervals from any date.
                </p>
              </div>
              <Link
                to="/date-calculator"
                className="text-xs text-primary font-semibold hover:underline"
              >
                Open Date Calculator &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* Why Choose Rupee Calculator */}
      <section className="py-12 px-4 bg-base-200/40 border-y border-base-300">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold">
              Why Indian Investors Choose Rupee Calculator
            </h2>
            <p className="mt-2 text-sm opacity-70">
              The premier privacy-first financial simulation suite in India.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card bg-base-100 border border-base-300 p-5 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold">
                <FiShield className="h-5 w-5" />
                <span>100% Client-Side Privacy</span>
              </div>
              <p className="text-xs sm:text-sm opacity-75 leading-relaxed">
                Zero data tracking. Your salary, loan balances, and investment amounts never leave
                your browser.
              </p>
            </div>
            <div className="card bg-base-100 border border-base-300 p-5 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold">
                <FiZap className="h-5 w-5" />
                <span>Zero Calculation Lag (0ms)</span>
              </div>
              <p className="text-xs sm:text-sm opacity-75 leading-relaxed">
                Instant interactive feedback with responsive sliders and real-time amortization
                generation.
              </p>
            </div>
            <div className="card bg-base-100 border border-base-300 p-5 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold">
                <FiCheckCircle className="h-5 w-5" />
                <span>Official Institutional Data</span>
              </div>
              <p className="text-xs sm:text-sm opacity-75 leading-relaxed">
                Live mutual fund NAV feeds from AMFI, global PPP metrics from World Bank, and CPI
                inflation from IMF.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Homepage FAQ Section */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold">Frequently Asked Questions</h2>
            <p className="mt-2 text-sm opacity-70">
              Everything you need to know about Rupee Calculator and financial modeling.
            </p>
          </div>
          <div className="space-y-3">
            {homeFaqs.map((faq, idx) => (
              <details
                key={idx}
                className="group border border-base-300 rounded-xl bg-base-100 p-4 open:bg-base-200/40 transition-colors shadow-xs"
              >
                <summary className="font-semibold cursor-pointer list-none flex justify-between items-center text-sm sm:text-base select-none">
                  <span>{faq.question}</span>
                  <span className="text-primary group-open:rotate-180 transition-transform font-bold text-lg">
                    &darr;
                  </span>
                </summary>
                <p className="mt-3 text-xs sm:text-sm opacity-80 leading-relaxed border-t border-base-300/50 pt-3">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
      {/* Call to Action Banner */}
      <section className="my-8 mx-4 rounded-2xl bg-primary text-primary-content p-8 sm:p-12 text-center shadow-xl">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-extrabold sm:text-4xl">Ready to Optimize Your Finances?</h2>
          <p className="mt-3 text-base sm:text-lg opacity-90">
            Model your wealth compounding, loan repayments, and investment strategies with zero lag.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/sip-calculator" className="btn btn-secondary btn-md sm:btn-lg font-semibold">
              Start Calculating Now &rarr;
            </Link>
            <Link
              to="/fd-calculator"
              className="btn btn-outline border-primary-content text-primary-content hover:bg-primary-content hover:text-primary btn-md sm:btn-lg font-semibold"
            >
              Deposit &amp; EMI Tools &rarr;
            </Link>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="border-t border-base-300 py-6 px-4 text-center text-xs opacity-75 space-y-2">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 font-medium">
          <Link to="/about" className="hover:text-primary transition-colors">
            About
          </Link>
          <span className="opacity-40">&bull;</span>
          <Link to="/privacy" className="hover:text-primary transition-colors">
            Privacy Policy
          </Link>
          <span className="opacity-40">&bull;</span>
          <Link to="/disclaimer" className="hover:text-primary transition-colors">
            Disclaimer
          </Link>
        </div>
        <p className="opacity-60 text-[11px]">
          &copy; {new Date().getFullYear()} Rupee Calculator &bull; Educational and analytical
          purposes only.
        </p>
      </footer>
    </div>
  );
};
export default Home;
