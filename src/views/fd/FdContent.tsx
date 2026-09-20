import CalculatorContentSection from '../../components/CalculatorContentSection';
import { fdFaqs } from '../../data/seo/fdData';
const comparisonTable = {
  headers: ['Feature / Parameter', 'Bank Fixed Deposit (FD)', 'Debt Mutual Funds', 'Public Provident Fund (PPF)'],
  rows: [
    ['Capital Safety', 'Very High (DICGC Insured up to ₹5L)', 'Moderate (Market-linked NAV)', 'Sovereign Guarantee (Govt of India)'],
    ['Returns Predictability', 'Guaranteed & Fixed at deposit date', 'Variable (Depends on interest cycle)', 'Govt reset quarterly (currently ~7.1%)'],
    ['Compounding Frequency', 'Quarterly (typically)', 'Daily NAV compounding', 'Annual Compounding (March 31st)'],
    ['Tax Treatment', 'Taxed at slab rate (TDS applicable)', 'Taxed at slab rate post April 2023', 'Exempt-Exempt-Exempt (EEE) - 100% Tax Free'],
    ['Liquidity / Premature Exit', 'Allowed with 0.5% - 1% penalty', 'High (Redeem in 1-2 business days)', '15-Year Lock-in (Partial exit after 7 yrs)'],
  ],
};
const keyBenefits = [
  {
    title: 'Guaranteed Capital Preservation',
    description: 'Unlike equities, your principal and committed interest rate are unaffected by stock market swings.',
  },
  {
    title: 'Flexible Interest Payouts',
    description: 'Choose Cumulative reinvestment to maximize compound growth or periodic monthly/quarterly payouts for living expenses.',
  },
  {
    title: 'Senior Citizen Bonus',
    description: 'Most Indian banks offer an additional 0.50% to 0.75% higher interest rate to citizens aged 60 and above.',
  },
];
export function FdContent() {
  return (
    <CalculatorContentSection
      title="Understanding Fixed Deposit Compounding & Maturity Mathematics"
      subtitle="A Fixed Deposit (FD) is one of India's most trusted fixed-income investment instruments, offering assured capital protection and predictable returns. Understanding how compounding intervals impact your final wealth is key to maximizing interest income."
      comparisonTable={comparisonTable}
      keyBenefits={keyBenefits}
      faqs={fdFaqs}
    />
  );
}
