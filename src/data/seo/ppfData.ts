export const ppfSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FinancialProduct',
      name: 'PPF Calculator India (Public Provident Fund)',
      description: 'Official PPF Calculator with real historical interest rates declared by the Ministry of Finance, 5th-of-the-month interest rule, 5-year extension blocks, and full tax-exempt EEE status.',
      category: 'GovernmentSavingsAccount',
      provider: { '@type': 'Organization', name: 'Rupee Calculator', url: 'https://rupees.vercel.app/' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is the 5th of the month rule for PPF deposit?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Under RBI and Post Office PPF rules, interest is calculated on the lowest balance in your PPF account between the close of the 5th day and the end of each calendar month. Therefore, if you deposit by the 5th, your deposit earns interest for that whole month; deposits made after the 5th earn interest only from the next month.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do PPF extensions work after 15 years?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'PPF accounts mature after 15 full financial years. You can extend your account in blocks of 5 years indefinitely. Extensions can be chosen with ongoing contributions (submit Form H within 1 year of maturity) or without contributions (the balance continues earning prevailing PPF interest).',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the tax treatment of PPF in India?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'PPF falls under the Exempt-Exempt-Exempt (EEE) tax regime. Deposits qualify for tax deductions up to ₹1.5 Lakh under Section 80C (Old Regime), the annual interest credited is 100% tax-free under Section 10(11), and the final maturity corpus is completely exempt from income tax in India.',
          },
        },
      ],
    },
  ],
};
export const ppfFaqs = [
  {
    question: 'Why should I deposit in PPF on or before the 5th of every month?',
    answer: 'According to Post Office and RBI rules, interest for any calendar month is calculated on the lowest balance available in the account between the close of the 5th day and the end of the month. If you deposit funds on the 6th or later, that installment will earn zero interest for the current month and will only begin earning interest from the 1st of the following month.',
  },
  {
    question: 'How do 5-year extensions work after completing 15 years?',
    answer: 'After the initial 15-year maturity, you can extend your PPF account indefinitely in blocks of 5 years. There are two modes: (1) Extension with contribution — submit Form H within 1 year of maturity to keep making deposits and claiming Section 80C deductions; (2) Extension without contribution — if no form is submitted, the account automatically continues earning prevailing PPF interest on the existing balance, and you can withdraw any amount once per financial year.',
  },
  {
    question: 'Can I deposit more than ₹1,50,000 in a financial year?',
    answer: 'No. The maximum statutory limit is ₹1.5 Lakh per financial year across all PPF accounts held by an individual (including accounts opened on behalf of minor children). Any amount deposited in excess of ₹1.5 Lakh neither earns interest nor qualifies for Section 80C tax deductions.',
  },
  {
    question: 'When is PPF interest credited to the account?',
    answer: 'PPF interest is calculated monthly based on the 5th-of-the-month rule, but it is officially credited and compounded into the principal once a year on March 31st (the close of the financial year).',
  },
];
export const ppfComparisonTable = {
  headers: [
    'Feature',
    'Public Provident Fund (PPF)',
    'Bank Fixed Deposit (FD)',
    'Equity Linked Savings Scheme (ELSS)',
  ],
  rows: [
    ['Sovereign Guarantee', '100% Government of India Backed', 'DICGC Insurance up to ₹5 Lakh', 'Market Linked (No Guarantee)'],
    ['Tax Status', 'EEE (100% Tax Free)', 'Interest Taxed at Slab Rate', 'LTCG 12.5% above ₹1.25 Lakh'],
    ['Lock-in Period', '15 Years (Extendable in 5-Yr Blocks)', '7 Days to 10 Years', '3 Years (Shortest 80C)'],
    ['Annual Deposit Limits', 'Min ₹500, Max ₹1,50,000 per FY', 'No Upper Limit', 'No Upper Limit'],
    ['Loan Facility', 'Available from 3rd to 6th Financial Year', 'Overdraft against FD up to 90%', 'Not Applicable'],
  ],
};
