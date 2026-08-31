import SEOHead from '../components/SEOHead';
import Breadcrumb from '../components/Breadcrumb';
import { Link } from 'react-router-dom';
import { FiShield, FiZap, FiCheckCircle, FiDatabase, FiGlobe } from 'react-icons/fi';
const aboutSchema = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'About Rupee Calculator',
  url: 'https://rupees.vercel.app/about',
  description:
    'Rupee Calculator is a free, privacy-first financial calculator suite built for Indian investors. Learn about our mission, data sources, and technology.',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://rupees.vercel.app/' },
      { '@type': 'ListItem', position: 2, name: 'About', item: 'https://rupees.vercel.app/about' },
    ],
  },
};
const DATA_SOURCES = [
  {
    name: 'AMFI India (Association of Mutual Funds in India)',
    url: 'https://www.amfiindia.com/',
    usage:
      'Live mutual fund NAV history, scheme metadata, and fund house data for all 2,000+ SEBI-registered schemes.',
    icon: <FiDatabase className="h-5 w-5 text-primary" />,
  },
  {
    name: 'World Bank Open Data',
    url: 'https://data.worldbank.org/',
    usage:
      'Purchasing Power Parity (PPP) conversion factors, GDP per capita, and macroeconomic indicators for 150+ countries.',
    icon: <FiGlobe className="h-5 w-5 text-primary" />,
  },
  {
    name: 'IMF DataMapper (International Monetary Fund)',
    url: 'https://www.imf.org/external/datamapper/',
    usage:
      'Historical Consumer Price Index (CPI) inflation data and forward IMF forecasts for India and global economies.',
    icon: <FiDatabase className="h-5 w-5 text-primary" />,
  },
];
const About = () => {
  return (
    <main className="w-full max-w-4xl mx-auto px-4 py-8">
      <SEOHead
        title="About Rupee Calculator — Free Indian Financial Calculators"
        description="Rupee Calculator is India's most precise, free financial calculator suite. Learn about our mission, data sources (AMFI, World Bank, IMF), and privacy-first approach."
        canonicalPath="/about"
        schema={aboutSchema}
        noIndex={false}
      />
      <Breadcrumb items={[{ name: 'Home', href: '/' }, { name: 'About Rupee Calculator' }]} />
      <header className="mb-10">
        <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
          Our Mission
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
          About Rupee Calculator
        </h1>
        <p className="text-base opacity-80 leading-relaxed max-w-2xl">
          Rupee Calculator is a free, privacy-first financial intelligence suite built specifically
          for Indian retail investors, NRIs, salaried professionals, and financial planners. Our
          goal: give every Indian access to institutional-grade financial modeling without ads,
          paywalls, or data harvesting.
        </p>
      </header>
      {/* Mission */}
      <section className="mb-12 space-y-4">
        <h2 className="text-2xl font-bold">Our Mission</h2>
        <p className="text-sm opacity-80 leading-relaxed">
          Personal finance in India is dominated by platforms that monetize your data, push
          financial products via aggressive recommendations, or bury accurate tools behind
          registration forms. We built Rupee Calculator to be the antithesis of that.
        </p>
        <p className="text-sm opacity-80 leading-relaxed">
          Every calculation — from a ₹500/month SIP projection to a ₹2 Crore home loan amortization
          schedule — runs entirely in your browser using JavaScript. Your salary figures, investment
          amounts, and loan balances are never transmitted to any server, stored in any database, or
          shared with any third party.
        </p>
      </section>
      {/* USPs */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Why We're Different</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="card bg-base-100 border border-base-300 p-5 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold">
              <FiShield className="h-5 w-5" />
              <span>100% Client-Side Privacy</span>
            </div>
            <p className="text-xs sm:text-sm opacity-75 leading-relaxed">
              All mathematical models, compound interest algorithms, EMI schedules, and SIP/SWP
              projections execute locally in your browser. Zero server calls for calculations.
            </p>
          </div>
          <div className="card bg-base-100 border border-base-300 p-5 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold">
              <FiZap className="h-5 w-5" />
              <span>Institutional Precision</span>
            </div>
            <p className="text-xs sm:text-sm opacity-75 leading-relaxed">
              Calculators use the exact mathematical formulas employed by Indian banks, AMFI, and
              financial institutions — not simplified approximations. EMI includes part-payments and
              floating rate scenarios.
            </p>
          </div>
          <div className="card bg-base-100 border border-base-300 p-5 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold">
              <FiCheckCircle className="h-5 w-5" />
              <span>Verified Live Data</span>
            </div>
            <p className="text-xs sm:text-sm opacity-75 leading-relaxed">
              Mutual fund NAVs from AMFI, PPP metrics from World Bank, and inflation from IMF
              DataMapper — all official institutional data sources, updated regularly.
            </p>
          </div>
        </div>
      </section>
      {/* Data Sources */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Data Sources & Methodology</h2>
        <div className="space-y-4">
          {DATA_SOURCES.map((src) => (
            <div key={src.name} className="card bg-base-100 border border-base-300 p-5 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{src.icon}</div>
                <div>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-sm hover:text-primary hover:underline transition-colors"
                  >
                    {src.name} ↗
                  </a>
                  <p className="text-xs opacity-75 leading-relaxed mt-1">{src.usage}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* Tools */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Available Financial Calculators</h2>
        <p className="text-sm opacity-70 mb-5">
          Rupee Calculator provides 8+ institutional-grade tools covering all major personal finance
          scenarios for Indian investors:
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {[
            {
              name: 'SIP Calculator',
              href: '/sip-calculator',
              desc: 'Systematic Investment Plan returns & corpus projection',
            },
            {
              name: 'SWP Calculator',
              href: '/swp-calculator',
              desc: 'Retirement withdrawal planning & corpus longevity',
            },
            {
              name: 'FD Calculator',
              href: '/fd-calculator',
              desc: 'Fixed Deposit compound interest & maturity value',
            },
            {
              name: 'RD Calculator',
              href: '/rd-calculator',
              desc: 'Recurring Deposit returns with monthly compounding',
            },
            {
              name: 'EMI Calculator',
              href: '/emi-calculator',
              desc: 'Loan amortization with part-payment & rate change modeling',
            },
            {
              name: 'Inflation Calculator',
              href: '/inflation-calculator',
              desc: 'Purchasing power erosion with IMF CPI data',
            },
            {
              name: 'PPP Calculator',
              href: '/ppp-calculator',
              desc: 'Global salary comparison across 150+ countries',
            },
            {
              name: 'Mutual Fund Engine',
              href: '/mutual-funds/sip',
              desc: 'Live AMFI NAV history & CAGR analysis',
            },
          ].map((tool) => (
            <li key={tool.href}>
              <Link
                to={tool.href}
                className="flex flex-col p-3 rounded-lg border border-base-300 bg-base-100 hover:border-primary/40 hover:bg-primary/5 transition-colors"
              >
                <span className="font-semibold text-primary text-sm">{tool.name}</span>
                <span className="text-xs opacity-60 mt-0.5">{tool.desc}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      {/* Disclaimer Notice */}
      <section className="p-5 bg-warning/10 border border-warning/30 rounded-xl text-sm">
        <p className="font-semibold mb-1">Educational Purpose Disclaimer</p>
        <p className="opacity-80 leading-relaxed text-xs">
          All calculators are for educational and analytical purposes only. Results are projections
          based on user-provided inputs and historical data — they do not constitute financial
          advice. Please consult a SEBI-registered financial advisor before making investment
          decisions.{' '}
          <Link to="/disclaimer" className="text-primary hover:underline">
            Read full disclaimer →
          </Link>
        </p>
      </section>
    </main>
  );
};
export default About;
