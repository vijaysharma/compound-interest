import React from 'react';
import CalculatorContentSection from '../../components/CalculatorContentSection';
import { lumpsumFaqs } from '../../data/seo/lumpsumData';
const COMPARISON_TABLE = {
  headers: ['Strategy', 'Best Market Condition', 'Risk Exposure', 'Behavioral Discipline Needed'],
  rows: [
    ['Lumpsum Investment', 'Bull Market / Undervalued Dips', 'High short-term volatility', 'High (Must endure initial drawdowns)'],
    ['Systematic Investment (SIP)', 'Volatile Sideways / Bear Markets', 'Averaged volatility (Rupee Cost Averaging)', 'Low (Automated monthly habit)'],
    ['Fixed Deposit (FD)', 'High interest rate peaks / Capital Safety', 'Zero equity risk (Inflation drag)', 'Low (Fixed guaranteed yield)'],
  ],
};
const KEY_BENEFITS = [
  { title: 'Live AMFI Verified Data', description: 'Backtest real historical NAV data for thousands of active and direct mutual fund schemes.' },
  { title: 'Simultaneous Multi-Fund Compare', description: 'Pin up to 8 mutual funds to visually compare CAGR performance and rolling returns.' },
  { title: 'Exact Days Precision', description: 'Calculate real-world annualized returns for exact start and end calendar dates.' },
];
export const LumpsumContent: React.FC = React.memo(() => (
  <CalculatorContentSection
    title="Mastering Mutual Fund Compounding & Historical NAV Analysis"
    subtitle="Lumpsum mutual fund investing deploys capital into equity, hybrid, or debt portfolios from Day 1, allowing 100% of your investment to compound over the full duration. Analyzing historical rolling returns and CAGR helps set realistic wealth expectations."
    comparisonTable={COMPARISON_TABLE}
    keyBenefits={KEY_BENEFITS}
    faqs={lumpsumFaqs}
  />
));
LumpsumContent.displayName = 'LumpsumContent';
