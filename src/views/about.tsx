'use client';
import React from 'react';
import SEOHead from '../components/SEOHead';
import Breadcrumb from '../components/Breadcrumb';
import { Link } from '@/navigation';
import { FiShield, FiZap, FiCheckCircle } from 'react-icons/fi';
import { aboutSchema } from '../data/seo/aboutSchema';
import { AboutDataSourcesSection } from './about/AboutDataSourcesSection';
import { AboutToolsSection } from './about/AboutToolsSection';
import styles from './StaticDocPage.module.scss';
const About: React.FC = () => {
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
        <h2 className={styles.sectionHeading}>Why We&apos;re Different</h2>
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
      <AboutDataSourcesSection />
      <AboutToolsSection />
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
