'use client';
import React, { useMemo, useState } from 'react';
import {
  FiAward,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiShield,
  FiTrendingUp,
} from 'react-icons/fi';
import ValuePicker from '../components/ValuePicker';
import SEOHead from '../components/SEOHead';
import CalculatorContentSection from '../components/CalculatorContentSection';
import convertToWords, { getCurrencySymbol } from '../utilities/currency';
import {
  calculatePPF,
  PPFDepositTiming,
  PPFExtensionMode,
  PPFFrequency,
} from '../utilities/ppfCalculations';
import {
  CURRENT_PPF_RATE,
  DEFAULT_PROJECTED_PPF_RATE,
  HISTORICAL_PPF_RATES,
  MAX_PPF_ANNUAL_DEPOSIT,
  MIN_PPF_ANNUAL_DEPOSIT,
} from '../data/ppfRates';
import styles from './PpfCalculator.module.scss';
const ppfSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FinancialProduct',
      name: 'PPF Calculator India (Public Provident Fund)',
      description:
        'Official PPF Calculator with real historical interest rates declared by the Ministry of Finance, 5th-of-the-month interest rule, 5-year extension blocks, and full tax-exempt EEE status.',
      category: 'GovernmentSavingsAccount',
      provider: {
        '@type': 'Organization',
        name: 'Rupee Calculator',
        url: 'https://rupees.vercel.app/',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is the 5th of the month rule for PPF deposit?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Under RBI and Post Office PPF rules, interest is calculated on the lowest balance in your PPF account between the close of the 5th day and the end of each calendar month. Therefore, if you deposit by the 5th, your deposit earns interest for that whole month; deposits made after the 5th earn interest only from the next month.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do PPF extensions work after 15 years?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'PPF accounts mature after 15 full financial years. You can extend your account in blocks of 5 years indefinitely. Extensions can be chosen with ongoing contributions (submit Form H within 1 year of maturity) or without contributions (the balance continues earning prevailing PPF interest).',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the tax treatment of PPF in India?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'PPF falls under the Exempt-Exempt-Exempt (EEE) tax regime. Deposits qualify for tax deductions up to ₹1.5 Lakh under Section 80C (Old Regime), the annual interest credited is 100% tax-free under Section 10(11), and the final maturity corpus is completely exempt from income tax in India.',
          },
        },
      ],
    },
  ],
};
const PPF_STEPS_ANNUAL = [
  { id: 'p1', value: '150000', title: '₹1.5L (Max)' },
  { id: 'p2', value: '100000', title: '₹1L' },
  { id: 'p3', value: '50000', title: '₹50K' },
  { id: 'p4', value: '25000', title: '₹25K' },
  { id: 'p5', value: '10000', title: '₹10K' },
  { id: 'p6', value: '5000', title: '₹5K' },
  { id: 'p7', value: '500', title: '₹500 (Min)' },
];
const PPF_STEPS_MONTHLY = [
  { id: 'm1', value: '12500', title: '₹12.5K (₹1.5L/yr)' },
  { id: 'm2', value: '10000', title: '₹10K' },
  { id: 'm3', value: '5000', title: '₹5K' },
  { id: 'm4', value: '2500', title: '₹2.5K' },
  { id: 'm5', value: '1000', title: '₹1K' },
  { id: 'm6', value: '500', title: '₹500' },
];
const PPF_START_YEAR_OPTIONS = [
  ...HISTORICAL_PPF_RATES.map((r) => ({ year: r.startYear, label: `FY ${r.fyLabel}` })),
  { year: 2026, label: 'FY 2026-27 (Upcoming)' },
  { year: 2027, label: 'FY 2027-28 (Future)' },
];
const PpfCalculator: React.FC = () => {
  const [frequency, setFrequency] = useState<PPFFrequency>('yearly');
  const [depositAmount, setDepositAmount] = useState<string>('150000');
  const [depositTiming, setDepositTiming] = useState<PPFDepositTiming>('before_5th');
  const [startYear, setStartYear] = useState<number>(2025);
  const [extensionBlocks, setExtensionBlocks] = useState<number>(0);
  const [extensionMode, setExtensionMode] = useState<PPFExtensionMode>('with_contribution');
  const [projectedRate, setProjectedRate] = useState<number>(DEFAULT_PROJECTED_PPF_RATE);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const currencySymbol = getCurrencySymbol('en-IN', 'INR');
  // Ensure deposit amount stays within PPF annual cap
  const numericDeposit = useMemo(() => {
    const raw = Number(depositAmount.replace(/[^0-9]/g, '')) || 0;
    if (frequency === 'yearly') {
      return Math.min(MAX_PPF_ANNUAL_DEPOSIT, Math.max(MIN_PPF_ANNUAL_DEPOSIT, raw));
    }
    // Monthly max is ₹12,500 (₹1.5L / 12)
    return Math.min(12500, Math.max(100, raw));
  }, [depositAmount, frequency]);
  const ppfResult = useMemo(() => {
    return calculatePPF({
      depositAmount: numericDeposit,
      frequency,
      depositTiming,
      startYear,
      extensionBlocks,
      extensionMode,
      projectedRate,
    });
  }, [
    numericDeposit,
    frequency,
    depositTiming,
    startYear,
    extensionBlocks,
    extensionMode,
    projectedRate,
  ]);
  const investedPercent = useMemo(() => {
    if (!ppfResult.maturityAmount) return 50;
    return Math.round((ppfResult.totalInvested / ppfResult.maturityAmount) * 100);
  }, [ppfResult]);
  const gainsPercent = 100 - investedPercent;
  const wealthMultiplier = (
    ppfResult.maturityAmount / (ppfResult.totalInvested || 1)
  ).toFixed(1);
  return (
    <main className={styles.container}>
      <SEOHead
        title="PPF Calculator India — Historical & Projected Public Provident Fund Returns"
        description="Official PPF Calculator following RBI 5th-of-the-month rules, real historical interest rates, 5-year extension blocks, and EEE tax-exempt maturity value."
        keywords="PPF calculator, public provident fund calculator, PPF interest rate, 5th of month rule PPF, PPF extension calculator, PPF maturity calculator, tax free savings India, Section 80C PPF, PPF rules RBI"
        canonicalPath="/ppf-calculator"
        schema={ppfSchema}
      />
      <header className={styles.header}>
        <div className={styles.badge}>
          <FiShield style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />
          Government of India &bull; RBI Rules &bull; EEE Tax-Free
        </div>
        <h1 className={styles.title}>PPF Calculator (Public Provident Fund)</h1>
        <p className={styles.subtitle}>
          Calculate PPF compounding using real historical interest rates declared each year by the
          Ministry of Finance, 5th-of-the-month interest rules, and 5-year extension blocks.
        </p>
      </header>
      <div className={styles.formGrid}>
        {/* Left Column: Interactive Inputs */}
        <div className={styles.inputsCol}>
          <section className={styles.card}>
            <h2 className={styles.sectionHeading}>
              <FiTrendingUp /> Deposit &amp; Frequency
            </h2>
            <div className={styles.fieldGroup}>
              <ValuePicker
                title={frequency === 'yearly' ? 'Annual Deposit Amount (Max ₹1.5L)' : 'Monthly Deposit Amount (Max ₹12.5K)'}
                value={depositAmount}
                onChange={setDepositAmount}
                activeTab={frequency}
                onTabChange={(tabId) => {
                  const newFreq = tabId as PPFFrequency;
                  setFrequency(newFreq);
                  if (newFreq === 'monthly') {
                    setDepositAmount('12500');
                  } else {
                    setDepositAmount('150000');
                  }
                }}
                stepData={frequency === 'yearly' ? PPF_STEPS_ANNUAL : PPF_STEPS_MONTHLY}
                tabs={[
                  { id: 'yearly', title: 'Annual deposit' },
                  { id: 'monthly', title: 'Monthly deposit' },
                ]}
                min={frequency === 'yearly' ? MIN_PPF_ANNUAL_DEPOSIT : 100}
                max={frequency === 'yearly' ? MAX_PPF_ANNUAL_DEPOSIT : 12500}
              />
            </div>
            {/* Deposit Timing: 5th of the month rule */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Deposit Timing (RBI Rule)</label>
              <div className={styles.timingGrid}>
                <button
                  type="button"
                  className={`${styles.timingBtn} ${
                    depositTiming === 'before_5th' ? styles.timingBtnActive : ''
                  }`}
                  onClick={() => setDepositTiming('before_5th')}
                >
                  <span>On or before 5th</span>
                  <span>Earns interest for same month</span>
                </button>
                <button
                  type="button"
                  className={`${styles.timingBtn} ${
                    depositTiming === 'after_5th' ? styles.timingBtnActive : ''
                  }`}
                  onClick={() => setDepositTiming('after_5th')}
                >
                  <span>After 5th of month</span>
                  <span>Earns interest from next month</span>
                </button>
              </div>
              <div className={styles.ruleNote}>
                <strong>RBI Rule:</strong> Interest is calculated on the lowest balance between the
                close of the 5th day and the end of each month.
              </div>
            </div>
          </section>
          <section className={styles.card}>
            <h2 className={styles.sectionHeading}>
              <FiClock /> Start Year &amp; Extensions
            </h2>
            <div className={styles.fieldGroup}>
              <label htmlFor="ppf-start-year" className={styles.fieldLabel}>Account Opening Financial Year</label>
              <select
                id="ppf-start-year"
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}
                className={styles.selectInput}
              >
                {PPF_START_YEAR_OPTIONS.map((opt) => (
                  <option key={opt.year} value={opt.year}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.fieldGroup}>
              <label htmlFor="ppf-extensions" className={styles.fieldLabel}>Account Tenure &amp; 5-Year Extensions</label>
              <select
                id="ppf-extensions"
                value={`${extensionBlocks}_${extensionMode}`}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '0') {
                    setExtensionBlocks(0);
                  } else {
                    const [blocksStr, modeStr] = val.split('_');
                    setExtensionBlocks(Number(blocksStr));
                    if (modeStr === 'without') {
                      setExtensionMode('without_contribution');
                    } else {
                      setExtensionMode('with_contribution');
                    }
                  }
                }}
                className={styles.selectInput}
              >
                <option value="0">Standard 15 Years (Base Tenure)</option>
                <option value="1_with">20 Years (1 Block of 5 Yrs — With Annual Deposits)</option>
                <option value="1_without">20 Years (1 Block of 5 Yrs — Extend Without Investing More Money)</option>
                <option value="2_with">25 Years (2 Blocks of 5 Yrs — With Annual Deposits)</option>
                <option value="2_without">25 Years (2 Blocks of 5 Yrs — Extend Without Investing More Money)</option>
                <option value="3_with">30 Years (3 Blocks of 5 Yrs — With Annual Deposits)</option>
                <option value="3_without">30 Years (3 Blocks of 5 Yrs — Extend Without Investing More Money)</option>
                <option value="4_with">35 Years (4 Blocks of 5 Yrs — With Annual Deposits)</option>
                <option value="4_without">35 Years (4 Blocks of 5 Yrs — Extend Without Investing More Money)</option>
              </select>
            </div>
            {extensionBlocks > 0 && (
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Extension Investment Mode</label>
                <div className={styles.timingGrid}>
                  <button
                    type="button"
                    className={`${styles.timingBtn} ${
                      extensionMode === 'with_contribution' ? styles.timingBtnActive : ''
                    }`}
                    onClick={() => setExtensionMode('with_contribution')}
                  >
                    <span>With Ongoing Deposits</span>
                    <span>Continue contributing annually</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.timingBtn} ${
                      extensionMode === 'without_contribution' ? styles.timingBtnActive : ''
                    }`}
                    onClick={() => setExtensionMode('without_contribution')}
                  >
                    <span>Without Investing More</span>
                    <span>Earn interest on accumulated balance only</span>
                  </button>
                </div>
              </div>
            )}
            <div className={styles.fieldGroup}>
              <ValuePicker.ROI
                title={`Projected Future Rate (%) — Current: ${CURRENT_PPF_RATE}%`}
                value={projectedRate}
                onChange={(v) => setProjectedRate(parseFloat(v) || 7.1)}
                min={1}
                max={15}
              />
            </div>
          </section>
        </div>
        {/* Right Column: Key Results & Summary */}
        <div className={styles.summaryCol}>
          <div className={styles.resultHeroCard}>
            <div className={styles.resultHeroLabel}>Total Maturity Value</div>
            <div className={styles.resultHeroAmount}>
              {currencySymbol}
              {ppfResult.maturityAmount.toLocaleString('en-IN')}
            </div>
            <div className={styles.resultHeroWords}>
              {convertToWords(ppfResult.maturityAmount, 'en-IN')}
            </div>
          </div>
          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <div className={styles.statLabel}>Total Invested</div>
              <div className={styles.statValue}>
                {currencySymbol}
                {ppfResult.totalInvested.toLocaleString('en-IN')}
              </div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statLabel}>Total Interest Earned</div>
              <div className={`${styles.statValue} ${styles.statValueGain}`}>
                +{currencySymbol}
                {ppfResult.totalInterest.toLocaleString('en-IN')}
              </div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statLabel}>Account Tenure</div>
              <div className={styles.statValue}>{ppfResult.tenureYears} Years</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statLabel}>Maturity Financial Year</div>
              <div className={styles.statValue}>FY {ppfResult.maturityFyLabel}</div>
            </div>
          </div>
          {/* EEE Tax Exemption Status */}
          <section className={styles.card}>
            <div className={styles.badgeEee}>
              <FiAward /> 100% Tax-Free (EEE Status)
            </div>
            <div className={styles.eeeList}>
              <div className={styles.eeeItem}>
                <FiCheckCircle style={{ color: '#16a34a' }} />
                <span>
                  <strong>Investment:</strong> Eligible for Section 80C deduction up to ₹1.5L/year.
                </span>
              </div>
              <div className={styles.eeeItem}>
                <FiCheckCircle style={{ color: '#16a34a' }} />
                <span>
                  <strong>Interest Earned:</strong> 100% Tax-Exempt under Section 10(11).
                </span>
              </div>
              <div className={styles.eeeItem}>
                <FiCheckCircle style={{ color: '#16a34a' }} />
                <span>
                  <strong>Maturity Corpus:</strong> Completely tax-free upon withdrawal.
                </span>
              </div>
            </div>
            {/* Growth Visual Bar */}
            <div className={styles.progressContainer}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressInvested}
                  style={{ width: `${investedPercent}%` }}
                  title={`Invested: ${investedPercent}%`}
                />
                <div
                  className={styles.progressGains}
                  style={{ width: `${gainsPercent}%` }}
                  title={`Interest: ${gainsPercent}%`}
                />
              </div>
              <div className={styles.progressLegend}>
                <span>Invested: {investedPercent}%</span>
                <span>Wealth Multiplier: {wealthMultiplier}x</span>
                <span>Interest: {gainsPercent}%</span>
              </div>
            </div>
          </section>
        </div>
      </div>
      {/* Year-by-Year Schedule */}
      <section className={styles.scheduleSection}>
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 className={styles.sectionHeading} style={{ margin: 0 }}>
                Year-by-Year PPF Growth Schedule
              </h2>
              <p className={styles.subtitle} style={{ margin: '0.25rem 0 0' }}>
                Shows actual historical rates declared by the Ministry of Finance vs forward projected rates.
              </p>
            </div>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Financial Year</th>
                  <th>Interest Rate</th>
                  <th>Opening Balance</th>
                  <th>Deposits</th>
                  <th>Interest (Credited Mar 31)</th>
                  <th>Closing Balance</th>
                  <th>Monthly Breakdown</th>
                </tr>
              </thead>
              <tbody>
                {ppfResult.yearlyBreakdown.map((row) => {
                  const isExpanded = expandedYear === row.yearNumber;
                  return (
                    <React.Fragment key={row.yearNumber}>
                      <tr>
                        <td>
                          <strong>Yr {row.yearNumber}</strong>
                          {row.isExtensionYear && (
                            <span style={{ marginLeft: '0.25rem', fontSize: '0.625rem', color: '#d97706' }}>
                              (Ext)
                            </span>
                          )}
                        </td>
                        <td>FY {row.fyLabel}</td>
                        <td>
                          <span
                            className={`${styles.rateBadge} ${
                              row.isHistorical
                                ? styles.rateBadgeHistorical
                                : styles.rateBadgeProjected
                            }`}
                          >
                            {row.interestRate}% {row.isHistorical ? 'Historical' : 'Projected'}
                          </span>
                        </td>
                        <td>
                          {currencySymbol}
                          {row.openingBalance.toLocaleString('en-IN')}
                        </td>
                        <td>
                          {currencySymbol}
                          {row.annualDeposit.toLocaleString('en-IN')}
                        </td>
                        <td style={{ color: '#16a34a', fontWeight: 600 }}>
                          +{currencySymbol}
                          {row.totalInterest.toLocaleString('en-IN')}
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          {currencySymbol}
                          {row.closingBalance.toLocaleString('en-IN')}
                        </td>
                        <td>
                          <button
                            type="button"
                            className={styles.expandBtn}
                            onClick={() =>
                              setExpandedYear(isExpanded ? null : row.yearNumber)
                            }
                          >
                            {isExpanded ? (
                              <>
                                Hide <FiChevronUp />
                              </>
                            ) : (
                              <>
                                View 12 Months <FiChevronDown />
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} style={{ padding: 0 }}>
                            <div className={styles.monthTableWrapper}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                Month-by-Month Interest Breakdown for FY {row.fyLabel} (Rate: {row.interestRate}%)
                              </div>
                              <table className={styles.monthTable}>
                                <thead>
                                  <tr>
                                    <th>Month</th>
                                    <th>Deposit</th>
                                    <th>Eligible Balance (Lowest 5th-30th)</th>
                                    <th>Monthly Interest Accrued</th>
                                    <th>Running Balance</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {row.months.map((m) => (
                                    <tr key={m.monthIndex}>
                                      <td>{m.monthName}</td>
                                      <td>
                                        {currencySymbol}
                                        {m.deposit.toLocaleString('en-IN')}
                                      </td>
                                      <td>
                                        {currencySymbol}
                                        {m.eligibleBalanceForInterest.toLocaleString('en-IN')}
                                      </td>
                                      <td style={{ color: '#16a34a' }}>
                                        +{currencySymbol}
                                        {m.monthlyInterest.toLocaleString('en-IN')}
                                      </td>
                                      <td>
                                        {currencySymbol}
                                        {m.closingBalance.toLocaleString('en-IN')}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      {/* Educational Guide & FAQs */}
      <CalculatorContentSection
        title="Understanding the Public Provident Fund (PPF) Rules &amp; Compounding"
        subtitle="Launched in 1968 by the National Savings Institute of the Ministry of Finance, PPF is one of India's most secure and tax-efficient wealth accumulation instruments backed by sovereign guarantee."
        comparisonTable={{
          headers: ['Feature', 'Public Provident Fund (PPF)', 'Bank Fixed Deposit (FD)', 'Equity Linked Savings Scheme (ELSS)'],
          rows: [
            ['Sovereign Guarantee', '100% Government of India Backed', 'DICGC Insurance up to ₹5 Lakh', 'Market Linked (No Guarantee)'],
            ['Tax Status', 'EEE (100% Tax Free)', 'Interest Taxed at Slab Rate', 'LTCG 12.5% above ₹1.25 Lakh'],
            ['Lock-in Period', '15 Years (Extendable in 5-Yr Blocks)', '7 Days to 10 Years', '3 Years (Shortest 80C)'],
            ['Annual Deposit Limits', 'Min ₹500, Max ₹1,50,000 per FY', 'No Upper Limit', 'No Upper Limit'],
            ['Loan Facility', 'Available from 3rd to 6th Financial Year', 'Overdraft against FD up to 90%', 'Not Available'],
          ],
        }}
        faqs={[
          {
            question: 'Why should I deposit in PPF on or before the 5th of every month?',
            answer:
              'According to Post Office and RBI rules, interest for any calendar month is calculated on the lowest balance available in the account between the close of the 5th day and the end of the month. If you deposit funds on the 6th or later, that installment will earn zero interest for the current month and will only begin earning interest from the 1st of the following month.',
          },
          {
            question: 'How do 5-year extensions work after completing 15 years?',
            answer:
              'After the initial 15-year maturity, you can extend your PPF account indefinitely in blocks of 5 years. There are two modes: (1) Extension with contribution — submit Form H within 1 year of maturity to keep making deposits and claiming Section 80C deductions; (2) Extension without contribution — if no form is submitted, the account automatically continues earning prevailing PPF interest on the existing balance, and you can withdraw any amount once per financial year.',
          },
          {
            question: 'Can I deposit more than ₹1,50,000 in a financial year?',
            answer:
              'No. The maximum statutory limit is ₹1.5 Lakh per financial year across all PPF accounts held by an individual (including accounts opened on behalf of minor children). Any amount deposited in excess of ₹1.5 Lakh neither earns interest nor qualifies for Section 80C tax deductions.',
          },
          {
            question: 'When is PPF interest credited to the account?',
            answer:
              'PPF interest is calculated monthly based on the 5th-of-the-month rule, but it is officially credited and compounded into the principal once a year on March 31st (the close of the financial year).',
          },
        ]}
      />
    </main>
  );
};
export default PpfCalculator;
