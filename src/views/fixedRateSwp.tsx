'use client';
import { useMemo, useState } from 'react';
import DisplayCard from '../components/DisplayCard';
import ValuePicker from '../components/ValuePicker';
import { sanctnum } from '../utilities/numSanitity';
import { RT } from '../types/types';
import JoinedButtonGroup from '../components/JoinedButtonGroup';
import SEOHead from '../components/SEOHead';
import CalculatorContentSection from '../components/CalculatorContentSection';
import styles from './CalculatorPage.module.scss';
const swpSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FinancialProduct',
      name: 'Systematic Withdrawal Plan (SWP) Calculator India',
      description:
        'Calculates monthly pension cashflows, inflation-adjusted systematic withdrawals, and remaining portfolio longevity from mutual fund investments.',
      category: 'InvestmentAccount',
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
          name: 'SWP Calculator',
          item: 'https://rupees.vercel.app/swp-calculator',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is a Systematic Withdrawal Plan (SWP) in mutual funds?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A Systematic Withdrawal Plan (SWP) allows investors to withdraw a predetermined sum of money from their mutual fund scheme at regular intervals (monthly or quarterly), while the remaining balance continues to generate market-linked returns.',
          },
        },
        {
          '@type': 'Question',
          name: 'Why is SWP more tax-efficient than Fixed Deposit monthly interest payout?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'In an FD, the entire monthly interest payout is taxed at your income tax slab rate. In an SWP, each withdrawal is treated as a redemption of units composed of both principal (tax-free capital) and capital gains. Only the capital gains portion is subject to LTCG/STCG tax, resulting in drastically lower annual tax liability.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is a Safe Withdrawal Rate (SWR) for retirement in India?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Due to higher historical CPI inflation in India (5-7%), a Safe Withdrawal Rate of 3.5% to 4.0% of your initial retirement corpus in Year 1 (subsequently adjusted annually for inflation) is recommended to ensure your corpus lasts 30+ years without exhaustion.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is SWP in mutual fund?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A Systematic Withdrawal Plan (SWP) allows you to withdraw a fixed amount from your mutual fund investment at regular intervals (monthly, quarterly, or annually) while keeping the remaining corpus invested. Unlike FD interest payouts, SWP withdrawals are a mix of capital redemption and gains, making them more tax-efficient — only the capital gains portion is taxed, not the entire withdrawal amount.',
          },
        },
        {
          '@type': 'Question',
          name: 'How much corpus do I need for ₹50,000 monthly pension through SWP?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Using the 4% safe withdrawal rate (SWR) rule adapted for India, you need approximately ₹1.5 Crore corpus to sustain ₹50,000/month (₹6 Lakh/year) indefinitely. However, if your mutual fund earns 9–10% annual returns and inflation averages 6%, a corpus of ₹1 Crore can sustain ₹50,000/month for approximately 25–30 years with the residual balance still growing.',
          },
        },
      ],
    },
    {
      '@type': 'WebApplication',
      name: 'SWP Calculator — Rupee Calculator',
      url: 'https://rupees.vercel.app/swp-calculator',
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
const swpFaqs = [
  {
    question: 'How does an inflation-indexed SWP protect retirement purchasing power?',
    answer:
      'Fixed monthly pension amounts lose half their purchasing power over 12-15 years due to inflation. An inflation-adjusted SWP gradually increases your monthly payout (e.g., by 6% annually) so your living standard remains constant throughout retirement.',
  },
  {
    question: 'What happens to the remaining balance in an SWP account?',
    answer:
      'The unwithdrawn balance stays invested in your chosen mutual fund scheme (such as Hybrid / Balanced Advantage or Equity Savings funds), continuing to earn compounding returns and offsetting the impact of withdrawals.',
  },
  {
    question: 'Which mutual fund categories are best suited for setting up an SWP?',
    answer:
      'For retirees seeking steady cashflow without extreme volatility, Balanced Advantage Funds (BAFs), Conservative Hybrid Funds, Equity Savings Funds, and Multi-Asset Allocation Funds are popular choices due to lower drawdown risk compared to pure small/mid-cap equities.',
  },
  {
    question: 'Can I change my SWP withdrawal amount or stop it at any time?',
    answer:
      'Yes. You can increase, decrease, or terminate your monthly SWP mandate at any time through your mutual fund portal or AMC without penalty.',
  },
  {
    question: 'What is SWP in mutual fund?',
    answer:
      'A Systematic Withdrawal Plan (SWP) allows you to withdraw a fixed amount from your mutual fund investment at regular intervals (monthly, quarterly, or annually) while keeping the remaining corpus invested. Unlike FD interest payouts, SWP withdrawals are a mix of capital redemption and gains, making them more tax-efficient — only the capital gains portion is taxed, not the entire withdrawal amount.',
  },
  {
    question: 'How much corpus do I need for ₹50,000 monthly pension through SWP?',
    answer:
      'Using the 4% safe withdrawal rate (SWR) rule adapted for India, you need approximately ₹1.5 Crore corpus to sustain ₹50,000/month (₹6 Lakh/year) indefinitely. However, if your mutual fund earns 9–10% annual returns and inflation averages 6%, a corpus of ₹1 Crore can sustain ₹50,000/month for approximately 25–30 years with the residual balance still growing.',
  },
];
const FixedRateSWP = ({ className, title }: { className?: string; title?: string }) => {
  const [pa, setPa] = useState('35000000');
  const [rt, setRt] = useState('10');
  const [irt, setIRt] = useState('7');
  const [t, setT] = useState<RT>({
    tenure: '40',
    tenureFormat: 'y',
  });
  const [wa, setWa] = useState('120000');
  const [inflationFreq, setInflationFreq] = useState('12');
  const invStepData = [
    { id: 'ip1', value: '50000000', title: '5Cr' },
    { id: 'ip2', value: '5000000', title: '50L' },
    { id: 'ip3', value: '500000', title: '5L' },
    { id: 'ip4', value: '50000', title: '50K' },
    { id: 'ip5', value: '5000', title: '5K' },
    { id: 'ip6', value: '500', title: '500' },
    { id: 'ip7', value: '50', title: '50' },
  ];
  const wdStepData = [
    { id: 'wp1', value: '1000000', title: '10L' },
    { id: 'wp2', value: '100000', title: '1L' },
    { id: 'wp3', value: '50000', title: '50K' },
    { id: 'wp4', value: '10000', title: '10K' },
    { id: 'wp5', value: '1000', title: '1K' },
    { id: 'wp6', value: '100', title: '100' },
    { id: 'wp7', value: '10', title: '10' },
  ];
  const calculateRemainingAmount = (
    p: string,
    r: string,
    ir: string,
    irf: string,
    t: string,
    tf: string,
    w: string
  ) => {
    const tenure = tf === 'y' ? sanctnum(t) * 12 : sanctnum(t);
    const principal = sanctnum(p);
    const rate = sanctnum(r);
    const withdrawal = sanctnum(w);
    const inflationRate = sanctnum(ir);
    const inflationFreq = sanctnum(irf);
    let fa = principal;
    let wa = withdrawal;
    if (tenure <= 0) return ['0', `${fa}`];
    for (let i = 1; i <= tenure; i++) {
      wa =
        inflationRate && i > inflationFreq && (i - 1) % inflationFreq === 0
          ? wa * (1 + inflationRate / 100)
          : wa;
      fa = fa * (1 + rate / 100) ** (1 / 12) - wa;
    }
    return [`${wa}`, `${fa}`];
  };
  const [lwa, remainingAmount] = useMemo(
    () => calculateRemainingAmount(pa, rt, irt, inflationFreq, t.tenure, t.tenureFormat, wa),
    [pa, rt, irt, inflationFreq, t.tenure, t.tenureFormat, wa]
  );
  const initialInvested = parseInt(pa) || 0;
  const finalCorpus = parseInt(remainingAmount) || 0;
  const totalMonths = (t.tenureFormat === 'y' ? sanctnum(t.tenure) : sanctnum(t.tenure) / 12) * 12;
  const approxWithdrawn = Math.round(
    (((parseInt(wa) || 0) + (parseInt(lwa) || parseInt(wa) || 0)) / 2) * totalMonths
  );
  return (
    <main className={`${styles.container} ${styles.containerWide} ${className || ''}`}>
      <SEOHead
        title="SWP Calculator — Systematic Withdrawal Plan Calculator India 2026"
        description="Free SWP calculator to plan retirement income. Model monthly pension withdrawals, inflation-adjusted cashflows & corpus longevity from mutual funds. 100% private."
        keywords="SWP calculator, systematic withdrawal plan calculator, monthly pension calculator, retirement withdrawal calculator India, safe withdrawal rate India, retirement calculator, annuity calculator, retirement planning, safe withdrawal rate"
        canonicalPath="/swp-calculator"
        schema={swpSchema}
      />
      <header className={styles.header}>
        <div className={styles.badge}>
          Retirement Income &bull; Capital Longevity
        </div>
        <h1 className={styles.title}>
          Systematic Withdrawal Plan (SWP) Calculator for Retirement
        </h1>
        <p className={styles.subtitle}>
          Simulate monthly retirement payouts, inflation adjustments, and residual portfolio
          longevity.
        </p>
      </header>
      <div className={styles.calculatorGrid}>
        <div className={styles.inputsCol}>
          <div className={styles.formStack}>
            {title && <h5 className={styles.sectionTitle}>{title}</h5>}
            <ValuePicker
              className={styles.field}
              value={pa}
              onChange={setPa}
              title="Invested Amount"
              stepData={invStepData}
              tabs={[]}
            />
            <ValuePicker
              className={styles.field}
              value={wa}
              onChange={setWa}
              stepData={wdStepData}
              title="Withdrawal amount per month"
              tabs={[]}
            />
            <ValuePicker.ROI className={styles.field} value={rt} onChange={setRt} title="Expected return rate per annum (%)" />
            <ValuePicker.ROI className={styles.field} value={irt} onChange={setIRt} title="Inflation rate (%)" />
            <JoinedButtonGroup
              title="Inflation calculated per"
              className={styles.fieldTight}
              selectedValue={inflationFreq}
              updateSelectedValue={setInflationFreq}
              sizePrefix="sm"
              data={[
                { id: 'ir1', title: '6M', value: '6' },
                { id: 'ir2', title: '1Y', value: '12' },
                { id: 'ir3', title: '2Y', value: '24' },
                { id: 'ir4', title: '3Y', value: '36' },
                { id: 'ir5', title: '4Y', value: '48' },
                { id: 'ir6', title: '5Y', value: '60' },
              ]}
            />
            <ValuePicker.Tenure className={styles.fieldLast} rt={t} setRt={setT} />
          </div>
        </div>
        <div className={styles.resultsCol}>
          <DisplayCard
            colorClass={parseInt(remainingAmount) < parseInt(pa) ? 'error' : 'primary'}
            primaryAmount={parseInt(remainingAmount)}
            secondaryInfo={{
              title: 'Last monthly withdrawal',
              amount: parseInt(lwa),
            }}
          />
          <div className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
              <span>Portfolio Longevity Summary</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                {t.tenure} {t.tenureFormat === 'y' ? 'Years' : 'Months'} @ {rt}% ROI
              </span>
            </div>
            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Initial Investment</span>
                <span className={`${styles.statValue} ${styles.statValuePrimary}`}>
                  ₹{initialInvested.toLocaleString('en-IN')}
                </span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Est. Total Withdrawn</span>
                <span className={`${styles.statValue} ${styles.statValueSuccess}`}>
                  ₹{approxWithdrawn.toLocaleString('en-IN')}
                </span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Remaining Balance</span>
                <span className={styles.statValue}>
                  ₹{finalCorpus.toLocaleString('en-IN')}
                </span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Monthly Payout (Final)</span>
                <span className={styles.statValue}>
                  ₹{parseInt(lwa).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CalculatorContentSection
        title="Mastering Sustainable Retirement Cashflows with SWP"
        subtitle="A Systematic Withdrawal Plan (SWP) is a modern financial strategy that allows retirees and wealth planners to generate regular monthly income from an accumulated mutual fund corpus while keeping remaining capital invested in compounding assets."
        comparisonTable={{
          headers: [
            'Parameter',
            'Mutual Fund SWP',
            'Bank FD Monthly Interest',
            'Annuity Insurance Policy',
          ],
          rows: [
            [
              'Monthly Cashflow Structure',
              'Flexible (Can be modified or stopped)',
              'Fixed interest on principal',
              'Fixed life annuity payment',
            ],
            [
              'Tax Efficiency',
              'High (Only capital gains portion taxed)',
              'Poor (Entire interest taxed at slab)',
              'Poor (Annuity income fully taxable)',
            ],
            [
              'Corpus Growth Potential',
              'High (Remaining balance compounds)',
              'Zero (Principal stays static)',
              'Zero (Principal forfeited to insurer)',
            ],
            [
              'Inflation Protection',
              'Yes (Can step up withdrawals)',
              'No (Fixed payout loses real value)',
              'No (Fixed payout)',
            ],
            [
              'Inheritance to Nominee',
              'Full residual market value',
              'Full original principal amount',
              'Depends on annuity variant',
            ],
          ],
        }}
        keyBenefits={[
          {
            title: 'Superior Tax Arbitrage',
            description:
              'Redemptions under SWP combine capital return and long-term gains, resulting in a much lower effective tax rate than FD interest.',
          },
          {
            title: 'Complete Liquidity Control',
            description:
              'Unlike pension annuities that permanently lock your capital, SWP allows emergency lumpsum withdrawals whenever required.',
          },
          {
            title: 'Longevity Protection',
            description:
              'When withdrawal rate is calibrated below portfolio CAGR, your capital can outlive you and pass to heirs.',
          },
        ]}
        faqs={swpFaqs}
      />
    </main>
  );
};
export default FixedRateSWP;
