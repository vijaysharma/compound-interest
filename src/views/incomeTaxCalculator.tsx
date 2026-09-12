'use client';
import React, { useMemo, useState } from 'react';
import { useNavigate } from '@/navigation';
import { useAuth } from '../context/useAuth';
import {
  FiAward,
  FiBriefcase,
  FiCheckCircle,
  FiCpu,
  FiDollarSign,
  FiHome,
  FiPieChart,
  FiPlus,
  FiSend,
  FiShield,
  FiTrash2,
  FiTrendingUp,
} from 'react-icons/fi';
import ValuePicker from '../components/ValuePicker';
import SEOHead from '../components/SEOHead';
import CalculatorContentSection from '../components/CalculatorContentSection';
import convertToWords, { getCurrencySymbol } from '../utilities/currency';
import {
  AgeCategory,
  CityCategory,
  compareTaxRegimes,
  TaxIncomeInputs,
} from '../utilities/incomeTaxCalculations';
import { generateTaxAIAdviceAction } from '@/actions/taxAi';
import styles from './IncomeTaxCalculator.module.scss';
const taxSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FinancialProduct',
      name: 'Income Tax Calculator India FY 2024-25 & FY 2025-26',
      description:
        'Dual-regime income tax calculator comparing Old vs New Tax Regime with Budget 2024 slab updates, Section 87A rebate, capital gains rules, deductions, and Tax Strategy Optimizer.',
      category: 'TaxCalculator',
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
          name: 'What is the zero-tax limit under the New Tax Regime for salaried employees?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Under the New Tax Regime (FY 2024-25 / FY 2025-26), salaried individuals enjoy an enhanced Standard Deduction of ₹75,000 and Section 87A rebate up to ₹25,000 on taxable income up to ₹7,00,000. Effectively, salaried individuals with a gross income of up to ₹7,75,000 pay zero income tax.',
          },
        },
        {
          '@type': 'Question',
          name: 'How is income from PPF taxed in India?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'PPF enjoys Exempt-Exempt-Exempt (EEE) status. The annual interest credited to your PPF account is 100% tax-free under Section 10(11) of the Income Tax Act under both Old and New Tax Regimes, and the final maturity amount is completely exempt from tax.',
          },
        },
      ],
    },
  ],
};
const SALARY_STEPS = [
  { id: 's1', value: '5000000', title: '₹50L' },
  { id: 's2', value: '3000000', title: '₹30L' },
  { id: 's3', value: '2000000', title: '₹20L' },
  { id: 's4', value: '1500000', title: '₹15L' },
  { id: 's5', value: '1000000', title: '₹10L' },
  { id: 's6', value: '750000', title: '₹7.5L' },
  { id: 's7', value: '500000', title: '₹5L' },
];
const DEDUCTION_80C_STEPS = [
  { id: 'd1', value: '150000', title: '₹1.5L (Max)' },
  { id: 'd2', value: '100000', title: '₹1L' },
  { id: 'd3', value: '50000', title: '₹50K' },
  { id: 'd4', value: '25000', title: '₹25K' },
  { id: 'd5', value: '0', title: '₹0' },
];
const IncomeTaxCalculator: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [financialYear, setFinancialYear] = useState<'2024-25' | '2025-26'>('2024-25');
  const [ageCategory, setAgeCategory] = useState<AgeCategory>('general');
  const [isSalaried, setIsSalaried] = useState<boolean>(true);
  // Active inputs tab
  const [activeTab, setActiveTab] = useState<
    'salary' | 'business' | 'house' | 'capital_gains' | 'interest' | 'deductions'
  >('salary');
  // Salary & HRA
  const [grossSalary, setGrossSalary] = useState<string>('1500000');
  const [basicSalary, setBasicSalary] = useState<string>('750000');
  const [hraReceived, setHraReceived] = useState<string>('300000');
  const [rentPaid, setRentPaid] = useState<string>('240000');
  const [cityCategory, setCityCategory] = useState<CityCategory>('metro');
  const [professionalTax, setProfessionalTax] = useState<string>('2400');
  const [exemptAllowances, setExemptAllowances] = useState<string>('0');
  const [useCustomStdDeduction, setUseCustomStdDeduction] = useState<boolean>(false);
  const [customStdDeduction, setCustomStdDeduction] = useState<string>('75000');
  // Business / Profession
  const [businessIncome, setBusinessIncome] = useState<string>('0');
  // House property
  const [isSelfOccupied, setIsSelfOccupied] = useState<boolean>(true);
  const [rentalIncome, setRentalIncome] = useState<string>('0');
  const [municipalTaxes, setMunicipalTaxes] = useState<string>('0');
  const [homeLoanInterestProperty, setHomeLoanInterestProperty] = useState<string>('0');
  // Capital Gains
  const [equityStcg, setEquityStcg] = useState<string>('0');
  const [equityLtcg, setEquityLtcg] = useState<string>('0');
  const [otherCapitalGains, setOtherCapitalGains] = useState<string>('0');
  // Other Sources
  const [savingsInterest, setSavingsInterest] = useState<string>('15000');
  const [fdInterest, setFdInterest] = useState<string>('0');
  const [ppfInterest, setPpfInterest] = useState<string>('50000');
  const [otherIncome, setOtherIncome] = useState<string>('0');
  // Deductions (Old Regime)
  const [section80C, setSection80C] = useState<string>('150000');
  const [section80Ccd1b, setSection80Ccd1b] = useState<string>('50000');
  const [section80Ccd2, setSection80Ccd2] = useState<string>('0');
  const [section80DSelf, setSection80DSelf] = useState<string>('25000');
  const [seniorSelf80D, setSeniorSelf80D] = useState<boolean>(false);
  const [section80DParents, setSection80DParents] = useState<string>('25000');
  const [seniorParents80D, setSeniorParents80D] = useState<boolean>(false);
  const [section80E, setSection80E] = useState<string>('0');
  const [section80G, setSection80G] = useState<string>('0');
  const [section80Tta, setSection80Tta] = useState<string>('10000');
  const [section80Gg, setSection80Gg] = useState<string>('0');
  const [section80Ddb, setSection80Ddb] = useState<string>('0');
  const [section80U, setSection80U] = useState<string>('0');
  const [section80Eea, setSection80Eea] = useState<string>('0');
  const [customDeductionsList, setCustomDeductionsList] = useState<
    Array<{ id: string; name: string; amount: string }>
  >([]);
  const [otherDeductions, setOtherDeductions] = useState<string>('0');
  // Strategy Advisory state (Without mentioning AI)
  const [strategyLoading, setStrategyLoading] = useState<boolean>(false);
  const [strategyAdvice, setStrategyAdvice] = useState<string | null>(null);
  const [strategyQuestion, setStrategyQuestion] = useState<string>('');
  const [showUpgradeGate, setShowUpgradeGate] = useState<boolean>(false);
  const hasTaxPro = Boolean(
    user?.role === 'admin' ||
    user?.subscription_plan === 'tax_monthly' ||
    user?.subscription_plan === 'tax_yearly'
  );
  const currencySymbol = getCurrencySymbol('en-IN', 'INR');
  const sanitizeAmount = (val: string): number => {
    return Math.max(0, Number(val.replace(/[^0-9]/g, '')) || 0);
  };
  // Add a new custom deduction row
  const handleAddCustomDeduction = () => {
    const newId = `custom_${Date.now()}`;
    setCustomDeductionsList((prev) => [
      ...prev,
      { id: newId, name: `Custom Deduction #${prev.length + 1}`, amount: '0' },
    ]);
  };
  const handleUpdateCustomDeduction = (id: string, field: 'name' | 'amount', value: string) => {
    setCustomDeductionsList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };
  const handleRemoveCustomDeduction = (id: string) => {
    setCustomDeductionsList((prev) => prev.filter((item) => item.id !== id));
  };
  // Compile inputs
  const inputs: TaxIncomeInputs = useMemo(() => {
    return {
      financialYear,
      ageCategory,
      isSalaried,
      grossSalary: isSalaried ? sanitizeAmount(grossSalary) : 0,
      basicSalary: isSalaried ? sanitizeAmount(basicSalary) : 0,
      hraReceived: isSalaried ? sanitizeAmount(hraReceived) : 0,
      rentPaid: isSalaried ? sanitizeAmount(rentPaid) : 0,
      cityCategory,
      professionalTax: isSalaried ? sanitizeAmount(professionalTax) : 0,
      exemptAllowances: isSalaried ? sanitizeAmount(exemptAllowances) : 0,
      customStandardDeduction: useCustomStdDeduction ? sanitizeAmount(customStdDeduction) : null,
      businessIncome: sanitizeAmount(businessIncome),
      isSelfOccupied,
      rentalIncome: sanitizeAmount(rentalIncome),
      municipalTaxes: sanitizeAmount(municipalTaxes),
      homeLoanInterestProperty: sanitizeAmount(homeLoanInterestProperty),
      equityStcg: sanitizeAmount(equityStcg),
      equityLtcg: sanitizeAmount(equityLtcg),
      otherCapitalGains: sanitizeAmount(otherCapitalGains),
      savingsInterest: sanitizeAmount(savingsInterest),
      fdInterest: sanitizeAmount(fdInterest),
      ppfInterest: sanitizeAmount(ppfInterest),
      otherIncome: sanitizeAmount(otherIncome),
      section80C: sanitizeAmount(section80C),
      section80Ccd1b: sanitizeAmount(section80Ccd1b),
      section80Ccd2: sanitizeAmount(section80Ccd2),
      section80D_self: sanitizeAmount(section80DSelf),
      selfSeniorCitizen: seniorSelf80D,
      section80D_parents: sanitizeAmount(section80DParents),
      parentsSeniorCitizen: seniorParents80D,
      section80E: sanitizeAmount(section80E),
      section80G: sanitizeAmount(section80G),
      section80Tta: sanitizeAmount(section80Tta),
      section80Gg: sanitizeAmount(section80Gg),
      section80Ddb: sanitizeAmount(section80Ddb),
      section80U: sanitizeAmount(section80U),
      section80Eea: sanitizeAmount(section80Eea),
      customDeductions: customDeductionsList.map((item) => ({
        id: item.id,
        name: item.name,
        amount: sanitizeAmount(item.amount),
      })),
      otherDeductions: sanitizeAmount(otherDeductions),
    };
  }, [
    financialYear,
    ageCategory,
    isSalaried,
    grossSalary,
    basicSalary,
    hraReceived,
    rentPaid,
    cityCategory,
    professionalTax,
    exemptAllowances,
    useCustomStdDeduction,
    customStdDeduction,
    businessIncome,
    isSelfOccupied,
    rentalIncome,
    municipalTaxes,
    homeLoanInterestProperty,
    equityStcg,
    equityLtcg,
    otherCapitalGains,
    savingsInterest,
    fdInterest,
    ppfInterest,
    otherIncome,
    section80C,
    section80Ccd1b,
    section80Ccd2,
    section80DSelf,
    seniorSelf80D,
    section80DParents,
    seniorParents80D,
    section80E,
    section80G,
    section80Tta,
    section80Gg,
    section80Ddb,
    section80U,
    section80Eea,
    customDeductionsList,
    otherDeductions,
  ]);
  // Compute dual-regime comparison
  const comparison = useMemo(() => {
    return compareTaxRegimes(inputs);
  }, [inputs]);
  const handleGenerateStrategyAdvice = async (customQuestion?: string) => {
    if (!hasTaxPro) {
      setShowUpgradeGate(true);
      return;
    }
    setStrategyLoading(true);
    setStrategyAdvice(null);
    setShowUpgradeGate(false);
    try {
      const data = await generateTaxAIAdviceAction(
        {
          financialSummary: {
            financialYear: inputs.financialYear,
            isSalaried: inputs.isSalaried,
            grossTotalIncome: comparison.newRegime.grossTotalIncome,
            newRegimeTax: comparison.newRegime.totalTaxPayable,
            oldRegimeTax: comparison.oldRegime.totalTaxPayable,
            recommendedRegime: comparison.recommendedRegime,
            taxSavings: comparison.taxSavings,
            breakevenDeductions: comparison.breakevenDeductions,
            currentDeductions: comparison.currentDeductionsClaimed,
            salary: inputs.grossSalary,
            businessIncome: inputs.businessIncome,
            equityStcg: inputs.equityStcg,
            equityLtcg: inputs.equityLtcg,
            ppfInterestExempt: inputs.ppfInterest,
            section80C: inputs.section80C,
            section80CCD1B: inputs.section80Ccd1b,
            section80D: inputs.section80D_self + inputs.section80D_parents,
          },
          userQuestion: customQuestion || strategyQuestion || undefined,
        },
        token || undefined
      );
      if (data.needsUpgrade) {
        setShowUpgradeGate(true);
      } else if (data.advice) {
        setStrategyAdvice(data.advice);
      } else {
        setStrategyAdvice(data.message || 'Unable to generate optimization strategy at this moment.');
      }
    } catch (err) {
      setStrategyAdvice(`Unable to generate strategy report: ${String(err)}`);
    } finally {
      setStrategyLoading(false);
    }
  };
  const isNewWinner = comparison.recommendedRegime === 'new';
  return (
    <main className={styles.container}>
      <SEOHead
        title="Income Tax Calculator FY 2024-25 & 2025-26 — Old vs New Tax Regime | Rupee Calculator"
        description="Calculate & compare income tax under Old vs New Tax Regime with Budget 2024 slabs, capital gains rules, PPF exemption, breakeven deductions, and Tax Strategy Advisory."
        keywords="income tax calculator, old vs new tax regime, tax calculator FY 2024-25, Section 87A rebate, standard deduction 75000, capital gains tax calculator, tax strategy advisory India, income tax slab 2025"
        canonicalPath="/income-tax-calculator"
        schema={taxSchema}
      />
      <header className={styles.header}>
        <div className={styles.badge}>
          <FiShield style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />
          Income Tax Department of India &bull; Budget 2024 Updates &bull; Strategy Engine
        </div>
        <h1 className={styles.title}>Income Tax Calculator &amp; Optimizer</h1>
        <p className={styles.subtitle}>
          Compare Old vs New Tax Regime for FY {financialYear}, model multiple income sources
          (Salary, Business, Rental, Capital Gains, PPF), and discover the best way to optimize your
          taxes.
        </p>
      </header>
      {/* Hero Recommendation Banner */}
      <section className={styles.winnerBanner}>
        <div className={styles.winnerInfo}>
          <FiCheckCircle className={styles.winnerIcon} />
          <div>
            <h2 className={styles.winnerHeading}>
              Recommended: {isNewWinner ? 'New Tax Regime' : 'Old Tax Regime'}
            </h2>
            <p className={styles.winnerSubtext}>
              {comparison.taxSavings > 0 ? (
                <>
                  You save <strong>{currencySymbol}{comparison.taxSavings.toLocaleString('en-IN')}</strong> in taxes
                  by opting for the <strong>{isNewWinner ? 'New Tax Regime' : 'Old Tax Regime'}</strong>.
                </>
              ) : (
                'Both regimes yield identical tax payable for your financial figures.'
              )}
            </p>
          </div>
        </div>
        <div className={styles.winnerBadge}>
          <FiAward />
          <span>Save {currencySymbol}{comparison.taxSavings.toLocaleString('en-IN')}</span>
        </div>
      </section>
      {/* Side-by-Side Dual Regime Comparison Cards */}
      <section className={styles.comparisonGrid}>
        {/* New Regime Card */}
        <div
          className={`${styles.regimeCard} ${
            isNewWinner ? styles.regimeCardRecommended : ''
          }`}
        >
          <div className={styles.regimeHeader}>
            <div>
              <h3 className={styles.regimeTitle}>New Tax Regime</h3>
              <div className={styles.regimeSub}>Section 115BAC (Default)</div>
            </div>
            {isNewWinner && <span className={styles.tagRecommended}>Recommended</span>}
          </div>
          <div className={styles.regimeHeroAmount}>
            {currencySymbol}
            {comparison.newRegime.totalTaxPayable.toLocaleString('en-IN')}
          </div>
          <div className={styles.regimeWords}>
            Effective Tax Rate: {comparison.newRegime.effectiveTaxRate}%
          </div>
          <div className={styles.detailRows}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Gross Total Income</span>
              <span className={styles.detailValue}>
                {currencySymbol}
                {comparison.newRegime.grossTotalIncome.toLocaleString('en-IN')}
              </span>
            </div>
            {isSalaried && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Standard Deduction</span>
                <span className={styles.detailValueNegative}>
                  -{currencySymbol}
                  {comparison.newRegime.standardDeduction.toLocaleString('en-IN')}
                </span>
              </div>
            )}
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Total Taxable Income</span>
              <span className={styles.detailValue}>
                {currencySymbol}
                {comparison.newRegime.taxableIncome.toLocaleString('en-IN')}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Slab Tax</span>
              <span className={styles.detailValue}>
                {currencySymbol}
                {comparison.newRegime.slabTax.toLocaleString('en-IN')}
              </span>
            </div>
            {(comparison.newRegime.stcgTax > 0 || comparison.newRegime.ltcgTax > 0) && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Capital Gains Tax (Equity)</span>
                <span className={styles.detailValue}>
                  {currencySymbol}
                  {(comparison.newRegime.stcgTax + comparison.newRegime.ltcgTax).toLocaleString('en-IN')}
                </span>
              </div>
            )}
            {comparison.newRegime.rebate87A > 0 && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Section 87A Rebate</span>
                <span className={styles.detailValueNegative}>
                  -{currencySymbol}
                  {comparison.newRegime.rebate87A.toLocaleString('en-IN')}
                </span>
              </div>
            )}
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Health &amp; Education Cess (4%)</span>
              <span className={styles.detailValue}>
                {currencySymbol}
                {comparison.newRegime.cess.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
        {/* Old Regime Card */}
        <div
          className={`${styles.regimeCard} ${
            !isNewWinner ? styles.regimeCardRecommended : ''
          }`}
        >
          <div className={styles.regimeHeader}>
            <div>
              <h3 className={styles.regimeTitle}>Old Tax Regime</h3>
              <div className={styles.regimeSub}>With Chapter VI-A Deductions</div>
            </div>
            {!isNewWinner && <span className={styles.tagRecommended}>Recommended</span>}
          </div>
          <div className={styles.regimeHeroAmount}>
            {currencySymbol}
            {comparison.oldRegime.totalTaxPayable.toLocaleString('en-IN')}
          </div>
          <div className={styles.regimeWords}>
            Effective Tax Rate: {comparison.oldRegime.effectiveTaxRate}%
          </div>
          <div className={styles.detailRows}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Gross Total Income</span>
              <span className={styles.detailValue}>
                {currencySymbol}
                {comparison.oldRegime.grossTotalIncome.toLocaleString('en-IN')}
              </span>
            </div>
            {isSalaried && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Standard Deduction</span>
                <span className={styles.detailValueNegative}>
                  -{currencySymbol}
                  {comparison.oldRegime.standardDeduction.toLocaleString('en-IN')}
                </span>
              </div>
            )}
            {comparison.oldRegime.hraExemption > 0 && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>HRA Exemption (Sec 10(13A))</span>
                <span className={styles.detailValueNegative}>
                  -{currencySymbol}
                  {comparison.oldRegime.hraExemption.toLocaleString('en-IN')}
                </span>
              </div>
            )}
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Chapter VI-A Deductions</span>
              <span className={styles.detailValueNegative}>
                -{currencySymbol}
                {comparison.oldRegime.totalDeductions.toLocaleString('en-IN')}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Total Taxable Income</span>
              <span className={styles.detailValue}>
                {currencySymbol}
                {comparison.oldRegime.taxableIncome.toLocaleString('en-IN')}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Slab Tax</span>
              <span className={styles.detailValue}>
                {currencySymbol}
                {comparison.oldRegime.slabTax.toLocaleString('en-IN')}
              </span>
            </div>
            {comparison.oldRegime.rebate87A > 0 && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Section 87A Rebate</span>
                <span className={styles.detailValueNegative}>
                  -{currencySymbol}
                  {comparison.oldRegime.rebate87A.toLocaleString('en-IN')}
                </span>
              </div>
            )}
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Health &amp; Education Cess (4%)</span>
              <span className={styles.detailValue}>
                {currencySymbol}
                {comparison.oldRegime.cess.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </section>
      {/* Breakeven Deductions Indicator */}
      <section className={styles.breakevenCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-heading)' }}>
              Breakeven Deductions Threshold
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem' }}>
              You need a minimum of <strong>{currencySymbol}{comparison.breakevenDeductions.toLocaleString('en-IN')}</strong> in total
              deductions for the Old Regime to be better than the New Regime.
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Currently Claimed</div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-primary)' }}>
              {currencySymbol}{comparison.currentDeductionsClaimed.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
        <div className={styles.breakevenBar}>
          <div
            className={styles.breakevenFill}
            style={{
              width: `${Math.min(
                100,
                Math.round(
                  (comparison.currentDeductionsClaimed / (comparison.breakevenDeductions || 1)) * 100
                )
              )}%`,
            }}
          />
        </div>
        {comparison.additionalDeductionsNeeded > 0 ? (
          <div style={{ fontSize: '0.6875rem', color: '#d97706', fontWeight: 600 }}>
            You need {currencySymbol}{comparison.additionalDeductionsNeeded.toLocaleString('en-IN')} more in deductions to break even with the New Regime.
          </div>
        ) : (
          <div style={{ fontSize: '0.6875rem', color: '#16a34a', fontWeight: 600 }}>
            Your deductions exceed the breakeven threshold, making the Old Regime more beneficial!
          </div>
        )}
      </section>
      {/* Tax Strategy Advisory Section */}
      <section className={styles.aiCard}>
        <div className={styles.aiHeader}>
          <div className={styles.aiTitleGroup}>
            <FiCpu className={styles.aiIcon} />
            <h2 className={styles.aiTitle}>Tax Strategy &amp; Optimization Advisory</h2>
          </div>
          <span className={styles.aiBadge}>
            {hasTaxPro ? 'Tax Pro Active' : 'Tax Pro Feature'}
          </span>
        </div>
        <p className={styles.aiDesc}>
          Get institutional-grade tax planning tailored specifically to your financial figures.
          Analyzes your salary, second business, PPF earnings, capital gains harvesting, and all
          Section 80 deductions.
        </p>
        <div>
          <button
            type="button"
            disabled={strategyLoading}
            onClick={() => void handleGenerateStrategyAdvice()}
            className={styles.aiActionBtn}
          >
            <FiCpu />
            <span>
              {strategyLoading ? 'Generating Optimization Strategy...' : 'Generate Tax Optimization Strategy'}
            </span>
          </button>
          <div className={styles.aiQuestionRow}>
            <input
              type="text"
              value={strategyQuestion}
              onChange={(e) => setStrategyQuestion(e.target.value)}
              placeholder="Ask specific tax questions (e.g., 'What if I invest ₹50k in NPS?', 'How should I treat freelance income?')"
              className={styles.aiQuestionInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void handleGenerateStrategyAdvice(strategyQuestion);
                }
              }}
            />
            <button
              type="button"
              disabled={strategyLoading || !strategyQuestion.trim()}
              onClick={() => void handleGenerateStrategyAdvice(strategyQuestion)}
              className={styles.aiAskBtn}
            >
              <FiSend style={{ marginRight: '0.25rem' }} /> Consult Engine
            </button>
          </div>
          {showUpgradeGate && !hasTaxPro && (
            <div className={styles.taxProTeaser}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-heading)' }}>
                  Unlock Personalized Tax Strategy Advisory
                </div>
                <div style={{ fontSize: '0.8125rem', opacity: 0.85, marginTop: '0.25rem' }}>
                  Institutional-grade tax optimization with multi-source planning, custom deduction modeling, and continuous savings recommendations is exclusive to <strong>Tax Pro</strong> (₹129/mo or ₹999/yr).
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/upgrade?plan=tax_monthly')}
                className={styles.taxProUpgradeBtn}
              >
                Upgrade to Tax Pro &rarr;
              </button>
            </div>
          )}
          {strategyAdvice && (
            <div className={styles.aiResponseBox}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                <FiAward />
                <span>Customized Tax Advisory Report</span>
              </div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{strategyAdvice}</div>
            </div>
          )}
        </div>
      </section>
      {/* Rule-Based Instant Optimization Recommendations */}
      <section className={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1rem', color: 'var(--color-heading)' }}>
          <FiTrendingUp style={{ color: '#16a34a' }} />
          <h2>Instant Tax Optimization Strategies</h2>
        </div>
        <p className={styles.cardDesc}>
          Actionable steps to legally minimize your tax liability under Indian tax laws:
        </p>
        <div className={styles.tipsGrid}>
          {comparison.optimizationTips.map((tip, idx) => (
            <div key={idx} className={styles.tipCard}>
              <div>
                <div className={styles.tipHeader}>
                  <span className={styles.tipCategory}>{tip.category}</span>
                  {tip.potentialTaxSavings > 0 && (
                    <span className={styles.tipSavings}>
                      Save up to {currencySymbol}{tip.potentialTaxSavings.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <h4 className={styles.tipTitle}>{tip.title}</h4>
                <p className={styles.tipDesc}>{tip.description}</p>
              </div>
              {tip.codeSection && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.6875rem', opacity: 0.6, fontWeight: 600 }}>
                  Ref: {tip.codeSection}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
      {/* Multi-Section Detailed Inputs */}
      <section className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 className={styles.cardHeading}>
              <FiDollarSign /> Enter Income Sources &amp; Deductions
            </h2>
            <p className={styles.cardDesc} style={{ margin: 0 }}>
              Adjust details below to see live updates to both tax regimes.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value as '2024-25' | '2025-26')}
              className={styles.select}
              style={{ width: '130px', height: '36px', fontSize: '0.75rem' }}
            >
              <option value="2024-25">FY 2024-25</option>
              <option value="2025-26">FY 2025-26</option>
            </select>
            <select
              value={ageCategory}
              onChange={(e) => setAgeCategory(e.target.value as AgeCategory)}
              className={styles.select}
              style={{ width: '150px', height: '36px', fontSize: '0.75rem' }}
            >
              <option value="general">&lt;60 Yrs (General)</option>
              <option value="senior">60-79 Yrs (Senior)</option>
              <option value="super_senior">80+ Yrs (Super Senior)</option>
            </select>
          </div>
        </div>
        {/* Input Navigation Tabs */}
        <div className={styles.tabsNav}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'salary' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('salary')}
          >
            <FiBriefcase size={14} />
            <span>Salary &amp; HRA</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'business' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('business')}
          >
            <FiTrendingUp size={14} />
            <span>2nd Business / Freelance</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'house' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('house')}
          >
            <FiHome size={14} />
            <span>House Property &amp; Rent</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'capital_gains' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('capital_gains')}
          >
            <FiPieChart size={14} />
            <span>Mutual Funds &amp; Stocks</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'interest' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('interest')}
          >
            <FiShield size={14} />
            <span>PPF &amp; Interest</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'deductions' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('deductions')}
          >
            <FiAward size={14} />
            <span>Deductions (80C/80D/NPS)</span>
          </button>
        </div>
        {/* Tab 1: Salary & HRA */}
        {activeTab === 'salary' && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <label className={styles.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isSalaried}
                  onChange={(e) => setIsSalaried(e.target.checked)}
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                <span>Are you a Salaried Employee? (Eligible for Standard Deduction)</span>
              </label>
            </div>
            {isSalaried && (
              <div>
                <ValuePicker
                  title="Annual Gross Salary"
                  value={grossSalary}
                  onChange={setGrossSalary}
                  stepData={SALARY_STEPS}
                  min={0}
                  max={100000000}
                />
                <div className={styles.formGrid2} style={{ marginTop: '1rem' }}>
                  <div className={styles.formField}>
                    <label htmlFor="tax-basic-salary" className={styles.label}>Basic Salary (for HRA / NPS)</label>
                    <input
                      id="tax-basic-salary"
                      type="text"
                      value={basicSalary}
                      onChange={(e) => setBasicSalary(e.target.value)}
                      className={styles.input}
                    />
                    <span style={{ fontSize: '0.6875rem', opacity: 0.7 }}>
                      {convertToWords(sanitizeAmount(basicSalary), 'en-IN')}
                    </span>
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="tax-city-type" className={styles.label}>City of Residence (HRA)</label>
                    <select
                      id="tax-city-type"
                      value={cityCategory}
                      onChange={(e) => setCityCategory(e.target.value as CityCategory)}
                      className={styles.select}
                    >
                      <option value="metro">Metro (Delhi, Mumbai, Kolkata, Chennai - 50%)</option>
                      <option value="non_metro">Non-Metro (40%)</option>
                    </select>
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="tax-hra-received" className={styles.label}>HRA Received from Employer</label>
                    <input
                      id="tax-hra-received"
                      type="text"
                      value={hraReceived}
                      onChange={(e) => setHraReceived(e.target.value)}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="tax-rent-paid" className={styles.label}>Total Annual Rent Paid</label>
                    <input
                      id="tax-rent-paid"
                      type="text"
                      value={rentPaid}
                      onChange={(e) => setRentPaid(e.target.value)}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="tax-prof-tax" className={styles.label}>
                      Professional Tax (Sec 16(iii))
                    </label>
                    <input
                      id="tax-prof-tax"
                      type="text"
                      value={professionalTax}
                      onChange={(e) => setProfessionalTax(e.target.value)}
                      placeholder="e.g. 2400 (Deductible up to ₹2,500 in Old Regime)"
                      className={styles.input}
                    />
                    <span style={{ fontSize: '0.6875rem', opacity: 0.7 }}>
                      Deductible up to ₹2,500/year under Old Regime.
                    </span>
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="tax-exempt-allowances" className={styles.label}>
                      Exempt Allowances (Sec 10 - LTA, Conveyance, Uniform)
                    </label>
                    <input
                      id="tax-exempt-allowances"
                      type="text"
                      value={exemptAllowances}
                      onChange={(e) => setExemptAllowances(e.target.value)}
                      placeholder="e.g. 50000"
                      className={styles.input}
                    />
                    <span style={{ fontSize: '0.6875rem', opacity: 0.7 }}>
                      Exempt from salary in Old Regime with valid receipts.
                    </span>
                  </div>
                </div>
                {/* Standard Deduction Custom Override */}
                <div style={{ marginTop: '1rem', padding: '0.875rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm, 6px)', border: '1px solid var(--color-border)' }}>
                  <label className={styles.checkboxToggle}>
                    <input
                      type="checkbox"
                      checked={useCustomStdDeduction}
                      onChange={(e) => setUseCustomStdDeduction(e.target.checked)}
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                    <span>Override Standard Deduction (Default: ₹75,000 New / ₹50,000 Old)</span>
                  </label>
                  {useCustomStdDeduction && (
                    <div style={{ marginTop: '0.75rem', maxWidth: '300px' }}>
                      <input
                        type="text"
                        value={customStdDeduction}
                        onChange={(e) => setCustomStdDeduction(e.target.value)}
                        placeholder="Custom Standard Deduction Amount"
                        className={styles.input}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        {/* Tab 2: 2nd Business / Freelancing */}
        {activeTab === 'business' && (
          <div>
            <p className={styles.cardDesc}>
              Enter net profits from freelance work, consultation, digital creator income, or a second business (under Section 44AD / 44ADA or regular accounting).
            </p>
            <ValuePicker
              title="Net Profit from Business / Profession"
              value={businessIncome}
              onChange={setBusinessIncome}
              stepData={[
                { id: 'b1', value: '2000000', title: '₹20L' },
                { id: 'b2', value: '1000000', title: '₹10L' },
                { id: 'b3', value: '500000', title: '₹5L' },
                { id: 'b4', value: '200000', title: '₹2L' },
                { id: 'b5', value: '0', title: '₹0' },
              ]}
              min={0}
              max={50000000}
            />
          </div>
        )}
        {/* Tab 3: House Property */}
        {activeTab === 'house' && (
          <div className={styles.formGrid2}>
            <div className={styles.formField}>
              <label className={styles.label}>Property Status</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="hpStatus"
                    checked={isSelfOccupied}
                    onChange={() => setIsSelfOccupied(true)}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <span>Self-Occupied</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="hpStatus"
                    checked={!isSelfOccupied}
                    onChange={() => setIsSelfOccupied(false)}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <span>Let-Out (Rented)</span>
                </label>
              </div>
            </div>
            <div className={styles.formField}>
              <label htmlFor="tax-home-loan-interest" className={styles.label}>Home Loan Interest (Section 24(b))</label>
              <input
                id="tax-home-loan-interest"
                type="text"
                value={homeLoanInterestProperty}
                onChange={(e) => setHomeLoanInterestProperty(e.target.value)}
                placeholder="Max ₹2 Lakh deduction for self-occupied"
                className={styles.input}
              />
              <span style={{ fontSize: '0.6875rem', opacity: 0.7 }}>
                Deductible up to ₹2,00,000 in Old Regime.
              </span>
            </div>
            {!isSelfOccupied && (
              <>
                <div className={styles.formField}>
                  <label htmlFor="tax-rental-income" className={styles.label}>Annual Rent Received</label>
                  <input
                    id="tax-rental-income"
                    type="text"
                    value={rentalIncome}
                    onChange={(e) => setRentalIncome(e.target.value)}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="tax-municipal-taxes" className={styles.label}>Municipal Taxes Paid</label>
                  <input
                    id="tax-municipal-taxes"
                    type="text"
                    value={municipalTaxes}
                    onChange={(e) => setMunicipalTaxes(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </>
            )}
          </div>
        )}
        {/* Tab 4: Capital Gains (Mutual Funds & Stocks) */}
        {activeTab === 'capital_gains' && (
          <div className={styles.formGrid2}>
            <div className={styles.formField}>
              <label htmlFor="tax-equity-stcg" className={styles.label}>
                Equity Short-Term Capital Gains (STCG)
                <span style={{ marginLeft: '0.5rem', color: '#d97706', fontSize: '0.6875rem' }}>
                  (Taxed at 20%)
                </span>
              </label>
              <input
                id="tax-equity-stcg"
                type="text"
                value={equityStcg}
                onChange={(e) => setEquityStcg(e.target.value)}
                placeholder="Shares / Equity MF held < 1 year"
                className={styles.input}
              />
              <span style={{ fontSize: '0.6875rem', opacity: 0.7 }}>
                Budget 2024 revised STCG rate to 20% under Section 111A.
              </span>
            </div>
            <div className={styles.formField}>
              <label htmlFor="tax-equity-ltcg" className={styles.label}>
                Equity Long-Term Capital Gains (LTCG)
                <span style={{ marginLeft: '0.5rem', color: '#16a34a', fontSize: '0.6875rem' }}>
                  (₹1.25L Exempt, 12.5% above)
                </span>
              </label>
              <input
                id="tax-equity-ltcg"
                type="text"
                value={equityLtcg}
                onChange={(e) => setEquityLtcg(e.target.value)}
                placeholder="Shares / Equity MF held > 1 year"
                className={styles.input}
              />
              <span style={{ fontSize: '0.6875rem', opacity: 0.7 }}>
                First ₹1,25,000 is 100% tax-free under Section 112A.
              </span>
            </div>
            <div className={styles.formField}>
              <label htmlFor="tax-other-capital-gains" className={styles.label}>Other Capital Gains (Debt Funds, Real Estate)</label>
              <input
                id="tax-other-capital-gains"
                type="text"
                value={otherCapitalGains}
                onChange={(e) => setOtherCapitalGains(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>
        )}
        {/* Tab 5: Interest & PPF */}
        {activeTab === 'interest' && (
          <div className={styles.formGrid2}>
            <div className={styles.formField}>
              <label htmlFor="tax-ppf-interest" className={styles.label}>
                Annual PPF Interest Earned
                <span className={styles.exemptBadge}>100% Tax-Exempt (EEE)</span>
              </label>
              <input
                id="tax-ppf-interest"
                type="text"
                value={ppfInterest}
                onChange={(e) => setPpfInterest(e.target.value)}
                className={styles.input}
              />
              <span style={{ fontSize: '0.6875rem', color: '#16a34a', fontWeight: 600 }}>
                Completely exempt from tax under Section 10(11) in both Old and New Regimes.
              </span>
            </div>
            <div className={styles.formField}>
              <label htmlFor="tax-savings-interest" className={styles.label}>Savings Bank Interest</label>
              <input
                id="tax-savings-interest"
                type="text"
                value={savingsInterest}
                onChange={(e) => setSavingsInterest(e.target.value)}
                className={styles.input}
              />
              <span style={{ fontSize: '0.6875rem', opacity: 0.7 }}>
                Deductible up to ₹10,000 under Section 80TTA (₹50,000 for seniors under 80TTB) in Old Regime.
              </span>
            </div>
            <div className={styles.formField}>
              <label htmlFor="tax-fd-interest" className={styles.label}>Fixed Deposit (FD) &amp; Recurring Deposit Interest</label>
              <input
                id="tax-fd-interest"
                type="text"
                value={fdInterest}
                onChange={(e) => setFdInterest(e.target.value)}
                className={styles.input}
              />
              <span style={{ fontSize: '0.6875rem', opacity: 0.7 }}>
                FD interest is fully taxable at your applicable slab rate.
              </span>
            </div>
            <div className={styles.formField}>
              <label htmlFor="tax-other-income" className={styles.label}>Other Sources (Dividends, etc.)</label>
              <input
                id="tax-other-income"
                type="text"
                value={otherIncome}
                onChange={(e) => setOtherIncome(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>
        )}
        {/* Tab 6: Deductions (Old Regime) */}
        {activeTab === 'deductions' && (
          <div>
            <p className={styles.cardDesc}>
              Chapter VI-A tax deductions apply primarily to the <strong>Old Tax Regime</strong> (with
              the exception of Section 80CCD(2) employer NPS which applies to both).
            </p>
            <ValuePicker
              title="Section 80C (PPF, EPF, ELSS, Life Insurance - Max ₹1.5L)"
              value={section80C}
              onChange={setSection80C}
              stepData={DEDUCTION_80C_STEPS}
              min={0}
              max={150000}
            />
            <div className={styles.formGrid2} style={{ marginTop: '1rem' }}>
              <div className={styles.formField}>
                <label htmlFor="tax-deduction-80ccd1b" className={styles.label}>
                  Section 80CCD(1B) — NPS Tier 1 Self Contribution
                  <span style={{ color: '#16a34a', marginLeft: '0.5rem' }}>(Max ₹50,000)</span>
                </label>
                <input
                  id="tax-deduction-80ccd1b"
                  type="text"
                  value={section80Ccd1b}
                  onChange={(e) => setSection80Ccd1b(e.target.value)}
                  placeholder="Up to ₹50,000 extra beyond 80C"
                  className={styles.input}
                />
              </div>
              <div className={styles.formField}>
                <label htmlFor="tax-deduction-80ccd2" className={styles.label}>
                  Section 80CCD(2) — Employer NPS Contribution
                  <span style={{ color: '#6366f1', marginLeft: '0.5rem' }}>(Both Regimes)</span>
                </label>
                <input
                  id="tax-deduction-80ccd2"
                  type="text"
                  value={section80Ccd2}
                  onChange={(e) => setSection80Ccd2(e.target.value)}
                  placeholder="Up to 10% of Basic salary"
                  className={styles.input}
                />
              </div>
              <div className={styles.formField}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="tax-deduction-80d-self" className={styles.label}>
                    Section 80D — Health Insurance (Self &amp; Family)
                  </label>
                  <label className={styles.checkboxToggle} style={{ fontSize: '0.6875rem' }}>
                    <input
                      type="checkbox"
                      checked={seniorSelf80D}
                      onChange={(e) => setSeniorSelf80D(e.target.checked)}
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                    <span>Senior (Limit ₹50k)</span>
                  </label>
                </div>
                <input
                  id="tax-deduction-80d-self"
                  type="text"
                  value={section80DSelf}
                  onChange={(e) => setSection80DSelf(e.target.value)}
                  placeholder={seniorSelf80D ? 'Max ₹50,000 for Senior Citizen' : 'Max ₹25,000'}
                  className={styles.input}
                />
              </div>
              <div className={styles.formField}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="tax-deduction-80d-parents" className={styles.label}>
                    Section 80D — Health Insurance (Parents)
                  </label>
                  <label className={styles.checkboxToggle} style={{ fontSize: '0.6875rem' }}>
                    <input
                      type="checkbox"
                      checked={seniorParents80D}
                      onChange={(e) => setSeniorParents80D(e.target.checked)}
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                    <span>Senior Parents (Limit ₹50k)</span>
                  </label>
                </div>
                <input
                  id="tax-deduction-80d-parents"
                  type="text"
                  value={section80DParents}
                  onChange={(e) => setSection80DParents(e.target.value)}
                  placeholder={seniorParents80D ? 'Max ₹50,000 for Senior Parents' : 'Max ₹25,000'}
                  className={styles.input}
                />
              </div>
              <div className={styles.formField}>
                <label htmlFor="tax-deduction-80e" className={styles.label}>Section 80E — Education Loan Interest</label>
                <input
                  id="tax-deduction-80e"
                  type="text"
                  value={section80E}
                  onChange={(e) => setSection80E(e.target.value)}
                  placeholder="Full interest deduction, no limit"
                  className={styles.input}
                />
              </div>
              <div className={styles.formField}>
                <label htmlFor="tax-deduction-80g" className={styles.label}>Section 80G — Eligible Charitable Donations</label>
                <input
                  id="tax-deduction-80g"
                  type="text"
                  value={section80G}
                  onChange={(e) => setSection80G(e.target.value)}
                  className={styles.input}
                />
              </div>
              <div className={styles.formField}>
                <label htmlFor="tax-deduction-80tta" className={styles.label}>
                  Section 80TTA/80TTB — Savings Interest Deduction
                </label>
                <input
                  id="tax-deduction-80tta"
                  type="text"
                  value={section80Tta}
                  onChange={(e) => setSection80Tta(e.target.value)}
                  placeholder="Max ₹10,000 (₹50,000 for Senior Citizens)"
                  className={styles.input}
                />
              </div>
              <div className={styles.formField}>
                <label htmlFor="tax-deduction-80gg" className={styles.label}>
                  Section 80GG — House Rent Paid (No HRA)
                </label>
                <input
                  id="tax-deduction-80gg"
                  type="text"
                  value={section80Gg}
                  onChange={(e) => setSection80Gg(e.target.value)}
                  placeholder="Max ₹60,000/yr (when HRA is not provided)"
                  className={styles.input}
                />
              </div>
              <div className={styles.formField}>
                <label htmlFor="tax-deduction-80ddb" className={styles.label}>
                  Section 80DDB — Medical Treatment (Specified Diseases)
                </label>
                <input
                  id="tax-deduction-80ddb"
                  type="text"
                  value={section80Ddb}
                  onChange={(e) => setSection80Ddb(e.target.value)}
                  placeholder="Max ₹40,000 (₹1,00,000 for Senior)"
                  className={styles.input}
                />
              </div>
              <div className={styles.formField}>
                <label htmlFor="tax-deduction-80u" className={styles.label}>
                  Section 80U — Person with Disability
                </label>
                <input
                  id="tax-deduction-80u"
                  type="text"
                  value={section80U}
                  onChange={(e) => setSection80U(e.target.value)}
                  placeholder="₹75,000 (₹1,25,000 for severe disability)"
                  className={styles.input}
                />
              </div>
              <div className={styles.formField}>
                <label htmlFor="tax-deduction-80eea" className={styles.label}>
                  Section 80EEA — Additional Affordable Home Loan Interest
                </label>
                <input
                  id="tax-deduction-80eea"
                  type="text"
                  value={section80Eea}
                  onChange={(e) => setSection80Eea(e.target.value)}
                  placeholder="Max ₹1,50,000"
                  className={styles.input}
                />
              </div>
              <div className={styles.formField}>
                <label htmlFor="tax-other-deductions" className={styles.label}>
                  Other Miscellaneous Deductions
                </label>
                <input
                  id="tax-other-deductions"
                  type="text"
                  value={otherDeductions}
                  onChange={(e) => setOtherDeductions(e.target.value)}
                  placeholder="Other eligible tax deductions"
                  className={styles.input}
                />
              </div>
            </div>
            {/* Custom Deductions List */}
            <div className={styles.customDeductionsContainer}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-heading)' }}>
                    Custom Tax Deductions
                  </h4>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', opacity: 0.75 }}>
                    Add any personalized deductions or state-specific exemptions not listed above.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddCustomDeduction}
                  className={styles.addDeductionBtn}
                >
                  <FiPlus size={14} /> Add Custom Deduction
                </button>
              </div>
              {customDeductionsList.map((item) => (
                <div key={item.id} className={styles.customDeductionRow}>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleUpdateCustomDeduction(item.id, 'name', e.target.value)}
                    placeholder="Deduction Name / Section"
                    className={styles.input}
                    style={{ flex: 2 }}
                  />
                  <input
                    type="text"
                    value={item.amount}
                    onChange={(e) => handleUpdateCustomDeduction(item.id, 'amount', e.target.value)}
                    placeholder="Amount (₹)"
                    className={styles.input}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomDeduction(item.id)}
                    className={styles.deleteDeductionBtn}
                    title="Remove custom deduction"
                    aria-label="Remove deduction"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
      {/* Educational Guide */}
      <CalculatorContentSection
        title="Old vs New Tax Regime: Key Differences &amp; Budget 2024 Changes"
        subtitle="The Finance Act 2024 introduced major structural adjustments to the New Tax Regime, enhancing standard deduction and expanding tax slabs to offer greater relief to Indian taxpayers."
        comparisonTable={{
          headers: ['Feature', 'New Tax Regime (FY 2024-25 / 2025-26)', 'Old Tax Regime'],
          rows: [
            ['Standard Deduction', '₹75,000 (Salaried & Pensioners)', '₹50,000'],
            ['Zero Tax Income (Salaried)', 'Up to ₹7,75,000 (with Sec 87A rebate)', 'Up to ₹5,50,000 (with Sec 87A rebate)'],
            ['Section 80C Deductions', 'Not Allowed', 'Allowed up to ₹1,50,000 (PPF, ELSS, EPF)'],
            ['NPS Tier-1 Self (80CCD 1B)', 'Not Allowed', 'Allowed up to ₹50,000'],
            ['Employer NPS (80CCD 2)', 'Allowed up to 10% of Basic+DA', 'Allowed up to 10% of Basic+DA'],
            ['HRA Exemption (10(13A))', 'Not Allowed', 'Allowed with rent receipts'],
            ['Home Loan Interest (24b)', 'Not Allowed on self-occupied', 'Allowed up to ₹2,00,000'],
            ['PPF Interest Exemption', '100% Tax-Exempt (Sec 10(11))', '100% Tax-Exempt (Sec 10(11))'],
          ],
        }}
        faqs={[
          {
            question: 'How does the Section 87A rebate work in the New Tax Regime?',
            answer:
              'In the New Tax Regime, if your total taxable income (after standard deduction) is ₹7,00,000 or less, you receive a full rebate of up to ₹25,000 under Section 87A, making your tax payable zero. For salaried individuals, adding the ₹75,000 standard deduction means gross salaries up to ₹7,75,000 pay zero income tax.',
          },
          {
            question: 'Can I switch between the Old and New Tax Regimes every year?',
            answer:
              'Salaried individuals with no business or professional income can freely choose between the Old and New Tax Regimes each financial year at the time of filing their ITR. However, individuals with business or professional income (including freelance income under Section 44AD/44ADA) can only switch back to the Old Regime once in their lifetime.',
          },
          {
            question: 'How are Equity Mutual Funds taxed after the July 2024 Budget?',
            answer:
              'Under the updated Budget 2024 rules: Short-Term Capital Gains (STCG on equity held under 12 months) are taxed at 20% under Section 111A. Long-Term Capital Gains (LTCG on equity held over 12 months) are tax-free up to ₹1,25,000 per financial year; gains exceeding ₹1.25 Lakh are taxed at 12.5% without indexation under Section 112A.',
          },
        ]}
      />
    </main>
  );
};
export default IncomeTaxCalculator;
