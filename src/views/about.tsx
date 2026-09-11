'use client';
import SEOHead from '../components/SEOHead';
import Breadcrumb from '../components/Breadcrumb';
import { Link } from '@/navigation';
import { FiShield, FiZap, FiCheckCircle, FiDatabase, FiGlobe } from 'react-icons/fi';
import styles from './StaticDocPage.module.scss';
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
    icon: <FiDatabase />,
  },
  {
    name: 'World Bank Open Data',
    url: 'https://data.worldbank.org/',
    usage:
      'Purchasing Power Parity (PPP) conversion factors, GDP per capita, and macroeconomic indicators for 150+ countries.',
    icon: <FiGlobe />,
  },
  {
    name: 'IMF DataMapper (International Monetary Fund)',
    url: 'https://www.imf.org/external/datamapper/',
    usage:
      'Historical Consumer Price Index (CPI) inflation data and forward IMF forecasts for India and global economies.',
    icon: <FiDatabase />,
  },
];
const About = () => {
  return (
    <main className={styles.container}>
      <SEOHead
        title="About Rupee Calculator — Free Indian Financial Calculators"
        description="Rupee Calculator is India's most precise, free financial calculator suite. Learn about our mission, data sources (AMFI, World Bank, IMF), and privacy-first approach."
        canonicalPath="/about"
        schema={aboutSchema}
        noIndex={false}
      />
      <Breadcrumb items={[{ name: 'Home', href: '/' }, { name: 'About Rupee Calculator' }]} />
      <header className={styles.header}>
        <div className={styles.badge}>Our Mission</div>
        <h1 className={styles.title}>About Rupee Calculator</h1>
        <p className={styles.subtitle}>
          Rupee Calculator is a free, privacy-first financial intelligence suite built specifically
          for Indian retail investors, NRIs, salaried professionals, and financial planners. Our
          goal: give every Indian access to institutional-grade financial modeling without ads,
          paywalls, or data harvesting.
        </p>
      </header>
      {/* Mission */}
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Our Mission</h2>
        <p className={styles.paragraph}>
          Personal finance in India is dominated by platforms that monetize your data, push
          financial products via aggressive recommendations, or bury accurate tools behind
          registration forms. We built Rupee Calculator to be the antithesis of that.
        </p>
        <p className={styles.paragraph}>
          Every calculation — from a ₹500/month SIP projection to a ₹2 Crore home loan amortization
          schedule — runs entirely in your browser using JavaScript. Your salary figures, investment
          amounts, and loan balances are never transmitted to any server, stored in any database, or
          shared with any third party.
        </p>
      </section>
      {/* USPs */}
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Why We're Different</h2>
        <div className={styles.cardGrid}>
          <div className={styles.card}>
            <div className={styles.cardTitleGroup}>
              <FiShield />
              <span>100% Client-Side Privacy</span>
            </div>
            <p className={styles.paragraph}>
              All mathematical models, compound interest algorithms, EMI schedules, and SIP/SWP
              projections execute locally in your browser. Zero server calls for calculations.
            </p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardTitleGroup}>
              <FiZap />
              <span>Institutional Precision</span>
            </div>
            <p className={styles.paragraph}>
              Calculators use the exact mathematical formulas employed by Indian banks, AMFI, and
              financial institutions — not simplified approximations. EMI includes part-payments and
              floating rate scenarios.
            </p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardTitleGroup}>
              <FiCheckCircle />
              <span>Verified Live Data</span>
            </div>
            <p className={styles.paragraph}>
              Mutual fund NAVs from AMFI, PPP metrics from World Bank, and inflation from IMF
              DataMapper — all official institutional data sources, updated regularly.
            </p>
          </div>
        </div>
      </section>
      {/* Data Sources */}
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Data Sources & Methodology</h2>
        <div className={styles.section}>
          {DATA_SOURCES.map((src) => (
            <div key={src.name} className={styles.card}>
              <div className={styles.sourceItem}>
                <div className={styles.sourceIcon}>{src.icon}</div>
                <div>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.sourceLink}
                  >
                    {src.name} ↗
                  </a>
                  <p className={styles.sourceUsage}>{src.usage}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* Tools */}
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Available Financial Calculators</h2>
        <p className={styles.paragraph}>
          Rupee Calculator provides 8+ institutional-grade tools covering all major personal finance
          scenarios for Indian investors:
        </p>
        <ul className={styles.toolsGrid}>
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
              <Link to={tool.href} className={styles.toolCard}>
                <span className={styles.toolName}>{tool.name}</span>
                <span className={styles.toolDesc}>{tool.desc}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      {/* Disclaimer Notice */}
      <section className={styles.calloutWarning}>
        <p className={styles.calloutTitle}>Educational Purpose Disclaimer</p>
        <p className={styles.calloutText}>
          All calculators are for educational and analytical purposes only. Results are projections
          based on user-provided inputs and historical data — they do not constitute financial
          advice. Please consult a SEBI-registered financial advisor before making investment
          decisions.{' '}
          <Link to="/disclaimer" className={styles.link}>
            Read full disclaimer →
          </Link>
        </p>
      </section>
    </main>
  );
};
export default About;
