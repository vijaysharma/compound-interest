export { sipSchema } from './fixedRateSipSchema';
export const sipFaqs = [
  {
    question: 'Why is Rupee Cost Averaging the biggest advantage of a SIP?',
    answer:
      'Rupee Cost Averaging automatically allocates more mutual fund units when markets dip (low NAV) and fewer units when markets rise (high NAV). Over time, this smooths out market volatility and lowers your average purchase cost per unit without requiring you to time the market.',
  },
  {
    question: 'What is the ideal expected return (CAGR) for an Equity SIP in India?',
    answer:
      'Historically, diversified Indian equity mutual funds (Flexi Cap, Large & Mid Cap, Nifty 50 Index) have delivered annualized long-term returns between 12% to 15% CAGR over 10+ year rolling horizons. For conservative planning, 11% to 12% CAGR is recommended.',
  },
  {
    question: 'Can I pause, increase, or stop my SIP at any time without penalty?',
    answer:
      'Yes. Mutual fund SIPs are completely flexible. You can modify your monthly amount, pause deductions for a few months, or cancel the SIP at any time without any financial penalty or forfeiture of accumulated capital.',
  },
  {
    question: 'How does SIP compare against recurring deposits (RD) for 10+ year goals?',
    answer:
      'Recurring Deposits offer fixed pre-tax interest (~6.5%-7.5%) that is taxed at your income tax slab, resulting in post-tax returns that frequently lag inflation. Equity SIPs offer potential inflation-beating real returns (12-15% CAGR) with favorable capital gains tax treatment.',
  },
  {
    question: 'What is SIP and how does it work?',
    answer:
      'A Systematic Investment Plan (SIP) is a method of investing a fixed amount regularly (monthly or weekly) in mutual funds. Each SIP installment buys units at the prevailing NAV, enabling rupee cost averaging — you automatically buy more units when markets are low and fewer when markets are high, reducing the average cost per unit over time.',
  },
  {
    question: 'SIP vs Lump Sum: Which is better for mutual fund investment?',
    answer:
      'SIP is better for salaried investors who want disciplined, regular investing with reduced market timing risk through rupee cost averaging. Lump sum is better when you have a large corpus available and markets are at reasonable valuations. Historical data shows that over 10+ year periods, lump sum investments slightly outperform SIP in rising markets, but SIP provides better risk-adjusted returns during volatile periods.',
  },
];
export const sipComparisonTable = {
  headers: [
    'Metric',
    'Flat Monthly SIP',
    '10% Annual Step-Up SIP',
    'Bank Recurring Deposit (RD)',
  ],
  rows: [
    [
      'Monthly Start Amount',
      '₹10,000 / month',
      '₹10,000 / month (+10% yearly)',
      '₹10,000 / month',
    ],
    ['Total Invested (15 Yrs)', '₹18,00,000', '₹38,12,700', '₹18,00,000'],
    ['Expected Returns (CAGR)', '12% p.a.', '12% p.a.', '7.0% p.a.'],
    ['Final Maturity Value', '₹50,45,760', '₹89,28,400', '₹31,88,000'],
    [
      'Tax Efficiency',
      '12.5% LTCG (above ₹1.25L/yr)',
      '12.5% LTCG (above ₹1.25L/yr)',
      'Taxed at standard slab rate',
    ],
  ],
};
export const sipKeyBenefits = [
  {
    title: 'Rupee Cost Averaging',
    description:
      'Eliminate emotional market timing by purchasing more fund units during market corrections.',
  },
  {
    title: 'Exponential Compounding',
    description:
      'In the later years of a 15-20 year SIP, annual gains often surpass your entire accumulated principal investment.',
  },
  {
    title: 'Inflation-Beating Growth',
    description:
      'Equity mutual funds historically generate 5-8% alpha over India CPI inflation.',
  },
];
