export const npsSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FinancialProduct',
      name: 'NPS Calculator India (National Pension System)',
      description: 'Calculate your retirement pension corpus, mandatory 40% annuity purchase, 60% tax-free lump sum withdrawal, and monthly pension payout with PFRDA rules.',
      category: 'PensionPlan',
      provider: { '@type': 'Organization', name: 'Rupee Calculator', url: 'https://rupees.vercel.app/' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is the mandatory annuity percentage in NPS at retirement?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Under PFRDA regulations, an subscriber retiring at age 60 must utilize a minimum of 40% of the accumulated pension corpus to purchase an immediate annuity from an approved life insurance company. The remaining 60% can be withdrawn as a completely tax-free lump sum.',
          },
        },
        {
          '@type': 'Question',
          name: 'What extra tax deductions are offered by NPS over Section 80C?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Under Section 80CCD(1B), individuals can claim an exclusive tax deduction of up to ₹50,000 per financial year over and above the ₹1.5 Lakh limit under Section 80C. Furthermore, employer contributions under Section 80CCD(2) up to 10% of salary are tax-deductible in both Old and New Tax Regimes.',
          },
        },
      ],
    },
  ],
};
export const npsFaqs = [
  {
    question: 'Can I withdraw 100% of my NPS corpus at age 60 without buying an annuity?',
    answer: 'If your total accumulated pension corpus at age 60 is ₹5 Lakh or less, PFRDA permits you to withdraw 100% of the corpus as a lump sum without any mandatory annuity purchase. If the corpus exceeds ₹5 Lakh, you must utilize at least 40% to purchase a lifelong annuity.',
  },
  {
    question: 'What are the asset choices available in NPS?',
    answer: 'NPS offers two choices: (1) Active Choice — you decide the allocation across Asset Class E (Equities up to 75%), Asset Class C (Corporate Bonds), Asset Class G (Government Securities), and Asset Class A (Alternative Assets up to 5%); (2) Auto Choice — your funds are automatically allocated across LifeCycle funds (Aggressive LC-75, Moderate LC-50, or Conservative LC-25) where equity exposure automatically de-risks as your age advances.',
  },
  {
    question: 'Is the monthly annuity pension from NPS taxable?',
    answer: 'While the 60% lump sum withdrawal is 100% tax-free under Section 10(12A), the monthly pension received from the annuity provider is treated as salary/income from other sources and is taxed at your applicable income tax slab rates in the year of receipt.',
  },
];
export const npsComparisonTable = {
  headers: [
    'Feature',
    'National Pension System (NPS)',
    'Employees Provident Fund (EPF)',
    'Public Provident Fund (PPF)',
  ],
  rows: [
    ['Regulator', 'PFRDA', 'EPFO (Ministry of Labour)', 'Ministry of Finance / RBI'],
    ['Equity Exposure', 'Up to 75% in Equity (Class E)', 'Up to 15% in Equity ETFs', '0% (Pure Sovereign Debt)'],
    ['Exclusive Tax Deduction', '₹50,000 under 80CCD(1B) beyond 80C', 'Covered inside ₹1.5L 80C', 'Covered inside ₹1.5L 80C'],
    ['Employer Tax Benefit', '10% of Basic+DA under 80CCD(2)', 'Exempt up to 12% of Basic', 'Not Applicable'],
    ['Withdrawal at Age 60', '60% Tax-Free Lump Sum + 40% Annuity', '100% Tax-Free Lump Sum', '100% Tax-Free Lump Sum'],
  ],
};
