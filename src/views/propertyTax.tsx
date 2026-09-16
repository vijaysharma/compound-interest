'use client';
import React, { useMemo, useState } from 'react';
import {
  FiAward,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiDollarSign,
  FiHome,
  FiInfo,
  FiPercent,
  FiShield,
  FiTrendingUp,
} from 'react-icons/fi';
import convertToWords, { getCurrencySymbol } from '../utilities/currency';
import {
  calculatePropertyCapitalGains,
  CII_YEARS,
  COST_INFLATION_INDEX,
  getFinancialYear,
  type PropertyTaxInputs,
} from '../data/propertyTaxData';
import CalculatorContentSection from '../components/CalculatorContentSection';
import styles from './PropertyTax.module.scss';
const PROPERTY_TAX_SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FinancialProduct',
      name: 'Property Capital Gains Tax Calculator India — Old vs New Rule (Indexation vs 12.5%)',
      description:
        'Calculate real estate long-term capital gains tax under the Finance Act 2024 grandfathering amendment. Compare 20% with Cost Inflation Index (CII) indexation against 12.5% flat tax with Section 54 & 54EC exemptions.',
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
          name: 'What is the new capital gains tax rule on property in Budget 2024?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Budget 2024 reduced the Long-Term Capital Gains (LTCG) tax rate on real estate from 20% to 12.5% and initially removed the indexation benefit. However, the Finance Bill amendment introduced a grandfathering clause: for properties acquired before July 23, 2024, resident individuals and HUFs can compute tax under both the Old Rule (20% with indexation) and New Rule (12.5% without indexation) and pay whichever is lower.',
          },
        },
        {
          '@type': 'Question',
          name: 'How is indexation benefit calculated for property sales?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Indexed Cost of Acquisition is calculated as: Purchase Price × (CII of Sale Year / CII of Purchase Year). Cost Inflation Index (CII) is notified annually by the Central Board of Direct Taxes (CBDT) with 2001-02 as the base year (100).',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the holding period for Long-Term Capital Gains (LTCG) on immovable property?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'For immovable property (land, house, apartment, commercial property), the holding period threshold for long-term capital assets is 24 months (2 years). If sold within 24 months, gains are treated as Short-Term Capital Gains (STCG) and taxed at applicable income tax slab rates.',
          },
        },
        {
          '@type': 'Question',
          name: 'How can I save capital gains tax under Section 54 and Section 54EC?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Under Section 54, LTCG from a residential house can be exempted if reinvested in buying or constructing another residential house in India within specified time limits (subject to a maximum cap of ₹10 Crores). Under Section 54EC, LTCG can be exempted by investing in specified capital gains bonds (REC, PFC, NHAI, IRFC) within 6 months of transfer, capped at ₹50 Lakhs per financial year.',
          },
        },
      ],
    },
  ],
};
const PURCHASE_PRESETS = [
  { label: '₹25 L', value: 2500000 },
  { label: '₹50 L', value: 5000000 },
  { label: '₹75 L', value: 7500000 },
  { label: '₹1 Cr', value: 10000000 },
  { label: '₹2 Cr', value: 20000000 },
];
const SALE_PRESETS = [
  { label: '₹60 L', value: 6000000 },
  { label: '₹1 Cr', value: 10000000 },
  { label: '₹1.5 Cr', value: 15000000 },
  { label: '₹2.5 Cr', value: 25000000 },
  { label: '₹5 Cr', value: 50000000 },
];
export default function PropertyTaxCalculatorView() {
  // Input states
  const [purchaseDate, setPurchaseDate] = useState<string>('2016-06-15');
  const [purchasePrice, setPurchasePrice] = useState<string>('4500000');
  const [saleDate, setSaleDate] = useState<string>('2025-02-15');
  const [salePrice, setSalePrice] = useState<string>('12000000');
  const [transferExpenses, setTransferExpenses] = useState<string>('150000');
  // Improvement states
  const [hasImprovement, setHasImprovement] = useState<boolean>(false);
  const [improvementCost, setImprovementCost] = useState<string>('0');
  const [improvementYear, setImprovementYear] = useState<string>('2019-20');
  // Exemptions states
  const [hasExemptions, setHasExemptions] = useState<boolean>(false);
  const [sec54Exemption, setSec54Exemption] = useState<string>('0');
  const [sec54ecExemption, setSec54ecExemption] = useState<string>('0');
  // STCG slab rate
  const [stcgSlabRate, setStcgSlabRate] = useState<number>(30);
  // Compute results
  const comparison = useMemo(() => {
    const inputs: PropertyTaxInputs = {
      purchaseDate,
      purchasePrice: parseFloat(purchasePrice) || 0,
      saleDate,
      salePrice: parseFloat(salePrice) || 0,
      improvementCost: hasImprovement ? parseFloat(improvementCost) || 0 : 0,
      improvementYear: hasImprovement ? improvementYear : undefined,
      transferExpenses: parseFloat(transferExpenses) || 0,
      sec54Exemption: hasExemptions ? parseFloat(sec54Exemption) || 0 : 0,
      sec54ecExemption: hasExemptions ? parseFloat(sec54ecExemption) || 0 : 0,
      stcgSlabRate,
    };
    return calculatePropertyCapitalGains(inputs);
  }, [
    purchaseDate,
    purchasePrice,
    saleDate,
    salePrice,
    hasImprovement,
    improvementCost,
    improvementYear,
    transferExpenses,
    hasExemptions,
    sec54Exemption,
    sec54ecExemption,
    stcgSlabRate,
  ]);
  const currencySymbol = getCurrencySymbol('en-IN', 'INR');
  return (
    <div className={styles.container}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PROPERTY_TAX_SCHEMA) }}
      />
      {/* Header */}
      <header className={styles.header}>
        <span className={styles.badge}>Finance Act 2024 Grandfathering Clause</span>
        <h1 className={styles.title}>Property Capital Gains Tax Calculator</h1>
        <p className={styles.subtitle}>
          Compare real estate capital gains tax under the <strong>Old Rule (20% with CII Indexation)</strong> versus{' '}
          <strong>New Rule (12.5% flat without Indexation)</strong>. Find out which regime saves you more tax under the
          latest Budget 2024 amendments.
        </p>
      </header>
      {/* Main Grid */}
      <div className={styles.mainGrid}>
        {/* Left Column: Inputs */}
        <div className={styles.inputsCol}>
          {/* Purchase Details */}
          <div className={styles.card}>
            <h2 className={styles.sectionHeading}>
              <FiHome className={styles.icon} />
              1. Purchase Details
            </h2>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="purchase-date-input">
                <span>Purchase Date</span>
                <span className={styles.infoBadge}>FY {getFinancialYear(purchaseDate)}</span>
              </label>
              <input
                id="purchase-date-input"
                type="date"
                className={styles.inputDate}
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="purchase-price-input">
                <span>Purchase Price (Cost of Acquisition)</span>
              </label>
              <div className={styles.amountInputContainer}>
                <span className={styles.currencyPrefix}>{currencySymbol}</span>
                <input
                  id="purchase-price-input"
                  type="number"
                  className={styles.amountInput}
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="e.g. 4500000"
                />
              </div>
              <div className={styles.amountWords}>
                {convertToWords(parseFloat(purchasePrice) || 0, 'en-IN')}
              </div>
              <div className={styles.presetChips}>
                {PURCHASE_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    className={styles.presetChip}
                    onClick={() => setPurchasePrice(p.value.toString())}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Sale Details */}
          <div className={styles.card}>
            <h2 className={styles.sectionHeading}>
              <FiDollarSign className={styles.icon} />
              2. Sale Details
            </h2>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="sale-date-input">
                <span>Sale Date</span>
                <span className={styles.infoBadge}>FY {getFinancialYear(saleDate)}</span>
              </label>
              <input
                id="sale-date-input"
                type="date"
                className={styles.inputDate}
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="sale-price-input">
                <span>Total Sale Value (Full Consideration)</span>
              </label>
              <div className={styles.amountInputContainer}>
                <span className={styles.currencyPrefix}>{currencySymbol}</span>
                <input
                  id="sale-price-input"
                  type="number"
                  className={styles.amountInput}
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="e.g. 12000000"
                />
              </div>
              <div className={styles.amountWords}>
                {convertToWords(parseFloat(salePrice) || 0, 'en-IN')}
              </div>
              <div className={styles.presetChips}>
                {SALE_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    className={styles.presetChip}
                    onClick={() => setSalePrice(p.value.toString())}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="transfer-expenses-input">
                <span>Transfer Expenses (Brokerage, Legal, Stamp Charges)</span>
              </label>
              <div className={styles.amountInputContainer}>
                <span className={styles.currencyPrefix}>{currencySymbol}</span>
                <input
                  id="transfer-expenses-input"
                  type="number"
                  className={styles.amountInput}
                  value={transferExpenses}
                  onChange={(e) => setTransferExpenses(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className={styles.amountWords}>
                {convertToWords(parseFloat(transferExpenses) || 0, 'en-IN')}
              </div>
            </div>
          </div>
          {/* Optional: Improvement & Renovations */}
          <div className={styles.card}>
            <div
              className={styles.toggleSection}
              style={{ borderTop: 'none', marginTop: 0 }}
              onClick={() => setHasImprovement(!hasImprovement)}
            >
              <span className={styles.toggleLabel}>
                <FiTrendingUp /> Cost of Home Improvement / Renovation
              </span>
              <button type="button" className={styles.toggleButton}>
                {hasImprovement ? <FiChevronUp /> : <FiChevronDown />}
              </button>
            </div>
            {hasImprovement && (
              <div style={{ marginTop: '0.75rem' }}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="improvement-cost-input">
                    <span>Renovation / Improvement Cost</span>
                  </label>
                  <div className={styles.amountInputContainer}>
                    <span className={styles.currencyPrefix}>{currencySymbol}</span>
                    <input
                      id="improvement-cost-input"
                      type="number"
                      className={styles.amountInput}
                      value={improvementCost}
                      onChange={(e) => setImprovementCost(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className={styles.amountWords}>
                    {convertToWords(parseFloat(improvementCost) || 0, 'en-IN')}
                  </div>
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="improvement-fy-select">
                    <span>Financial Year of Renovation</span>
                  </label>
                  <select
                    id="improvement-fy-select"
                    className={styles.selectInput}
                    value={improvementYear}
                    onChange={(e) => setImprovementYear(e.target.value)}
                  >
                    {CII_YEARS.map((fy) => (
                      <option key={fy} value={fy}>
                        FY {fy} (CII: {COST_INFLATION_INDEX[fy]})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
          {/* Optional: Capital Gains Tax Exemptions (Section 54 & 54EC) */}
          <div className={styles.card}>
            <div
              className={styles.toggleSection}
              style={{ borderTop: 'none', marginTop: 0 }}
              onClick={() => setHasExemptions(!hasExemptions)}
            >
              <span className={styles.toggleLabel}>
                <FiShield /> Tax Exemptions (Sec 54 & Sec 54EC)
              </span>
              <button type="button" className={styles.toggleButton}>
                {hasExemptions ? <FiChevronUp /> : <FiChevronDown />}
              </button>
            </div>
            {hasExemptions && (
              <div style={{ marginTop: '0.75rem' }}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="sec54-input">
                    <span>Section 54 Reinvestment (New House Property)</span>
                    <span className={styles.infoBadge}>Cap: ₹10 Cr</span>
                  </label>
                  <div className={styles.amountInputContainer}>
                    <span className={styles.currencyPrefix}>{currencySymbol}</span>
                    <input
                      id="sec54-input"
                      type="number"
                      className={styles.amountInput}
                      value={sec54Exemption}
                      onChange={(e) => setSec54Exemption(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className={styles.amountWords}>
                    {convertToWords(parseFloat(sec54Exemption) || 0, 'en-IN')}
                  </div>
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="sec54ec-input">
                    <span>Section 54EC Capital Gains Bonds (REC / PFC / NHAI)</span>
                    <span className={styles.infoBadge}>Cap: ₹50 L</span>
                  </label>
                  <div className={styles.amountInputContainer}>
                    <span className={styles.currencyPrefix}>{currencySymbol}</span>
                    <input
                      id="sec54ec-input"
                      type="number"
                      className={styles.amountInput}
                      value={sec54ecExemption}
                      onChange={(e) => setSec54ecExemption(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className={styles.amountWords}>
                    {convertToWords(parseFloat(sec54ecExemption) || 0, 'en-IN')}
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Short-Term Slab rate (only relevant if held <= 24 months) */}
          {!comparison.isLongTerm && (
            <div className={styles.card}>
              <h2 className={styles.sectionHeading}>
                <FiPercent className={styles.icon} />
                STCG Slab Rate
              </h2>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="stcg-slab-select">
                  <span>Your Income Tax Slab Rate</span>
                </label>
                <select
                  id="stcg-slab-select"
                  className={styles.selectInput}
                  value={stcgSlabRate}
                  onChange={(e) => setStcgSlabRate(parseFloat(e.target.value) || 30)}
                >
                  <option value={5}>5% Slab (Effective 5.2% with Cess)</option>
                  <option value={10}>10% Slab (Effective 10.4% with Cess)</option>
                  <option value={15}>15% Slab (Effective 15.6% with Cess)</option>
                  <option value={20}>20% Slab (Effective 20.8% with Cess)</option>
                  <option value={30}>30% Slab (Effective 31.2% with Cess)</option>
                </select>
              </div>
            </div>
          )}
        </div>
        {/* Right Column: Output & Comparison */}
        <div className={styles.resultsCol}>
          {/* Holding Status Card */}
          <div className={styles.holdingStatusCard}>
            <div className={styles.holdingBadgeGroup}>
              <span
                className={`${styles.statusPill} ${
                  comparison.isLongTerm ? styles.ltcg : styles.stcg
                }`}
              >
                {comparison.isLongTerm ? 'Long-Term Asset' : 'Short-Term Asset'} (
                {comparison.holdingMonths} months)
              </span>
              {comparison.isGrandfathered && (
                <span className={`${styles.statusPill} ${styles.grandfathered}`}>
                  <FiAward size={12} /> Grandfathered (Acquired before 23-Jul-2024)
                </span>
              )}
            </div>
            <div className={styles.ciiStat}>
              CII: {comparison.purchaseFY} (<strong>{comparison.purchaseCII}</strong>) →{' '}
              {comparison.saleFY} (<strong>{comparison.saleCII}</strong>)
            </div>
          </div>
          {/* Verdict Banner */}
          <div className={styles.verdictBanner}>
            <FiCheckCircle className={styles.verdictIcon} />
            <div className={styles.verdictContent}>
              <div className={styles.verdictTitle}>
                {comparison.recommendedOption === 'old'
                  ? `Old Rule Wins! Save ₹${comparison.taxSavings.toLocaleString('en-IN')}`
                  : comparison.recommendedOption === 'new'
                    ? comparison.taxSavings > 0
                      ? `New Rule Wins! Save ₹${comparison.taxSavings.toLocaleString('en-IN')}`
                      : 'New Rule Applies (12.5%)'
                    : 'Short-Term Capital Gains (STCG)'}
              </div>
              <div className={styles.verdictText}>{comparison.summaryNote}</div>
            </div>
          </div>
          {/* Side-by-Side Comparison Cards */}
          <div className={styles.comparisonGrid}>
            {/* Old Regime Card */}
            <div
              className={`${styles.regimeCard} ${
                comparison.recommendedOption === 'old' ? styles.winner : ''
              } ${!comparison.oldRegime.applicable ? styles.disabled : ''}`}
            >
              {comparison.recommendedOption === 'old' && (
                <span className={styles.winnerTag}>Recommended</span>
              )}
              <div className={styles.regimeHeader}>
                <div className={styles.regimeTitle}>Old Rule (Indexation)</div>
                <div className={styles.regimeDesc}>20% Tax + 4% Cess with CII Benefit</div>
              </div>
              <div
                className={`${styles.regimeTaxAmount} ${
                  comparison.recommendedOption === 'old' ? styles.winnerColor : ''
                }`}
              >
                {currencySymbol}
                {comparison.oldRegime.totalTax.toLocaleString('en-IN')}
              </div>
              <div className={styles.regimeRateBadge}>
                Effective Rate: {comparison.oldRegime.applicable ? '20.8%' : 'N/A'}
              </div>
              <div className={styles.regimeBreakdown}>
                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownLabel}>Indexed Cost:</span>
                  <span className={styles.breakdownVal}>
                    {currencySymbol}
                    {comparison.oldRegime.totalIndexedCost.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownLabel}>Gross Capital Gain:</span>
                  <span className={styles.breakdownVal}>
                    {currencySymbol}
                    {comparison.oldRegime.grossGain.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownLabel}>Sec 54/54EC Exempt:</span>
                  <span className={styles.breakdownVal}>
                    -{currencySymbol}
                    {comparison.oldRegime.exemptions.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownLabel}>Taxable Gain:</span>
                  <span className={styles.breakdownVal}>
                    {currencySymbol}
                    {comparison.oldRegime.taxableGain.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className={styles.netInHandRow}>
                  <span>Net In-Hand:</span>
                  <span>
                    {currencySymbol}
                    {comparison.oldRegime.netInHand.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
            {/* New Regime Card */}
            <div
              className={`${styles.regimeCard} ${
                comparison.recommendedOption === 'new' ? styles.winner : ''
              }`}
            >
              {comparison.recommendedOption === 'new' && (
                <span className={styles.winnerTag}>Recommended</span>
              )}
              <div className={styles.regimeHeader}>
                <div className={styles.regimeTitle}>New Rule (Flat Rate)</div>
                <div className={styles.regimeDesc}>12.5% Tax + 4% Cess without Indexation</div>
              </div>
              <div
                className={`${styles.regimeTaxAmount} ${
                  comparison.recommendedOption === 'new' ? styles.winnerColor : ''
                }`}
              >
                {currencySymbol}
                {comparison.newRegime.totalTax.toLocaleString('en-IN')}
              </div>
              <div className={styles.regimeRateBadge}>Effective Rate: 13.0%</div>
              <div className={styles.regimeBreakdown}>
                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownLabel}>Actual Cost:</span>
                  <span className={styles.breakdownVal}>
                    {currencySymbol}
                    {comparison.newRegime.actualCost.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownLabel}>Gross Capital Gain:</span>
                  <span className={styles.breakdownVal}>
                    {currencySymbol}
                    {comparison.newRegime.grossGain.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownLabel}>Sec 54/54EC Exempt:</span>
                  <span className={styles.breakdownVal}>
                    -{currencySymbol}
                    {comparison.newRegime.exemptions.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownLabel}>Taxable Gain:</span>
                  <span className={styles.breakdownVal}>
                    {currencySymbol}
                    {comparison.newRegime.taxableGain.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className={styles.netInHandRow}>
                  <span>Net In-Hand:</span>
                  <span>
                    {currencySymbol}
                    {comparison.newRegime.netInHand.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* Audit / Comparison Table */}
          <div className={styles.tableCard}>
            <div className={styles.tableTitle}>Accounting Breakdown Comparison</div>
            <table className={styles.auditTable}>
              <thead>
                <tr>
                  <th>Particulars</th>
                  <th className={styles.textRight}>Old Rule (Indexation)</th>
                  <th className={styles.textRight}>New Rule (Flat 12.5%)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Full Value of Consideration (Sale Price)</td>
                  <td className={styles.textRight}>
                    {currencySymbol}
                    {(parseFloat(salePrice) || 0).toLocaleString('en-IN')}
                  </td>
                  <td className={styles.textRight}>
                    {currencySymbol}
                    {(parseFloat(salePrice) || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr>
                  <td>Less: Transfer Expenses</td>
                  <td className={styles.textRight}>
                    -{currencySymbol}
                    {(parseFloat(transferExpenses) || 0).toLocaleString('en-IN')}
                  </td>
                  <td className={styles.textRight}>
                    -{currencySymbol}
                    {(parseFloat(transferExpenses) || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr className={styles.boldRow}>
                  <td>Net Sale Consideration</td>
                  <td className={styles.textRight}>
                    {currencySymbol}
                    {comparison.netSaleConsideration.toLocaleString('en-IN')}
                  </td>
                  <td className={styles.textRight}>
                    {currencySymbol}
                    {comparison.netSaleConsideration.toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr>
                  <td>
                    Cost of Acquisition
                    {comparison.isLongTerm && (
                      <span style={{ display: 'block', fontSize: '0.75rem', opacity: 0.7 }}>
                        Old: Indexed ({comparison.purchaseCII} → {comparison.saleCII})
                      </span>
                    )}
                  </td>
                  <td className={styles.textRight}>
                    {currencySymbol}
                    {comparison.oldRegime.indexedAcquisitionCost.toLocaleString('en-IN')}
                  </td>
                  <td className={styles.textRight}>
                    {currencySymbol}
                    {(parseFloat(purchasePrice) || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
                {hasImprovement && (parseFloat(improvementCost) || 0) > 0 && (
                  <tr>
                    <td>Cost of Improvement (Renovation)</td>
                    <td className={styles.textRight}>
                      {currencySymbol}
                      {comparison.oldRegime.indexedImprovementCost.toLocaleString('en-IN')}
                    </td>
                    <td className={styles.textRight}>
                      {currencySymbol}
                      {(parseFloat(improvementCost) || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}
                <tr className={styles.boldRow}>
                  <td>Gross Capital Gain</td>
                  <td className={styles.textRight}>
                    {currencySymbol}
                    {comparison.oldRegime.grossGain.toLocaleString('en-IN')}
                  </td>
                  <td className={styles.textRight}>
                    {currencySymbol}
                    {comparison.newRegime.grossGain.toLocaleString('en-IN')}
                  </td>
                </tr>
                {hasExemptions && (
                  <tr>
                    <td>Less: Section 54 & 54EC Exemptions</td>
                    <td className={styles.textRight}>
                      -{currencySymbol}
                      {comparison.oldRegime.exemptions.toLocaleString('en-IN')}
                    </td>
                    <td className={styles.textRight}>
                      -{currencySymbol}
                      {comparison.newRegime.exemptions.toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}
                <tr className={styles.boldRow}>
                  <td>Net Taxable Capital Gain</td>
                  <td className={styles.textRight}>
                    {currencySymbol}
                    {comparison.oldRegime.taxableGain.toLocaleString('en-IN')}
                  </td>
                  <td className={styles.textRight}>
                    {currencySymbol}
                    {comparison.newRegime.taxableGain.toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr>
                  <td>Base Tax Rate</td>
                  <td className={styles.textRight}>20.00%</td>
                  <td className={styles.textRight}>12.50%</td>
                </tr>
                <tr>
                  <td>Base Tax Amount</td>
                  <td className={styles.textRight}>
                    {currencySymbol}
                    {comparison.oldRegime.baseTax.toLocaleString('en-IN')}
                  </td>
                  <td className={styles.textRight}>
                    {currencySymbol}
                    {comparison.newRegime.baseTax.toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr>
                  <td>Add: 4% Health & Education Cess</td>
                  <td className={styles.textRight}>
                    {currencySymbol}
                    {comparison.oldRegime.cess.toLocaleString('en-IN')}
                  </td>
                  <td className={styles.textRight}>
                    {currencySymbol}
                    {comparison.newRegime.cess.toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr className={styles.boldRow}>
                  <td>Total Tax Payable</td>
                  <td
                    className={`${styles.textRight} ${
                      comparison.recommendedOption === 'old' ? styles.winnerCell : ''
                    }`}
                  >
                    {currencySymbol}
                    {comparison.oldRegime.totalTax.toLocaleString('en-IN')}
                  </td>
                  <td
                    className={`${styles.textRight} ${
                      comparison.recommendedOption === 'new' ? styles.winnerCell : ''
                    }`}
                  >
                    {currencySymbol}
                    {comparison.newRegime.totalTax.toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr className={styles.boldRow}>
                  <td>Net In-Hand Proceeds</td>
                  <td className={styles.textRight}>
                    {currencySymbol}
                    {comparison.oldRegime.netInHand.toLocaleString('en-IN')}
                  </td>
                  <td className={styles.textRight}>
                    {currencySymbol}
                    {comparison.newRegime.netInHand.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* Legal Disclaimer Notice */}
          <div className={styles.disclaimerBanner}>
            <FiInfo style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />
            <strong>Tax Compliance Note:</strong> As per the Finance (No. 2) Act 2024, the option to
            choose between 20% with indexation and 12.5% without indexation is exclusively available
            to resident individuals and HUFs for immovable property purchased before July 23, 2024.
            Capital losses cannot be claimed under the Old Rule if the New Rule results in a gain.
          </div>
        </div>
      </div>
      {/* Educational & FAQ Content Section */}
      <CalculatorContentSection
        title="Comprehensive Real Estate Capital Gains Tax Guide"
        subtitle="Master the Budget 2024 property tax rules, CII indexation mechanism, and Section 54 reinvestment strategies."
        keyBenefits={[
          {
            title: 'Finance Act 2024 Grandfathering',
            description:
              'Resident taxpayers who purchased property before 23 July 2024 can compute tax under both 20% with indexation and 12.5% without indexation, legally paying whichever is lower.',
          },
          {
            title: 'Official CII Cost Indexation',
            description:
              'Adjust your acquisition and improvement costs for inflation using the official CBDT Cost Inflation Index table dating back to 2001-02 (Base: 100).',
          },
          {
            title: 'Section 54 & 54EC Optimisation',
            description:
              'Save up to 100% of your capital gains tax by reinvesting in a residential property (up to ₹10 Cr) or Section 54EC capital gains bonds (up to ₹50 Lakhs).',
          },
          {
            title: '100% Private & Client-Side',
            description:
              'All calculations run entirely in your browser. Your property purchase price, sale deed numbers, and tax figures are never saved or sent to any server.',
          },
        ]}
        faqs={[
          {
            question: 'What is the grandfathering clause introduced in Budget 2024?',
            answer:
              'In the Union Budget 2024 presented on July 23, 2024, the government initially proposed replacing the 20% LTCG with indexation with a flat 12.5% rate without indexation for all property sales. Following representations from homeowners, an official amendment was enacted in the Finance (No. 2) Act 2024: for immovable property acquired prior to July 23, 2024, resident individuals and Hindu Undivided Families (HUFs) have the legal option to calculate tax under both methods and pay the lower amount.',
          },
          {
            question: 'When is the Old Rule (20% with Indexation) better than the New Rule (12.5%)?',
            answer:
              'The Old Rule is typically better when the property was purchased many years ago (high accumulated inflation) or when price appreciation was moderate (e.g. 5% to 8% per annum). In such cases, indexation significantly inflates the purchase cost, drastically reducing taxable gains or even creating a paper loss. Conversely, if the property appreciated rapidly (e.g. 15%+ per annum), the lower flat 12.5% tax rate usually saves more money.',
          },
          {
            question: 'What is the holding period required for Long-Term Capital Gains (LTCG)?',
            answer:
              'For immovable property (land, residential flat, commercial office, villa), the statutory holding period to qualify as a long-term capital asset is more than 24 months (2 years) from the date of purchase or registration. If sold within 24 months, it is treated as Short-Term Capital Gains (STCG) and added to your income, taxable at your regular slab rate (plus 4% cess).',
          },
          {
            question: 'How does Section 54 exemption work for residential house property?',
            answer:
              'Under Section 54, if you sell a long-term residential house and reinvest the capital gains in purchasing or constructing a new residential property in India, the capital gain is exempt from tax. The new house must be purchased within 1 year before or 2 years after the date of sale, or constructed within 3 years. The Finance Act 2023 capped Section 54 exemption at ₹10 Crores.',
          },
          {
            question: 'What are Section 54EC capital gains bonds?',
            answer:
              'Section 54EC allows taxpayers to exempt long-term capital gains from real estate by investing up to ₹50 Lakhs in specified bonds issued by REC, PFC, NHAI, or IRFC. The investment must be made within 6 months of property transfer. The bonds have a lock-in period of 5 years and provide an annual taxable interest rate.',
          },
          {
            question: 'Can I claim indexation if the property was acquired on or after 23 July 2024?',
            answer:
              'No. For any immovable property acquired on or after July 23, 2024, indexation benefit is permanently abolished. If held for more than 24 months, the gain is taxed at a flat 12.5% (plus 4% cess, total 13.0%) without cost indexation.',
          },
        ]}
      />
    </div>
  );
}
