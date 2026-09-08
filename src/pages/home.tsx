import { useMemo, useState } from 'react';
import Link from '../components/PrefetchLink';
import {
  FiBarChart2,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiGlobe,
  FiLayers,
  FiPercent,
  FiRepeat,
  FiShield,
  FiTool,
  FiTrendingUp,
  FiZap,
} from 'react-icons/fi';
import { useAuth } from '../context/useAuth';
import convertToWords, { getCurrencySymbol } from '../utilities/currency';
import SEOHead from '../components/SEOHead';
import { trackCalculatorEvent } from '../utilities/analytics';
import styles from './Home.module.scss';
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
            text: 'Rupee Calculator provides 9+ institutional-grade tools including SIP Calculator, SWP Calculator, Fixed Deposit (FD) Compounding Calculator, Recurring Deposit (RD) Calculator, Loan EMI & Amortization Calculator, Inflation Calculator, Purchasing Power Parity (PPP) Converter, Live Currency Converter, and Mutual Fund CAGR Analytics Engine.',
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
    <div className={styles.pageContainer}>
      <SEOHead
        title="Free Online Financial Calculators India — SIP, EMI, FD, SWP & More | Rupee Calculator"
        description="Calculate SIP returns, compound interest, EMI amortization, SWP withdrawals, inflation impact & PPP with 100% free, private financial tools. Trusted by Indian investors."
        keywords="rupee calculator, compound interest calculator India, SIP calculator, SWP calculator, mutual fund return calculator, EMI calculator, inflation calculator India, PPP calculator, financial planning tools India, financial calculator online, investment calculator, loan calculator, savings calculator, retirement calculator, mutual fund calculator, FD calculator, RD calculator"
        canonicalPath="/"
        schema={homeSchema}
      />
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroBadge}>
            Institutional Precision &bull; 100% Free &amp; Private &bull; Real-Time Data
          </div>
          <h1 className={styles.heroTitle}>
            Rupee Calculator —{' '}
            <span className={styles.heroGradient}>
              Free SIP, FD, EMI &amp; Mutual Fund Tools for India
            </span>
          </h1>
          <p className={styles.heroDesc}>
            High-performance financial intelligence engine. Simulate Compound Interest, backtest SIP
            &amp; SWP scenarios, compare historical Mutual Fund NAVs, and model global Purchasing
            Power Parity in real time.
          </p>
          <div className={styles.heroActions}>
            <Link
              to="/sip-calculator"
              className={styles.btnPrimary}
            >
              Open SIP Calculator &rarr;
            </Link>
            <Link
              to="/mutual-funds/lumpsum"
              className={styles.btnOutline}
            >
              Mutual Fund Engine
            </Link>
            <Link to="/fd-calculator" className={styles.btnGhost}>
              Deposit &amp; EMI Tools &rarr;
            </Link>
          </div>
          {isAuthenticated && user && (
            <p className={styles.userNotice}>
              Signed in as <strong>{user.email}</strong>
            </p>
          )}
          {/* Trust Metrics */}
          <div className={styles.metricsGrid}>
            <div className={styles.metricItem}>
              <div className={styles.metricNumber}>10+</div>
              <div className={styles.metricLabel}>Financial &amp; Utility Tools</div>
            </div>
            <div className={styles.metricItem}>
              <div className={styles.metricNumber}>0ms</div>
              <div className={styles.metricLabel}>Client Calculation Lag</div>
            </div>
            <div className={styles.metricItem}>
              <div className={styles.metricNumber}>AMFI &amp; IMF</div>
              <div className={styles.metricLabel}>Verified Live Data</div>
            </div>
            <div className={styles.metricItem}>
              <div className={styles.metricNumber}>100%</div>
              <div className={styles.metricLabel}>Private &amp; Local</div>
            </div>
          </div>
        </div>
      </section>
      {/* Interactive Quick Calculator Preview */}
      <section className={styles.simulatorSection}>
        <div className={styles.simulatorInner}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Interactive Wealth Growth Simulator</h2>
            <p className={styles.sectionSubtitle}>
              See the mathematical magic of compound interest and systematic compounding in action.
            </p>
          </div>
          <div className={styles.simulatorGrid}>
            {/* Interactive Inputs */}
            <div className={styles.inputsCard}>
              <div className={styles.sliderGroup}>
                <div className={styles.sliderHeader}>
                  <span>Monthly Investment</span>
                  <span className={styles.sliderValue}>
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
                  className={styles.rangeSlider}
                />
                <span className={styles.wordsNote}>
                  {convertToWords(monthlySip, 'en-IN')}
                </span>
              </div>
              <div className={styles.sliderGroup}>
                <div className={styles.sliderHeader}>
                  <span>Expected Annual Return (CAGR)</span>
                  <span className={styles.sliderValue}>{expectedRoi}%</span>
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
                  className={styles.rangeSlider}
                />
              </div>
              <div className={styles.sliderGroup}>
                <div className={styles.sliderHeader}>
                  <span>Investment Horizon</span>
                  <span className={styles.sliderValue}>{tenureYears} Years</span>
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
                  className={styles.rangeSlider}
                />
              </div>
            </div>
            {/* Live Result Card */}
            <div className={styles.resultCard}>
              <div className={styles.resultTag}>
                Projected Maturity Value
              </div>
              <div className={styles.resultAmount}>
                {currencySymbol}
                {quickCalc.maturityAmount.toLocaleString('en-IN')}
              </div>
              <div className={styles.resultWords}>
                {convertToWords(quickCalc.maturityAmount, 'en-IN')}
              </div>
              <div className={styles.resultBreakdown}>
                <div>
                  <div className={styles.resultSubLabel}>Total Invested</div>
                  <div className={styles.resultSubValue}>
                    {currencySymbol}
                    {quickCalc.totalInvested.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div className={styles.resultSubLabel}>Estimated Wealth Gained</div>
                  <div className={styles.gainValue}>
                    +{currencySymbol}
                    {quickCalc.estimatedReturns.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
              <div className={styles.multiplierRow}>
                <span>Wealth Multiplier:</span>
                <span className={styles.badgePrimary}>
                  {quickCalc.wealthMultiple}x Capital
                </span>
              </div>
              <div className={styles.resultCardActions}>
                <Link to="/sip-calculator" className={styles.btnPrimary}>
                  Open SIP Calculator &rarr;
                </Link>
                <Link to="/mutual-funds/sip" className={styles.btnOutline}>
                  Mutual Fund SIP &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Product Feature Pillars */}
      <section className={styles.pillarsSection}>
        <div className={styles.pillarsInner}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Explore Financial Calculators</h2>
            <p className={styles.sectionSubtitle}>
              Engineered for precision, clarity, and comprehensive financial decision-making.
            </p>
          </div>
          <div className={styles.pillarsGrid}>
            <div className={styles.pillarCard}>
              <div>
                <h3 className={styles.pillarHeading}>
                  <FiTrendingUp className={styles.pillarIcon} /> Mutual Fund Engine
                </h3>
                <p className={styles.pillarDesc}>
                  Search thousands of AMFI mutual funds with live NAV history. Analyze CAGR,
                  benchmark growth, and visualize historical lumpsum and SIP performance.
                </p>
              </div>
              <Link
                to="/mutual-funds/lumpsum"
                className={styles.pillarLink}
              >
                Explore Mutual Funds &rarr;
              </Link>
            </div>
            <div className={styles.pillarCard}>
              <div>
                <h3 className={styles.pillarHeading}>
                  <FiClock className={styles.pillarIcon} /> SIP &amp; SWP Planning
                </h3>
                <p className={styles.pillarDesc}>
                  Calculate forward systematic investments or retirement withdrawals. Model target
                  capital accumulation or monthly income sustainability.
                </p>
              </div>
              <Link
                to="/sip-calculator"
                className={styles.pillarLink}
              >
                Explore Systematic Plans &rarr;
              </Link>
            </div>
            <div className={styles.pillarCard}>
              <div>
                <h3 className={styles.pillarHeading}>
                  <FiLayers className={styles.pillarIcon} /> Fixed &amp; Recurring
                  Deposits
                </h3>
                <p className={styles.pillarDesc}>
                  High-precision compound interest calculator with support for monthly, quarterly,
                  semi-annual, and annual compounding frequencies.
                </p>
              </div>
              <Link
                to="/fd-calculator"
                className={styles.pillarLink}
              >
                Explore Deposit Plans &rarr;
              </Link>
            </div>
            <div className={styles.pillarCard}>
              <div>
                <h3 className={styles.pillarHeading}>
                  <FiGlobe className={styles.pillarIcon} /> Purchasing Power Parity
                  (PPP)
                </h3>
                <p className={styles.pillarDesc}>
                  Convert salary and living costs across 150+ countries using real World Bank PPP
                  conversion factors and currency mappings.
                </p>
              </div>
              <Link
                to="/ppp-calculator"
                className={styles.pillarLink}
              >
                Calculate Global PPP &rarr;
              </Link>
            </div>
            <div className={styles.pillarCard}>
              <div>
                <h3 className={styles.pillarHeading}>
                  <FiBarChart2 className={styles.pillarIcon} /> Inflation Modeling
                </h3>
                <p className={styles.pillarDesc}>
                  Understand the true purchasing power erosion over decades with IMF historical
                  inflation data and forward forecasts.
                </p>
              </div>
              <Link
                to="/inflation-calculator"
                className={styles.pillarLink}
              >
                Explore Inflation Rates &rarr;
              </Link>
            </div>
            <div className={styles.pillarCard}>
              <div>
                <h3 className={styles.pillarHeading}>
                  <FiPercent className={styles.pillarIcon} /> EMI &amp; Loan
                  Amortization
                </h3>
                <p className={styles.pillarDesc}>
                  Calculate home, personal, or vehicle loan EMIs with full month-by-month principal
                  vs interest repayment breakdown schedules.
                </p>
              </div>
              <Link
                to="/emi-calculator"
                className={styles.pillarLink}
              >
                Calculate Loan EMI &rarr;
              </Link>
            </div>
            <div className={styles.pillarCard}>
              <div>
                <h3 className={styles.pillarHeading}>
                  <FiTool className={styles.pillarIcon} /> Mathematical Calculator
                </h3>
                <p className={styles.pillarDesc}>
                  Full-featured basic and scientific calculator with trigonometry, logarithms,
                  powers, factorials, and degree/radian support.
                </p>
              </div>
              <Link to="/calculator" className={styles.pillarLink}>
                Open Calculator &rarr;
              </Link>
            </div>
            <div className={styles.pillarCard}>
              <div>
                <h3 className={styles.pillarHeading}>
                  <FiCalendar className={styles.pillarIcon} /> Date Calculator
                </h3>
                <p className={styles.pillarDesc}>
                  Calculate exact days, weeks, months, and years between dates or add and subtract
                  time intervals from any date.
                </p>
              </div>
              <Link
                to="/date-calculator"
                className={styles.pillarLink}
              >
                Open Date Calculator &rarr;
              </Link>
            </div>
            <div className={styles.pillarCard}>
              <div>
                <h3 className={styles.pillarHeading}>
                  <FiRepeat className={styles.pillarIcon} /> Currency Converter
                </h3>
                <p className={styles.pillarDesc}>
                  Convert 160+ global currencies in real time with live mid-market forex rates, zero
                  bank markups, and instant bidirectional calculation.
                </p>
              </div>
              <Link
                to="/currency-converter"
                className={styles.pillarLink}
              >
                Open Currency Converter &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* Why Choose Rupee Calculator */}
      <section className={styles.whySection}>
        <div className={styles.pillarsInner}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              Why Indian Investors Choose Rupee Calculator
            </h2>
            <p className={styles.sectionSubtitle}>
              The premier privacy-first financial simulation suite in India.
            </p>
          </div>
          <div className={styles.whyGrid}>
            <div className={styles.whyCard}>
              <div className={styles.whyTitleGroup}>
                <FiShield />
                <span>100% Client-Side Privacy</span>
              </div>
              <p className={styles.whyText}>
                Zero data tracking. Your salary, loan balances, and investment amounts never leave
                your browser.
              </p>
            </div>
            <div className={styles.whyCard}>
              <div className={styles.whyTitleGroup}>
                <FiZap />
                <span>Zero Calculation Lag (0ms)</span>
              </div>
              <p className={styles.whyText}>
                Instant interactive feedback with responsive sliders and real-time amortization
                generation.
              </p>
            </div>
            <div className={styles.whyCard}>
              <div className={styles.whyTitleGroup}>
                <FiCheckCircle />
                <span>Official Institutional Data</span>
              </div>
              <p className={styles.whyText}>
                Live mutual fund NAV feeds from AMFI, global PPP metrics from World Bank, and CPI
                inflation from IMF.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Homepage FAQ Section */}
      <section className={styles.faqSection}>
        <div className={styles.faqInner}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
            <p className={styles.sectionSubtitle}>
              Everything you need to know about Rupee Calculator and financial modeling.
            </p>
          </div>
          <div className={styles.faqList}>
            {homeFaqs.map((faq, idx) => (
              <details
                key={idx}
                className={styles.faqItem}
              >
                <summary className={styles.faqSummary}>
                  <span>{faq.question}</span>
                  <span className={styles.faqArrow}>
                    &darr;
                  </span>
                </summary>
                <p className={styles.faqAnswer}>
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
      {/* Call to Action Banner */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaInner}>
          <h2 className={styles.ctaTitle}>Ready to Optimize Your Finances?</h2>
          <p className={styles.ctaDesc}>
            Model your wealth compounding, loan repayments, and investment strategies with zero lag.
          </p>
          <div className={styles.ctaActions}>
            <Link to="/sip-calculator" className={styles.btnCtaSecondary}>
              Start Calculating Now &rarr;
            </Link>
            <Link
              to="/fd-calculator"
              className={styles.btnCtaOutline}
            >
              Deposit &amp; EMI Tools &rarr;
            </Link>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerLinks}>
          <Link to="/about" className={styles.footerLink}>
            About
          </Link>
          <span className={styles.footerDot}>&bull;</span>
          <Link to="/privacy" className={styles.footerLink}>
            Privacy Policy
          </Link>
          <span className={styles.footerDot}>&bull;</span>
          <Link to="/disclaimer" className={styles.footerLink}>
            Disclaimer
          </Link>
        </div>
        <p className={styles.footerCopyright}>
          &copy; {new Date().getFullYear()} Rupee Calculator &bull; Educational and analytical
          purposes only.
        </p>
      </footer>
    </div>
  );
};
export default Home;
