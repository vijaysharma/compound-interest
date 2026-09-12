'use client';
import React, { useMemo, useState } from 'react';
import {
  FiAward,
  FiCheckCircle,
  FiDollarSign,
  FiPieChart,
  FiShield,
  FiTrendingUp,
} from 'react-icons/fi';
import ValuePicker from '../components/ValuePicker';
import SEOHead from '../components/SEOHead';
import CalculatorContentSection from '../components/CalculatorContentSection';
import convertToWords, { getCurrencySymbol } from '../utilities/currency';
import { calculateNPS } from '../utilities/npsCalculations';
import styles from './NpsCalculator.module.scss';
const npsSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FinancialProduct',
      name: 'NPS Calculator India (National Pension System)',
      description:
        'Calculate your retirement pension corpus, mandatory 40% annuity purchase, 60% tax-free lump sum withdrawal, and monthly pension payout with PFRDA rules.',
      category: 'PensionPlan',
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
          name: 'What is the mandatory annuity percentage in NPS at retirement?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Under PFRDA regulations, an subscriber retiring at age 60 must utilize a minimum of 40% of the accumulated pension corpus to purchase an immediate annuity from an approved life insurance company. The remaining 60% can be withdrawn as a completely tax-free lump sum.',
          },
        },
        {
          '@type': 'Question',
          name: 'What extra tax deductions are offered by NPS over Section 80C?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Under Section 80CCD(1B), individuals can claim an exclusive tax deduction of up to ₹50,000 per financial year over and above the ₹1.5 Lakh limit under Section 80C. Furthermore, employer contributions under Section 80CCD(2) up to 10% of salary are tax-deductible in both Old and New Tax Regimes.',
          },
        },
      ],
    },
  ],
};
const NPS_MONTHLY_STEPS = [
  { id: 'n1', value: '50000', title: '₹50K' },
  { id: 'n2', value: '25000', title: '₹25K' },
  { id: 'n3', value: '10000', title: '₹10K' },
  { id: 'n4', value: '5000', title: '₹5K' },
  { id: 'n5', value: '2500', title: '₹2.5K' },
  { id: 'n6', value: '1000', title: '₹1K' },
  { id: 'n7', value: '500', title: '₹500 (Min)' },
];
const NpsCalculator: React.FC = () => {
  const [currentAge, setCurrentAge] = useState<number>(28);
  const [retirementAge, setRetirementAge] = useState<number>(60);
  const [monthlyContribution, setMonthlyContribution] = useState<string>('5000');
  const [hasEmployerContribution, setHasEmployerContribution] = useState<boolean>(false);
  const [employerMonthly, setEmployerMonthly] = useState<string>('5000');
  const [expectedRoi, setExpectedRoi] = useState<number>(10.0);
  const [annuityPercent, setAnnuityPercent] = useState<number>(40);
  const [annuityRate, setAnnuityRate] = useState<number>(6.0);
  const currencySymbol = getCurrencySymbol('en-IN', 'INR');
  const numericSelf = useMemo(() => {
    return Math.max(500, Number(monthlyContribution.replace(/[^0-9]/g, '')) || 500);
  }, [monthlyContribution]);
  const numericEmployer = useMemo(() => {
    if (!hasEmployerContribution) return 0;
    return Math.max(0, Number(employerMonthly.replace(/[^0-9]/g, '')) || 0);
  }, [hasEmployerContribution, employerMonthly]);
  const npsResult = useMemo(() => {
    return calculateNPS({
      currentAge,
      retirementAge,
      monthlyContribution: numericSelf,
      employerContribution: numericEmployer,
      expectedRoi,
      annuityPercent,
      annuityRate,
    });
  }, [
    currentAge,
    retirementAge,
    numericSelf,
    numericEmployer,
    expectedRoi,
    annuityPercent,
    annuityRate,
  ]);
  const wealthMultiple = (npsResult.totalCorpus / (npsResult.totalInvested || 1)).toFixed(1);
  return (
    <main className={styles.container}>
      <SEOHead
        title="NPS Calculator India — Retirement Pension & Corpus Planner | Rupee Calculator"
        description="Calculate your National Pension System (NPS) Tier-1 retirement corpus, 40% mandatory annuity, 60% tax-free lump sum withdrawal, and monthly pension payout."
        keywords="NPS calculator, national pension system calculator, retirement calculator India, pension calculator India, 80CCD 1B calculator, annuity calculator, lump sum withdrawal NPS, PFRDA pension"
        canonicalPath="/nps-calculator"
        schema={npsSchema}
      />
      <header className={styles.header}>
        <div className={styles.badge}>
          <FiShield style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />
          PFRDA Regulated &bull; Section 80CCD &bull; Retirement Security
        </div>
        <h1 className={styles.title}>NPS Calculator (National Pension System)</h1>
        <p className={styles.subtitle}>
          Model your long-term retirement wealth accumulation, mandatory 40% annuity purchase, 60%
          tax-free lump sum withdrawal, and estimated monthly pension.
        </p>
      </header>
      <div className={styles.formGrid}>
        {/* Left Column: Interactive Inputs */}
        <div className={styles.inputsCol}>
          <section className={styles.card}>
            <h2 className={styles.sectionHeading}>
              <FiDollarSign /> Your Monthly Contribution
            </h2>
            <div className={styles.fieldGroup}>
              <ValuePicker
                title="Your Monthly Investment in NPS Tier-1"
                value={monthlyContribution}
                onChange={setMonthlyContribution}
                stepData={NPS_MONTHLY_STEPS}
                min={500}
                max={500000}
              />
            </div>
            {/* Employer Contribution (Section 80CCD(2)) */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} style={{ cursor: 'pointer' }}>
                <span>
                  <input
                    type="checkbox"
                    checked={hasEmployerContribution}
                    onChange={(e) => setHasEmployerContribution(e.target.checked)}
                    style={{ marginRight: '0.5rem', accentColor: 'var(--color-primary)' }}
                  />
                  Add Employer Contribution (Section 80CCD(2))
                </span>
              </label>
              {hasEmployerContribution && (
                <div style={{ marginTop: '0.5rem' }}>
                  <ValuePicker
                    title="Employer Monthly Contribution"
                    value={employerMonthly}
                    onChange={setEmployerMonthly}
                    stepData={NPS_MONTHLY_STEPS}
                    min={500}
                    max={500000}
                  />
                  <p style={{ fontSize: '0.75rem', opacity: 0.75, marginTop: '0.35rem' }}>
                    Corporate employer contributions up to 10% of Basic + DA are tax-exempt under both
                    Old and New Tax Regimes.
                  </p>
                </div>
              )}
            </div>
          </section>
          <section className={styles.card}>
            <h2 className={styles.sectionHeading}>
              <FiTrendingUp /> Age &amp; Expected Growth
            </h2>
            <div className={styles.fieldGroup}>
              <ValuePicker.Paired
                title="Investment Period"
                sourceBadgeText="Current Age"
                targetBadgeText="Retire Age"
                sourceSlot={(
                  <select
                    id="nps-current-age"
                    value={currentAge}
                    onChange={(e) => {
                      const newAge = Number(e.target.value);
                      setCurrentAge(newAge);
                      if (retirementAge <= newAge) {
                        setRetirementAge(Math.min(75, newAge + 5));
                      }
                    }}
                    className={styles.numberInput}
                    aria-label="Current Age"
                  >
                    {Array.from({ length: 48 }, (_, i) => i + 18).map((age) => (
                      <option key={age} value={age}>
                        {age} Years
                      </option>
                    ))}
                  </select>
                )}
                targetSlot={(
                  <select
                    id="nps-retirement-age"
                    value={retirementAge}
                    onChange={(e) => setRetirementAge(Number(e.target.value))}
                    className={styles.numberInput}
                    aria-label="Retirement Age"
                  >
                    {Array.from({ length: Math.max(1, 75 - currentAge) }, (_, i) => currentAge + 1 + i).map(
                      (age) => (
                        <option key={age} value={age}>
                          {age} Years
                        </option>
                      )
                    )}
                  </select>
                )}
              />
            </div>
            <div className={styles.fieldGroup}>
              <ValuePicker.ROI
                title="Expected Investment Return (CAGR %)"
                value={expectedRoi}
                onChange={(v) => setExpectedRoi(parseFloat(v) || 10.0)}
                min={1}
                max={25}
              />
            </div>
          </section>
          <section className={styles.card}>
            <h2 className={styles.sectionHeading}>
              <FiPieChart /> Annuity &amp; Pension Allocation
            </h2>
            <div className={styles.fieldGroup}>
              <ValuePicker.ROI
                title="Annuity Allocation Share (PFRDA Min 40%)"
                value={annuityPercent}
                onChange={(v) => {
                  const num = parseInt(v, 10) || 40;
                  setAnnuityPercent(Math.min(100, Math.max(40, num)));
                }}
                min={40}
                max={100}
                roiSteps={[5, 10, 20]}
              />
              <p style={{ fontSize: '0.75rem', opacity: 0.75, marginTop: '0.25rem' }}>
                {annuityPercent}% Annuity / {100 - annuityPercent}% Lump Sum
              </p>
            </div>
            <div className={styles.fieldGroup}>
              <ValuePicker.ROI
                title="Expected Annuity Return Rate (Pension Yield %)"
                value={annuityRate}
                onChange={(v) => setAnnuityRate(parseFloat(v) || 6.0)}
                min={1}
                max={15}
              />
            </div>
          </section>
        </div>
        {/* Right Column: Retirement Corpus & Pension Results */}
        <div className={styles.summaryCol}>
          <div className={styles.heroPensionCard}>
            <div className={styles.heroPensionLabel}>Estimated Monthly Pension</div>
            <div className={styles.heroPensionAmount}>
              {currencySymbol}
              {npsResult.monthlyPension.toLocaleString('en-IN')}
              <span style={{ fontSize: '1rem', fontWeight: 500, opacity: 0.8 }}>/mo</span>
            </div>
            <div className={styles.heroPensionWords}>
              {convertToWords(npsResult.monthlyPension, 'en-IN')} per month for life
            </div>
          </div>
          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <div className={styles.statLabel}>Total Pension Corpus</div>
              <div className={`${styles.statValue} ${styles.statValueCorpus}`}>
                {currencySymbol}
                {npsResult.totalCorpus.toLocaleString('en-IN')}
              </div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statLabel}>Tax-Free Lump Sum (60%)</div>
              <div className={styles.statValue}>
                {currencySymbol}
                {npsResult.lumpSumAmount.toLocaleString('en-IN')}
              </div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statLabel}>Total Invested</div>
              <div className={styles.statValue}>
                {currencySymbol}
                {npsResult.totalInvested.toLocaleString('en-IN')}
              </div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statLabel}>Wealth Gained</div>
              <div className={`${styles.statValue} ${styles.statValueGain}`}>
                +{currencySymbol}
                {npsResult.interestEarned.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
          {/* Corpus Distribution (Lump Sum vs Annuity) */}
          <div className={styles.corpusSplitCard}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-heading)' }}>
              Corpus Utilization at Age {retirementAge}
            </div>
            <div className={styles.splitBar}>
              <div
                className={styles.splitLumpSum}
                style={{ width: `${npsResult.lumpSumPercent}%` }}
                title={`Lump Sum: ${npsResult.lumpSumPercent}%`}
              />
              <div
                className={styles.splitAnnuity}
                style={{ width: `${npsResult.annuityPercent}%` }}
                title={`Annuity: ${npsResult.annuityPercent}%`}
              />
            </div>
            <div className={styles.splitLegend}>
              <div className={styles.splitItem}>
                <span className={styles.splitDotLumpSum} />
                <div>
                  <div style={{ fontWeight: 600 }}>Lump Sum ({npsResult.lumpSumPercent}%)</div>
                  <div style={{ color: '#3b82f6', fontWeight: 700 }}>
                    {currencySymbol}
                    {npsResult.lumpSumAmount.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.6875rem', opacity: 0.7 }}>100% Tax-Free (Sec 10(12A))</div>
                </div>
              </div>
              <div className={styles.splitItem}>
                <span className={styles.splitDotAnnuity} />
                <div>
                  <div style={{ fontWeight: 600 }}>Annuity ({npsResult.annuityPercent}%)</div>
                  <div style={{ color: '#059669', fontWeight: 700 }}>
                    {currencySymbol}
                    {npsResult.annuityCorpus.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.6875rem', opacity: 0.7 }}>Lifelong Monthly Pension</div>
                </div>
              </div>
            </div>
          </div>
          {/* Tax Advantages Card */}
          <section className={styles.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.875rem' }}>
              <FiAward style={{ color: '#16a34a' }} />
              <span>NPS Exclusive Tax Advantages</span>
            </div>
            <div className={styles.taxBenefitsList}>
              <div className={styles.taxBenefitItem}>
                <FiCheckCircle className={styles.taxBenefitIcon} />
                <div>
                  <strong>Section 80CCD(1B):</strong> Exclusive additional ₹50,000 deduction over and
                  above Section 80C limit.
                </div>
              </div>
              <div className={styles.taxBenefitItem}>
                <FiCheckCircle className={styles.taxBenefitIcon} />
                <div>
                  <strong>Section 80CCD(2):</strong> Employer contribution up to 10% of Basic+DA is
                  tax-free in both regimes without any ₹1.5L cap.
                </div>
              </div>
              <div className={styles.taxBenefitItem}>
                <FiCheckCircle className={styles.taxBenefitIcon} />
                <div>
                  <strong>Section 10(12A):</strong> The 60% lump sum withdrawal at maturity is 100%
                  tax-free.
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      {/* Year-by-Year Schedule */}
      <section className={styles.scheduleSection}>
        <div className={styles.card}>
          <div style={{ marginBottom: '1rem' }}>
            <h2 className={styles.sectionHeading} style={{ margin: 0 }}>
              Retirement Wealth Accumulation Trajectory
            </h2>
            <p className={styles.subtitle} style={{ margin: '0.25rem 0 0' }}>
              Growth of your pension corpus year-by-year from age {currentAge} to {retirementAge} ({wealthMultiple}x Capital Multiplier).
            </p>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Age</th>
                  <th>Annual Contribution</th>
                  <th>Total Invested</th>
                  <th>Interest Earned This Year</th>
                  <th>Closing Pension Corpus</th>
                </tr>
              </thead>
              <tbody>
                {npsResult.yearlyBreakdown.map((row) => (
                  <tr key={row.yearNumber}>
                    <td>Yr {row.yearNumber}</td>
                    <td>
                      <strong>{row.age} Yrs</strong>
                    </td>
                    <td>
                      {currencySymbol}
                      {row.annualContribution.toLocaleString('en-IN')}
                    </td>
                    <td>
                      {currencySymbol}
                      {row.cumulativeInvested.toLocaleString('en-IN')}
                    </td>
                    <td style={{ color: '#16a34a', fontWeight: 600 }}>
                      +{currencySymbol}
                      {row.interestEarned.toLocaleString('en-IN')}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {currencySymbol}
                      {row.closingCorpus.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      {/* Content Section & FAQ */}
      <CalculatorContentSection
        title="Comprehensive National Pension System (NPS) Guide"
        subtitle="Instituted by the Pension Fund Regulatory and Development Authority (PFRDA), NPS is an ultra-low-cost, government-regulated defined-contribution pension scheme created to secure the post-retirement lives of Indian citizens."
        comparisonTable={{
          headers: ['Feature', 'National Pension System (NPS)', 'Employees Provident Fund (EPF)', 'Public Provident Fund (PPF)'],
          rows: [
            ['Regulator', 'PFRDA', 'EPFO (Ministry of Labour)', 'Ministry of Finance / RBI'],
            ['Equity Exposure', 'Up to 75% in Equity (Class E)', 'Up to 15% in Equity ETFs', '0% (Pure Sovereign Debt)'],
            ['Exclusive Tax Deduction', '₹50,000 under 80CCD(1B) beyond 80C', 'Covered inside ₹1.5L 80C', 'Covered inside ₹1.5L 80C'],
            ['Employer Tax Benefit', '10% of Basic+DA under 80CCD(2)', 'Exempt up to 12% of Basic', 'Not Applicable'],
            ['Withdrawal at Age 60', '60% Tax-Free Lump Sum + 40% Annuity', '100% Tax-Free Lump Sum', '100% Tax-Free Lump Sum'],
          ],
        }}
        faqs={[
          {
            question: 'Can I withdraw 100% of my NPS corpus at age 60 without buying an annuity?',
            answer:
              'If your total accumulated pension corpus at age 60 is ₹5 Lakh or less, PFRDA permits you to withdraw 100% of the corpus as a lump sum without any mandatory annuity purchase. If the corpus exceeds ₹5 Lakh, you must utilize at least 40% to purchase a lifelong annuity.',
          },
          {
            question: 'What are the asset choices available in NPS?',
            answer:
              'NPS offers two choices: (1) Active Choice — you decide the allocation across Asset Class E (Equities up to 75%), Asset Class C (Corporate Bonds), Asset Class G (Government Securities), and Asset Class A (Alternative Assets up to 5%); (2) Auto Choice — your funds are automatically allocated across LifeCycle funds (Aggressive LC-75, Moderate LC-50, or Conservative LC-25) where equity exposure automatically de-risks as your age advances.',
          },
          {
            question: 'Is the monthly annuity pension from NPS taxable?',
            answer:
              'While the 60% lump sum withdrawal is 100% tax-free under Section 10(12A), the monthly pension received from the annuity provider is treated as salary/income from other sources and is taxed at your applicable income tax slab rates in the year of receipt.',
          },
        ]}
      />
    </main>
  );
};
export default NpsCalculator;
