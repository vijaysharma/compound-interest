'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiAward, FiCheckCircle, FiInfo } from 'react-icons/fi';
import { getTodayISO } from '../utilities/dateGuards';
import { sanctnum } from '../utilities/numSanitity';
import {
  calculatePropertyCapitalGains,
  CII_YEARS,
  getFinancialYear,
  type PropertyTaxInputs,
} from '../data/propertyTaxData';
import SEOHead from '../components/SEOHead';
import DisplayCard from '../components/DisplayCard';
import ValuePicker from '../components/ValuePicker';
import CalculatorContentSection from '../components/CalculatorContentSection';
import calcStyles from './CalculatorPage.module.scss';
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
const PROPERTY_STEP_AMOUNT = [
  { id: 'ps1', value: '10000000', title: '1Cr' },
  { id: 'ps2', value: '5000000', title: '50L' },
  { id: 'ps3', value: '1000000', title: '10L' },
  { id: 'ps4', value: '500000', title: '5L' },
  { id: 'ps5', value: '100000', title: '1L' },
  { id: 'ps6', value: '10000', title: '10K' },
];
const EXPENSE_STEP_AMOUNT = [
  { id: 'ex1', value: '500000', title: '5L' },
  { id: 'ex2', value: '100000', title: '1L' },
  { id: 'ex3', value: '50000', title: '50K' },
  { id: 'ex4', value: '10000', title: '10K' },
  { id: 'ex5', value: '1000', title: '1K' },
];
const STCG_SLAB_STEPS = [
  { id: 's5', value: '5', title: '5%' },
  { id: 's10', value: '10', title: '10%' },
  { id: 's15', value: '15', title: '15%' },
  { id: 's20', value: '20', title: '20%' },
  { id: 's30', value: '30', title: '30%' },
];
const PROPERTY_TAX_STORAGE_KEY = 'property_tax_calculator_state';
export default function PropertyTaxCalculatorView() {
  const [purchaseDate, setPurchaseDate] = useState<string>('2016-06-15');
  const [purchasePrice, setPurchasePrice] = useState<string>('4500000');
  const [saleDate, setSaleDate] = useState<string>('2025-02-15');
  const [salePrice, setSalePrice] = useState<string>('12000000');
  const [transferExpenses, setTransferExpenses] = useState<string>('150000');
  const [improvementCost, setImprovementCost] = useState<string>('0');
  const [improvementYear, setImprovementYear] = useState<string>('2019-20');
  const [sec54Exemption, setSec54Exemption] = useState<string>('0');
  const [sec54ecExemption, setSec54ecExemption] = useState<string>('0');
  const [stcgSlabRate, setStcgSlabRate] = useState<number>(30);
  const isLoadedRef = useRef(false);
  useEffect(() => {
    const handleRestore = () => {
      try {
        const saved = window.localStorage.getItem(PROPERTY_TAX_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.purchaseDate) setPurchaseDate(parsed.purchaseDate);
          if (parsed.purchasePrice) setPurchasePrice(parsed.purchasePrice);
          if (parsed.saleDate) setSaleDate(parsed.saleDate);
          if (parsed.salePrice) setSalePrice(parsed.salePrice);
          if (parsed.transferExpenses) setTransferExpenses(parsed.transferExpenses);
          if (parsed.improvementCost) setImprovementCost(parsed.improvementCost);
          if (parsed.improvementYear) setImprovementYear(parsed.improvementYear);
          if (parsed.sec54Exemption) setSec54Exemption(parsed.sec54Exemption);
          if (parsed.sec54ecExemption) setSec54ecExemption(parsed.sec54ecExemption);
          if (parsed.stcgSlabRate) setStcgSlabRate(Number(parsed.stcgSlabRate));
        }
      } catch (err) {
        console.warn('Failed to restore property tax state:', err);
      } finally {
        isLoadedRef.current = true;
      }
    };
    const id = requestAnimationFrame(handleRestore);
    return () => cancelAnimationFrame(id);
  }, []);
  useEffect(() => {
    if (!isLoadedRef.current || typeof window === 'undefined') {
      return;
    }
    const state = {
      purchaseDate,
      purchasePrice,
      saleDate,
      salePrice,
      transferExpenses,
      improvementCost,
      improvementYear,
      sec54Exemption,
      sec54ecExemption,
      stcgSlabRate,
    };
    try {
      window.localStorage.setItem(PROPERTY_TAX_STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('Failed to persist property tax state:', err);
    }
  }, [
    purchaseDate,
    purchasePrice,
    saleDate,
    salePrice,
    transferExpenses,
    improvementCost,
    improvementYear,
    sec54Exemption,
    sec54ecExemption,
    stcgSlabRate,
  ]);
  const handlePurchaseDateChange = (val: string) => {
    setPurchaseDate(val);
    if (saleDate && val > saleDate) {
      setSaleDate(val);
    }
  };
  const handleSaleDateChange = (val: string) => {
    const today = getTodayISO();
    const safeVal = val > today ? today : val;
    setSaleDate(safeVal);
    if (purchaseDate && purchaseDate > safeVal) {
      setPurchaseDate(safeVal);
    }
  };
  const comparison = useMemo(() => {
    const inputs: PropertyTaxInputs = {
      purchaseDate,
      purchasePrice: parseFloat(purchasePrice) || 0,
      saleDate,
      salePrice: parseFloat(salePrice) || 0,
      improvementCost: parseFloat(improvementCost) || 0,
      improvementYear,
      transferExpenses: parseFloat(transferExpenses) || 0,
      sec54Exemption: parseFloat(sec54Exemption) || 0,
      sec54ecExemption: parseFloat(sec54ecExemption) || 0,
      stcgSlabRate,
    };
    return calculatePropertyCapitalGains(inputs);
  }, [
    purchaseDate,
    purchasePrice,
    saleDate,
    salePrice,
    improvementCost,
    improvementYear,
    transferExpenses,
    sec54Exemption,
    sec54ecExemption,
    stcgSlabRate,
  ]);
  const recommendedTax = useMemo(() => {
    if (!comparison.isLongTerm) return comparison.stcg.totalTax;
    return comparison.recommendedOption === 'old'
      ? comparison.oldRegime.totalTax
      : comparison.newRegime.totalTax;
  }, [comparison]);
  const currencySymbol = '₹';
  return (
    <main className={calcStyles.container}>
      <SEOHead
        title="Property Capital Gains Tax Calculator India 2026 — 20% vs 12.5% Old vs New Rule"
        description="Calculate real estate long-term capital gains tax under Finance Act 2024. Compare 20% with Cost Inflation Index (CII) indexation against 12.5% flat tax with Section 54 & 54EC exemptions."
        keywords="property capital gains tax calculator, real estate capital gains tax India, old vs new LTCG property, indexation calculator real estate, section 54 exemption calculator, section 54EC bonds calculator, budget 2024 property tax amendment"
        canonicalPath="/property-tax-calculator"
        schema={PROPERTY_TAX_SCHEMA}
      />
      <header className={calcStyles.header}>
        <div className={calcStyles.badge}>Finance Act 2024 Grandfathering Clause</div>
        <h1 className={calcStyles.title}>Property Capital Gains Tax Calculator</h1>
        <p className={calcStyles.subtitle}>
          Compare real estate capital gains tax under the{' '}
          <strong>Old Rule (20% with CII Indexation)</strong> versus{' '}
          <strong>New Rule (12.5% flat without Indexation)</strong>. Find out which regime saves you
          more tax under the latest Budget 2024 amendments.
        </p>
      </header>
      <div className={calcStyles.calculatorGrid}>
        <div className={calcStyles.inputsCol}>
          <div className={calcStyles.formStack}>
            <ValuePicker
              variant="date-range"
              className={calcStyles.field}
              startBadgeText={`Purchase (FY ${getFinancialYear(purchaseDate)})`}
              endBadgeText={`Sale (FY ${getFinancialYear(saleDate)})`}
              startDate={purchaseDate}
              setStartDate={handlePurchaseDateChange}
              endDate={saleDate}
              setEndDate={handleSaleDateChange}
              title="Property Holding Period"
            />
            <ValuePicker
              className={calcStyles.field}
              value={purchasePrice}
              onChange={setPurchasePrice}
              title="Purchase Price (Cost of Acquisition)"
              titleStyle="merged"
              stepData={PROPERTY_STEP_AMOUNT}
              singleRow={true}
            />
            <ValuePicker
              className={calcStyles.field}
              value={salePrice}
              onChange={setSalePrice}
              title="Total Sale Value (Full Consideration)"
              titleStyle="merged"
              stepData={PROPERTY_STEP_AMOUNT}
              singleRow={true}
            />
            <ValuePicker
              className={calcStyles.field}
              value={transferExpenses}
              onChange={setTransferExpenses}
              title="Transfer Expenses (Brokerage, Legal, Stamp Charges)"
              titleStyle="merged"
              stepData={EXPENSE_STEP_AMOUNT}
              singleRow={true}
            />
            <ValuePicker
              className={calcStyles.field}
              value={improvementCost}
              onChange={setImprovementCost}
              title="Renovation / Improvement Cost"
              titleStyle="merged"
              stepData={EXPENSE_STEP_AMOUNT}
              endAdornment={
                <select
                  className={calcStyles.tenureFormatSelect}
                  value={improvementYear}
                  onChange={(e) => setImprovementYear(e.target.value)}
                  aria-label="Financial Year of Renovation"
                >
                  {CII_YEARS.map((fy) => (
                    <option key={fy} value={fy}>
                      FY {fy}
                    </option>
                  ))}
                </select>
              }
              singleRow={true}
            />
            <ValuePicker
              className={calcStyles.field}
              value={sec54Exemption}
              onChange={setSec54Exemption}
              title="Section 54 (New House Property, Max ₹10 Cr)"
              titleStyle="merged"
              stepData={PROPERTY_STEP_AMOUNT}
              singleRow={true}
            />
            <ValuePicker
              className={calcStyles.field}
              value={sec54ecExemption}
              onChange={setSec54ecExemption}
              title="Section 54EC (Capital Gains Bonds, Max ₹50 L)"
              titleStyle="merged"
              stepData={EXPENSE_STEP_AMOUNT}
              singleRow={true}
            />
            {!comparison.isLongTerm && (
              <ValuePicker
                className={calcStyles.field}
                value={stcgSlabRate}
                symbol="%"
                symbolBg={false}
                symbolPosition="right"
                onChange={(v) => setStcgSlabRate(sanctnum(v) || 30)}
                title="Your Income Tax Slab (STCG)"
                titleStyle="merged"
                stepData={STCG_SLAB_STEPS}
                showWords={false}
                singleRow={true}
              />
            )}
          </div>
        </div>
        <div className={calcStyles.resultsCol}>
          <DisplayCard
            primaryAmount={recommendedTax}
            title={
              !comparison.isLongTerm
                ? 'STCG Tax Payable'
                : comparison.recommendedOption === 'old'
                  ? 'Tax Payable (Old Rule with Indexation)'
                  : 'Tax Payable (New Rule 12.5% Flat)'
            }
          />
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
              CII: {comparison.purchaseFY} (<strong>{comparison.purchaseCII}</strong>) &rarr;{' '}
              {comparison.saleFY} (<strong>{comparison.saleCII}</strong>)
            </div>
          </div>
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
          <div className={styles.comparisonGrid}>
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
                        Old: Indexed ({comparison.purchaseCII} &rarr; {comparison.saleCII})
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
                {(parseFloat(improvementCost) || 0) > 0 && (
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
                {((parseFloat(sec54Exemption) || 0) > 0 ||
                  (parseFloat(sec54ecExemption) || 0) > 0) && (
                  <tr>
                    <td>Less: Section 54 &amp; 54EC Exemptions</td>
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
                  <td>Add: 4% Health &amp; Education Cess</td>
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
          <div className={styles.disclaimerBanner}>
            <FiInfo style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />
            <strong>Tax Compliance Note:</strong> As per the Finance (No. 2) Act 2024, the option to
            choose between 20% with indexation and 12.5% without indexation is exclusively available
            to resident individuals and HUFs for immovable property purchased before July 23, 2024.
            Capital losses cannot be claimed under the Old Rule if the New Rule results in a gain.
          </div>
        </div>
      </div>
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
            question:
              'When is the Old Rule (20% with Indexation) better than the New Rule (12.5%)?',
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
            question:
              'Can I claim indexation if the property was acquired on or after 23 July 2024?',
            answer:
              'No. For any immovable property acquired on or after July 23, 2024, indexation benefit is permanently abolished. If held for more than 24 months, the gain is taxed at a flat 12.5% (plus 4% cess, total 13.0%) without cost indexation.',
          },
        ]}
      />
    </main>
  );
}
