import CalculatorContentSection from '../../components/CalculatorContentSection';
import { rdFaqs } from '../../data/seo/rdData';
const comparisonTable = {
  headers: ['Parameter', 'Bank Recurring Deposit (RD)', 'Post Office 5-Year RD', 'Mutual Fund Equity SIP'],
  rows: [
    ['Minimum Deposit', '₹500 / month (varies by bank)', '₹100 / month', '₹500 / month'],
    ['Returns Structure', 'Guaranteed & Fixed', 'Sovereign Guarantee (Govt)', 'Market Linked (~12-15% CAGR)'],
    ['Compounding Frequency', 'Quarterly Compounding', 'Quarterly Compounding', 'Daily NAV Compounding'],
    ['Tenure Flexibility', '6 months to 10 years', 'Fixed 5-year tenure', 'Open-ended / Any duration'],
    ['Risk Profile', 'Very Low (DICGC insured)', 'Zero Risk (Govt of India)', 'Moderate to High Equity Risk'],
  ],
};
const keyBenefits = [
  {
    title: 'Disciplined Monthly Habits',
    description: 'Automate deductions from your salary account to build a predictable savings cushion.',
  },
  {
    title: 'Guaranteed Interest Lock-in',
    description: 'Your agreed interest rate remains immune to future RBI repo rate cuts throughout the tenure.',
  },
  {
    title: 'Loan Against RD Facility',
    description: 'Borrow up to 90% of your accumulated RD balance at low interest rates in emergencies.',
  },
];
export function RdContent() {
  return (
    <CalculatorContentSection
      title="How Recurring Deposit Compounding Works in India"
      subtitle="A Recurring Deposit (RD) is a guaranteed investment instrument tailored for individuals with regular monthly earnings. By depositing a fixed sum each month, each installment compounds quarterly until maturity."
      comparisonTable={comparisonTable}
      keyBenefits={keyBenefits}
      faqs={rdFaqs}
    />
  );
}
