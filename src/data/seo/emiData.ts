export { emiSchema } from './emiSchema';
export const emiFaqs = [
  {
    question: 'How do interest rate hikes by RBI impact my floating rate home loan?',
    answer:
      'When the RBI increases the repo rate, banks typically increase the loan tenure while keeping your EMI amount constant. However, for large rate hikes, tenure can extend past retirement unless you make regular lump-sum part-payments or increase your monthly EMI.',
  },
  {
    question: 'What is the difference between Fixed Rate and Floating Rate loans?',
    answer:
      'Fixed Rate loans maintain an identical interest rate throughout the entire loan tenure, offering payment certainty. Floating Rate loans vary in tandem with benchmark interest rates (Repo Linked Lending Rate - RLLR). In India, floating-rate home loans have zero prepayment or foreclosure penalty for individual borrowers.',
  },
  {
    question: 'How much interest can I save by paying one extra EMI every year?',
    answer:
      'On a standard 20-year home loan at 9% interest, making just one additional EMI payment per calendar year can reduce your total loan tenure by approximately 4 to 5 years and save over 25% of your total interest liability.',
  },
  {
    question: 'Is there any penalty for home loan prepayments or part-payments in India?',
    answer:
      'Under Reserve Bank of India (RBI) guidelines, commercial banks and Housing Finance Companies (HFCs) cannot levy any prepayment charges or foreclosure penalties on floating-rate individual home loans.',
  },
  {
    question: 'How to calculate EMI for a home loan?',
    answer:
      'Home loan EMI is calculated using the reducing balance formula: EMI = P × r × (1+r)^n / [(1+r)^n – 1], where P is loan principal, r is monthly interest rate (annual rate ÷ 12 ÷ 100), and n is total months. For a ₹50 Lakh loan at 8.5% for 20 years: EMI = ₹43,391/month.',
  },
  {
    question: 'What is the difference between flat rate and reducing balance EMI?',
    answer:
      'Flat rate EMI charges interest on the original loan amount throughout the tenure, resulting in a higher effective interest rate. Reducing balance EMI (used by all major Indian banks for home loans) charges interest only on the outstanding principal, which decreases with each payment. A flat rate of 8% is roughly equivalent to a reducing balance rate of 14-15%.',
  },
];
export const emiComparisonTable = {
  headers: [
    'Prepayment Option',
    'Tenure Impact',
    'Monthly EMI Impact',
    'Total Interest Saved',
  ],
  rows: [
    [
      'Reduce Loan Tenure',
      'Reduces by 3-6 years',
      'Stays the same',
      'Maximum Interest Saved (Up to 40%)',
    ],
    [
      'Reduce Monthly EMI',
      'Stays at original years',
      'Decreases monthly burden',
      'Moderate Interest Saved (~15-20%)',
    ],
    [
      'Annual 1 Extra EMI',
      'Reduces 20-yr loan to ~16 yrs',
      'Stays the same',
      'Saves ₹7-10 Lakhs on ₹30L loan',
    ],
  ],
};
export const emiKeyBenefits = [
  {
    title: 'Dynamic Part-Payment Modeling',
    description:
      'Simulate the exact compounding impact of ad-hoc or scheduled prepayments on your debt schedule.',
  },
  {
    title: 'Floating Rate Adjustment',
    description:
      'Model future RBI repo rate hikes or cuts to prepare your household cashflow in advance.',
  },
  {
    title: 'Month-by-Month Transparency',
    description:
      'Track exact principal vs. interest breakdown for accurate Income Tax deduction claims under Section 80C & 24(b).',
  },
];
