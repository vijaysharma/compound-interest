import CalculatorContentSection from '../../components/CalculatorContentSection';
import { liveSipFaqs } from '../../data/seo/sipData';
const comparisonTable = {
  headers: ['Parameter', 'Fixed Amount SIP', 'Step-Up / Top-Up SIP', 'Lumpsum Investment'],
  rows: [
    ['Monthly Cash Commitment', 'Constant monthly debit', 'Increases 5-15% annually', 'Single initial outflow'],
    ['Market Timing Dependency', 'Zero (Rupee cost averaged)', 'Zero (Rupee cost averaged)', 'High (Depends on entry NAV)'],
    ['Suitability for Salaried', 'High (Matches monthly income)', 'Very High (Matches salary hikes)', 'Moderate (Requires lump sum)'],
    ['15-Year Wealth Output', 'Baseline Corpus (1.0x)', 'Accelerated Corpus (~1.8x to 2.2x)', 'Market dependent'],
  ],
};
const keyBenefits = [
  {
    title: 'Exact AMFI Historical Allotment',
    description: 'Computes fractional unit allotment based on official daily NAV figures without rough estimations.',
  },
  {
    title: 'Average Buy Price Tracker',
    description: 'View your exact dollar-cost / rupee-cost averaged purchase price compared to the latest market NAV.',
  },
  {
    title: 'Interactive Multi-Fund Charting',
    description: 'Graph up to 8 mutual funds side-by-side to compare rolling volatility and momentum.',
  },
];
export function SipContent() {
  return (
    <CalculatorContentSection
      title="Understanding Historical SIP Backtesting & XIRR Yields"
      subtitle="Evaluating mutual funds based solely on past 1-year or 3-year trailing returns often produces inaccurate expectations. Historical SIP backtesting simulates real-world monthly investments through bull and bear market cycles."
      comparisonTable={comparisonTable}
      keyBenefits={keyBenefits}
      faqs={liveSipFaqs}
    />
  );
}
