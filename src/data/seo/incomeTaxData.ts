export const taxSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FinancialProduct',
      name: 'Income Tax Calculator India — Old vs New Tax Regime',
      description:
        'Dual-regime income tax calculator comparing Old vs New Tax Regime with latest slab updates, Section 87A rebate, capital gains rules, deductions, and Tax Strategy Optimizer.',
      category: 'TaxCalculator',
      provider: {
        '@type': 'Organization',
        name: 'Rupee Calculator',
        url: 'https://rupees.vercel.app/',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is the zero-tax limit under the New Tax Regime for salaried employees?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Under the New Tax Regime, salaried individuals enjoy an enhanced Standard Deduction of ₹75,000 and Section 87A rebate up to ₹25,000 on taxable income up to ₹7,00,000. Effectively, salaried individuals with a gross income of up to ₹7,75,000 pay zero income tax.',
          },
        },
        {
          '@type': 'Question',
          name: 'How is income from PPF taxed in India?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Interest earned on Public Provident Fund (PPF) is 100% tax-free under Section 10(11) of the Income Tax Act under both the Old and New Tax Regimes (EEE status).',
          },
        },
      ],
    },
  ],
};
export const taxComparisonTable = {
  headers: ['Feature', 'New Tax Regime (FY 2024-25 / 2025-26)', 'Old Tax Regime'],
  rows: [
    ['Standard Deduction', '₹75,000 (Salaried & Pensioners)', '₹50,000'],
    [
      'Zero Tax Income (Salaried)',
      'Up to ₹7,75,000 (with Sec 87A rebate)',
      'Up to ₹5,50,000 (with Sec 87A rebate)',
    ],
    ['Section 80C Deductions', 'Not Allowed', 'Allowed up to ₹1,50,000 (PPF, ELSS, EPF)'],
    ['NPS Tier-1 Self (80CCD 1B)', 'Not Allowed', 'Allowed up to ₹50,000'],
    [
      'Employer NPS (80CCD 2)',
      'Allowed up to 10% of Basic+DA',
      'Allowed up to 10% of Basic+DA',
    ],
    ['HRA Exemption (10(13A))', 'Not Allowed', 'Allowed with rent receipts'],
    ['Home Loan Interest (24b)', 'Not Allowed on self-occupied', 'Allowed up to ₹2,00,000'],
    [
      'PPF Interest Exemption',
      '100% Tax-Exempt (Sec 10(11))',
      '100% Tax-Exempt (Sec 10(11))',
    ],
  ],
};
export const taxFaqs = [
  {
    question: 'How does the Section 87A rebate work in the New Tax Regime?',
    answer:
      'In the New Tax Regime, if your total taxable income (after standard deduction) is ₹7,00,000 or less, you receive a full rebate of up to ₹25,000 under Section 87A, making your tax payable zero. For salaried individuals, adding the ₹75,000 standard deduction means gross salaries up to ₹7,75,000 pay zero income tax.',
  },
  {
    question: 'Can I switch between the Old and New Tax Regimes every year?',
    answer:
      'Salaried individuals with no business or professional income can freely choose between the Old and New Tax Regimes each financial year at the time of filing their ITR. However, individuals with business or professional income (including freelance income under Section 44AD/44ADA) can only switch back to the Old Regime once in their lifetime.',
  },
  {
    question: 'How are Equity Mutual Funds taxed after the July 2024 Budget?',
    answer:
      'Under the updated Budget 2024 rules: Short-Term Capital Gains (STCG on equity held under 12 months) are taxed at 20% under Section 111A. Long-Term Capital Gains (LTCG on equity held over 12 months) are tax-free up to ₹1,25,000 per financial year; gains exceeding ₹1.25 Lakh are taxed at 12.5% without indexation under Section 112A.',
  },
];
