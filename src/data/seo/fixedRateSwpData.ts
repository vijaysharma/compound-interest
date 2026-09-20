export { swpSchema } from './fixedRateSwpSchema';
export const swpFaqs = [
  {
    question: 'How does an inflation-indexed SWP protect retirement purchasing power?',
    answer:
      'Fixed monthly pension amounts lose half their purchasing power over 12-15 years due to inflation. An inflation-adjusted SWP gradually increases your monthly payout (e.g., by 6% annually) so your living standard remains constant throughout retirement.',
  },
  {
    question: 'What happens to the remaining balance in an SWP account?',
    answer:
      'The unwithdrawn balance stays invested in your chosen mutual fund scheme (such as Hybrid / Balanced Advantage or Equity Savings funds), continuing to earn compounding returns and offsetting the impact of withdrawals.',
  },
  {
    question: 'Which mutual fund categories are best suited for setting up an SWP?',
    answer:
      'For retirees seeking steady cashflow without extreme volatility, Balanced Advantage Funds (BAFs), Conservative Hybrid Funds, Equity Savings Funds, and Multi-Asset Allocation Funds are popular choices due to lower drawdown risk compared to pure small/mid-cap equities.',
  },
  {
    question: 'Can I change my SWP withdrawal amount or stop it at any time?',
    answer:
      'Yes. You can increase, decrease, or terminate your monthly SWP mandate at any time through your mutual fund portal or AMC without penalty.',
  },
  {
    question: 'What is SWP in mutual fund?',
    answer:
      'A Systematic Withdrawal Plan (SWP) allows you to withdraw a fixed amount from your mutual fund investment at regular intervals (monthly, quarterly, or annually) while keeping the remaining corpus invested. Unlike FD interest payouts, SWP withdrawals are a mix of capital redemption and gains, making them more tax-efficient — only the capital gains portion is taxed, not the entire withdrawal amount.',
  },
  {
    question: 'How much corpus do I need for ₹50,000 monthly pension through SWP?',
    answer:
      'Using the 4% safe withdrawal rate (SWR) rule adapted for India, you need approximately ₹1.5 Crore corpus to sustain ₹50,000/month (₹6 Lakh/year) indefinitely. However, if your mutual fund earns 9–10% annual returns and inflation averages 6%, a corpus of ₹1 Crore can sustain ₹50,000/month for approximately 25–30 years with the residual balance still growing.',
  },
];
export const swpComparisonTable = {
  headers: [
    'Parameter',
    'Mutual Fund SWP',
    'Bank FD Monthly Interest',
    'Annuity Insurance Policy',
  ],
  rows: [
    [
      'Monthly Cashflow Structure',
      'Flexible (Can be modified or stopped)',
      'Fixed interest on principal',
      'Fixed life annuity payment',
    ],
    [
      'Tax Efficiency',
      'High (Only capital gains portion taxed)',
      'Poor (Entire interest taxed at slab)',
      'Poor (Annuity income fully taxable)',
    ],
    [
      'Corpus Growth Potential',
      'High (Remaining balance compounds)',
      'Zero (Principal stays static)',
      'Zero (Principal forfeited to insurer)',
    ],
    [
      'Inflation Protection',
      'Yes (Can step up withdrawals)',
      'No (Fixed payout loses real value)',
      'No (Fixed payout)',
    ],
    [
      'Inheritance to Nominee',
      'Full residual market value',
      'Full original principal amount',
      'Depends on annuity variant',
    ],
  ],
};
export const swpKeyBenefits = [
  {
    title: 'Superior Tax Arbitrage',
    description:
      'Redemptions under SWP combine capital return and long-term gains, resulting in a much lower effective tax rate than FD interest.',
  },
  {
    title: 'Complete Liquidity Control',
    description:
      'Unlike pension annuities that permanently lock your capital, SWP allows emergency lumpsum withdrawals whenever required.',
  },
  {
    title: 'Longevity Protection',
    description:
      'When withdrawal rate is calibrated below portfolio CAGR, your capital can outlive you and pass to heirs.',
  },
];
