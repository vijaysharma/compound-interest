export const rdSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FinancialProduct',
      name: 'Recurring Deposit (RD) Maturity Calculator India',
      description: 'Calculates Recurring Deposit (RD) maturity amount, total interest yield, and compound growth on monthly savings across commercial banks and Post Office RD schemes.',
      category: 'DepositAccount',
      provider: { '@type': 'Organization', name: 'Rupee Calculator', url: 'https://rupees.vercel.app/' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://rupees.vercel.app/' },
        { '@type': 'ListItem', position: 2, name: 'Recurring Deposit Calculator', item: 'https://rupees.vercel.app/rd-calculator' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How is interest compounded on Recurring Deposits in Indian banks?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Indian banks compound Recurring Deposit interest on a quarterly basis. Each monthly installment earns interest for the remaining quarters in the tenure, compounding at the bank agreed interest rate.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is TDS deducted on Recurring Deposit interest in India?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Under Section 194A of the Income Tax Act, TDS is deducted at 10% on cumulative RD and FD interest exceeding ₹40,000 in a financial year across a bank (₹50,000 for senior citizens).',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I withdraw from a Recurring Deposit prematurely?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, banks allow premature closure of RDs with a nominal penalty (usually 0.5% to 1.0% deduction from the applicable interest rate for the actual period held).',
          },
        },
        {
          '@type': 'Question',
          name: 'How to calculate recurring deposit maturity amount?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "RD maturity is calculated using quarterly compounding: each monthly installment compounds at the bank's quarterly rate until the end of the tenure.",
          },
        },
        {
          '@type': 'Question',
          name: 'RD vs SIP: Which is better for monthly savings?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'For short-term goals (1–3 years), bank RDs offer guaranteed returns and capital protection. For long-term wealth creation (5+ years), mutual fund SIPs historically deliver significantly higher returns.',
          },
        },
      ],
    },
    {
      '@type': 'WebApplication',
      name: 'RD Calculator — Rupee Calculator',
      url: 'https://rupees.vercel.app/rd-calculator',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'All',
      browserRequirements: 'Requires JavaScript',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
    },
  ],
};
export const rdFaqs = [
  {
    question: 'How is an RD different from a Fixed Deposit (FD)?',
    answer: 'In a Fixed Deposit, you deposit a single lump-sum amount at inception. In a Recurring Deposit, you deposit a fixed monthly installment every month over a chosen tenure, making RD ideal for salaried individuals saving from monthly income.',
  },
  {
    question: 'What is the Post Office Recurring Deposit scheme interest rate and tenure?',
    answer: 'The Post Office 5-Year National Savings Recurring Deposit Account (RD) offers sovereign-backed guaranteed quarterly compounding returns (historically ~6.7% p.a.) with a mandatory 5-year tenure and options for loan advances against the deposit.',
  },
  {
    question: 'Is Recurring Deposit interest taxable under the New Tax Regime?',
    answer: 'Yes. RD interest is fully taxable under both Old and New Tax Regimes as "Income from Other Sources" according to your marginal income tax slab.',
  },
  {
    question: 'Should I choose an RD or a Mutual Fund SIP for a 3-year goal?',
    answer: 'For short-term non-negotiable goals under 3 years (e.g., vacation, wedding down payment, emergency fund), an RD or Debt Fund provides zero market volatility. For goals 5+ years away, an Equity SIP offers higher inflation-beating potential.',
  },
  {
    question: 'How to calculate recurring deposit maturity amount?',
    answer: "RD maturity is calculated using quarterly compounding: each monthly installment compounds at the bank's quarterly rate until the end of the tenure.",
  },
  {
    question: 'RD vs SIP: Which is better for monthly savings?',
    answer: 'For short-term goals (1–3 years), bank RDs offer guaranteed returns and capital protection. For long-term wealth creation (5+ years), mutual fund SIPs historically deliver significantly higher returns due to equity market compounding.',
  },
];
