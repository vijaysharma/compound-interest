'use client';
import React from 'react';
import SEOHead from '../components/SEOHead';
import { homeSchema } from '../data/seo/homeSchema';
import { HomeHeroSection } from './home/HomeHeroSection';
import { HomeWealthSimulator } from './home/HomeWealthSimulator';
import { HomePillarsSection } from './home/HomePillarsSection';
import { HomeWhySection } from './home/HomeWhySection';
import { HomeFaqSection } from './home/HomeFaqSection';
import { HomeCtaSection } from './home/HomeCtaSection';
import { HomeFooter } from './home/HomeFooter';
import styles from './Home.module.scss';
const Home: React.FC = () => {
  return (
    <div className={styles.pageContainer}>
      <SEOHead
        title="Free Online Financial Calculators India — SIP, EMI, FD, SWP & More | Rupee Calculator"
        description="Calculate SIP returns, compound interest, EMI amortization, SWP withdrawals, inflation impact & PPP with 100% free, private financial tools. Trusted by Indian investors."
        keywords="rupee calculator, compound interest calculator India, SIP calculator, SWP calculator, mutual fund return calculator, EMI calculator, inflation calculator India, PPP calculator, financial planning tools India, financial calculator online, investment calculator, loan calculator, savings calculator, retirement calculator, mutual fund calculator, FD calculator, RD calculator"
        canonicalPath="/"
        schema={homeSchema}
      />
      <HomeHeroSection />
      <HomeWealthSimulator />
      <HomePillarsSection />
      <HomeWhySection />
      <HomeFaqSection />
      <HomeCtaSection />
      <HomeFooter />
    </div>
  );
};
export default Home;
