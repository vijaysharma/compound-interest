export const inflationFaqs = [
  {
    question: 'How is historical Consumer Price Index (CPI) inflation measured in India?',
    answer:
      'In India, the Consumer Price Index (CPI) published by the Ministry of Statistics and Programme Implementation (MoSPI) tracks price changes across a weighted basket of goods and services including food, fuel, housing, education, and healthcare.',
  },
  {
    question: 'What is the difference between Nominal Return and Real Return?',
    answer:
      'Nominal Return is the stated percentage gain on an investment (e.g., 7% in a Fixed Deposit). Real Return adjusts this for inflation and taxes using the Fisher equation: Real Return ≈ Nominal Return - Inflation Rate - Tax Rate.',
  },
  {
    question: 'Why does lifestyle and healthcare inflation exceed general CPI in India?',
    answer:
      'While general headline CPI inflation averages 5-6% in India, specialized sectors like medical healthcare and private school/college education often experience inflation rates between 10% and 14% annually.',
  },
  {
    question: 'How should I account for inflation when planning retirement?',
    answer:
      'When calculating your target retirement corpus, always project your current annual living expenses to your retirement age using an expected inflation rate of 6-7%, and ensure your post-retirement withdrawal plan assumes continued annual cost escalation.',
  },
  {
    question: 'How does inflation affect savings and fixed deposits?',
    answer:
      "If your savings account earns 3.5% and inflation is 6%, your real (inflation-adjusted) return is −2.5% per year. Over 10 years, ₹10 Lakh in a savings account grows nominally to ~₹14.1 Lakh, but its purchasing power drops to only ~₹7.9 Lakh in today's terms. Even FDs at 7% barely break even after 30% tax (effective 4.9%) against 6% inflation. Equity investments averaging 12–15% are the primary inflation-beating asset class for Indian investors.",
  },
];
export const inflationComparisonTable = {
  headers: [
    'Asset Class',
    'Historical Nominal Return',
    'Inflation Hedging Ability',
    'Real Post-Tax Return',
  ],
  rows: [
    [
      'Equity Mutual Funds',
      '12% - 15% CAGR',
      'Very High (Companies adjust prices)',
      '+5% to +8% Positive Alpha',
    ],
    [
      'Physical Gold / SGBs',
      '9% - 11% CAGR',
      'High (Classic monetary hedge)',
      '+3% to +4% Positive Alpha',
    ],
    [
      'Real Estate (Tier 1/2)',
      '8% - 11% CAGR',
      'Moderate to High',
      '+1% to +3% Positive Alpha',
    ],
    [
      'Bank Fixed Deposits',
      '6.5% - 7.5% p.a.',
      'Low (Negative after 30% tax)',
      '-1% to 0% Real Drag',
    ],
    [
      'Savings Account / Cash',
      '2.5% - 3.5% p.a.',
      'None (Severe purchasing loss)',
      '-3% to -4% Real Destruction',
    ],
  ],
};
export const inflationKeyBenefits = [
  {
    title: 'Verified Historical Datasets',
    description:
      'Calculated using official World Bank and IMF economic indicators spanning 30+ rolling years.',
  },
  {
    title: 'Multi-Region Comparison',
    description:
      'Compare historical inflation between India, USA, European Union, and Global aggregates.',
  },
  {
    title: 'Realistic Retirement Targeting',
    description:
      'Calibrate your long-term financial independence targets against real inflation.',
  },
];
