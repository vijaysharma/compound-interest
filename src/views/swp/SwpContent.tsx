import CalculatorContentSection from '../../components/CalculatorContentSection';
import { liveSwpFaqs } from '../../data/seo/swpData';
const comparisonTable = {
  headers: ['Feature', 'Historical SWP Backtest', 'Static Calculator', 'Insurance Annuity'],
  rows: [
    ['Market Volatility Impact', 'True daily NAV swings captured', 'Assumes smooth constant CAGR', 'Zero market link (Fixed rate)'],
    ['Sequence of Returns Risk', 'Fully backtested through crises', 'Ignored / Overlooked', 'Not applicable'],
    ['Real Inflation Test', 'Tests Step-Up vs. Real NAVs', 'Rough mathematical guess', 'Loses value to inflation'],
  ],
};
const keyBenefits = [
  {
    title: 'Exact AMFI Historical Pricing',
    description: 'Simulate the exact day-by-day unit redemption dynamics during real Indian market bull and bear cycles.',
  },
  {
    title: 'Capital Longevity Stress Testing',
    description: 'Determine whether a 4%, 5%, or 6% initial withdrawal rate survives major market corrections.',
  },
  {
    title: 'Tax-Efficient Drawdown Insights',
    description: 'Evaluate remaining capital gains vs. principal return under Indian LTCG rules.',
  },
];
export function SwpContent() {
  return (
    <CalculatorContentSection
      title="Testing Real-World Retirement Resilience with SWP Backtests"
      subtitle="Simulating Systematic Withdrawal Plans against real historical mutual fund data exposes your retirement portfolio to actual historical market drawdowns, inflation cycles, and recovery periods."
      comparisonTable={comparisonTable}
      keyBenefits={keyBenefits}
      faqs={liveSwpFaqs}
    />
  );
}
