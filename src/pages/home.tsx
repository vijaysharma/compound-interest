import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiBarChart2, FiClock, FiGlobe, FiLayers, FiPercent, FiTrendingUp } from 'react-icons/fi';
import { useAuth } from '../context/useAuth';
import GoogleSignInButton from '../components/GoogleSignInButton';
import convertToWords, { getCurrencySymbol } from '../utilities/currency';
const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
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
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 lg:py-20">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
            Institutional Precision &bull; 100% Free &amp; Private &bull; Real-Time Data
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-balance">
            Master Your Wealth With <br className="hidden sm:inline" />
            <span className="text-primary bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Intelligent Financial Tools
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg opacity-80 leading-relaxed">
            High-performance financial intelligence engine. Simulate Compound Interest, backtest SIP
            &amp; SWP scenarios, compare historical Mutual Fund NAVs, and model global Purchasing
            Power Parity in real time.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link
                to="/mutual-funds/lumpsum"
                className="btn btn-primary btn-md sm:btn-lg shadow-lg hover:shadow-primary/30 transition-all font-semibold"
              >
                Mutual Fund Calculator &rarr;
              </Link>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <GoogleSignInButton
                  text="continue_with"
                  onSuccess={() => navigate('/', { replace: true })}
                />
                <Link
                  to="/mutual-funds/lumpsum"
                  className="btn btn-outline btn-md sm:btn-lg font-semibold"
                >
                  Try Mutual Fund Calculator
                </Link>
              </div>
            )}
            <Link to="/deposits/fd" className="btn btn-ghost btn-md sm:btn-lg font-semibold">
              Deposit &amp; SIP Tools &rarr;
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
              <div className="text-2xl font-black text-primary">8+</div>
              <div className="text-xs opacity-70">Financial Calculators</div>
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
                  onChange={(e) => setMonthlySip(Number(e.target.value))}
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
                  onChange={(e) => setExpectedRoi(Number(e.target.value))}
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
                  onChange={(e) => setTenureYears(Number(e.target.value))}
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
                <Link to="/fixed-plans/fixed-rate-sip" className="btn btn-primary p-2 flex-1">
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
            <div className="card bg-base-100 border border-base-300 p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold mb-2">
                <FiTrendingUp className="h-5 w-5 inline" /> Mutual Fund Engine
              </h3>
              <p className="text-sm opacity-70 mb-4">
                Search thousands of AMFI mutual funds with live NAV history. Analyze CAGR, benchmark
                growth, and visualize historical lumpsum and SIP performance.
              </p>
              <Link
                to="/mutual-funds/lumpsum"
                className="text-xs text-primary font-semibold hover:underline mt-auto"
              >
                Explore Mutual Funds &rarr;
              </Link>
            </div>
            <div className="card bg-base-100 border border-base-300 p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold mb-2">
                <FiClock className="h-5 w-5 inline" /> SIP &amp; SWP Planning
              </h3>
              <p className="text-sm opacity-70 mb-4">
                Calculate forward systematic investments or retirement withdrawals. Model target
                capital accumulation or monthly income sustainability.
              </p>
              <Link
                to="/fixed-plans/fixed-rate-sip"
                className="text-xs text-primary font-semibold hover:underline mt-auto"
              >
                Explore Systematic Plans &rarr;
              </Link>
            </div>
            <div className="card bg-base-100 border border-base-300 p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold mb-2">
                <FiLayers className="h-5 w-5 inline" /> Fixed &amp; Recurring Deposits
              </h3>
              <p className="text-sm opacity-70 mb-4">
                High-precision compound interest calculator with support for monthly, quarterly,
                semi-annual, and annual compounding frequencies.
              </p>
              <Link
                to="/deposits/fd"
                className="text-xs text-primary font-semibold hover:underline mt-auto"
              >
                Explore Deposit Plans &rarr;
              </Link>
            </div>
            <div className="card bg-base-100 border border-base-300 p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold mb-2">
                <FiGlobe className="h-5 w-5 inline" /> Purchasing Power Parity (PPP)
              </h3>
              <p className="text-sm opacity-70 mb-4">
                Convert salary and living costs across 150+ countries using real World Bank PPP
                conversion factors and currency mappings.
              </p>
              <Link
                to="/economics/ppp-exchange-rate"
                className="text-xs text-primary font-semibold hover:underline mt-auto"
              >
                Calculate Global PPP &rarr;
              </Link>
            </div>
            <div className="card bg-base-100 border border-base-300 p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold mb-2">
                <FiBarChart2 className="h-5 w-5 inline" /> Inflation Modeling
              </h3>
              <p className="text-sm opacity-70 mb-4">
                Understand the true purchasing power erosion over decades with IMF historical
                inflation data and forward forecasts.
              </p>
              <Link
                to="/economics/inflation-rates"
                className="text-xs text-primary font-semibold hover:underline mt-auto"
              >
                Explore Inflation Rates &rarr;
              </Link>
            </div>
            <div className="card bg-base-100 border border-base-300 p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold mb-2">
                <FiPercent className="h-5 w-5 inline" /> EMI &amp; Loan Amortization
              </h3>
              <p className="text-sm opacity-70 mb-4">
                Calculate home, personal, or vehicle loan EMIs with full month-by-month principal vs
                interest repayment breakdown schedules.
              </p>
              <Link
                to="/emi"
                className="text-xs text-primary font-semibold hover:underline mt-auto"
              >
                Calculate Loan EMI &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* Call to Action Banner */}
      <section className="my-8 mx-4 rounded-2xl bg-primary text-primary-content p-8 sm:p-12 text-center shadow-xl">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-extrabold sm:text-4xl">Ready to Optimize Your Finances?</h2>
          <p className="mt-3 text-base sm:text-lg opacity-90">
            Sign in with Google to start modeling your financial independence, investments, and
            compounding returns.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link
                to="/mutual-funds/lumpsum"
                className="btn btn-secondary btn-md sm:btn-lg font-semibold"
              >
                Start Calculating &rarr;
              </Link>
            ) : (
              <GoogleSignInButton
                text="signup_with"
                onSuccess={() => navigate('/', { replace: true })}
              />
            )}
            <Link
              to="/deposits/fd"
              className="btn btn-outline border-primary-content text-primary-content hover:bg-primary-content hover:text-primary btn-md sm:btn-lg font-semibold"
            >
              Deposit &amp; EMI Calculators &rarr;
            </Link>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="border-t border-base-300 py-8 px-4 text-center text-xs opacity-60 space-y-2">
        <p>
          &copy; {new Date().getFullYear()} Rupee Calculator. Built for financial intelligence and
          precision.
        </p>
        <p>
          Data sourced from AMFI India, World Bank Open Data, and IMF DataMapper. For educational
          and analytical purposes.
        </p>
      </footer>
    </div>
  );
};
export default Home;
