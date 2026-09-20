export const emiSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FinancialProduct',
      name: 'Home & Personal Loan EMI Amortization Calculator India',
      description:
        'Calculates equated monthly installments (EMI), complete loan repayment schedules, and interest savings from part payments and floating interest rate adjustments.',
      category: 'LoanOrCredit',
      provider: {
        '@type': 'Organization',
        name: 'Rupee Calculator',
        url: 'https://rupees.vercel.app/',
      },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://rupees.vercel.app/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'EMI Calculator',
          item: 'https://rupees.vercel.app/emi-calculator',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is the mathematical formula for calculating loan EMI?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Loan EMI is calculated using the formula: E = P × r × (1 + r)^n / [((1 + r)^n) - 1], where P is the loan principal, r is the monthly interest rate (annual interest rate / 12 / 100), and n is the total loan tenure in months.',
          },
        },
        {
          '@type': 'Question',
          name: 'When making a loan part-payment, should I choose to reduce EMI or reduce tenure?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Choosing to "Reduce Tenure" saves significantly more total interest over the life of the loan than reducing EMI. Reducing tenure accelerates principal reduction, preventing compound interest accumulation across future years.',
          },
        },
        {
          '@type': 'Question',
          name: 'What income tax deductions are available on Home Loans in India?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Home loan borrowers in India can claim tax deductions up to ₹1.5 Lakh on principal repayment under Section 80C and up to ₹2.0 Lakh on interest paid for a self-occupied property under Section 24(b) of the Income Tax Act (Old Tax Regime).',
          },
        },
        {
          '@type': 'Question',
          name: 'How to calculate EMI for a home loan?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Home loan EMI is calculated using the reducing balance formula: EMI = P × r × (1+r)^n / [(1+r)^n – 1], where P is loan principal, r is monthly interest rate (annual rate ÷ 12 ÷ 100), and n is total months. For a ₹50 Lakh loan at 8.5% for 20 years: EMI = ₹43,391/month.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the difference between flat rate and reducing balance EMI?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Flat rate EMI charges interest on the original loan amount throughout the tenure, resulting in a higher effective interest rate. Reducing balance EMI (used by all major Indian banks for home loans) charges interest only on the outstanding principal, which decreases with each payment. A flat rate of 8% is roughly equivalent to a reducing balance rate of 14-15%.',
          },
        },
      ],
    },
    {
      '@type': 'WebApplication',
      name: 'EMI Calculator — Rupee Calculator',
      url: 'https://rupees.vercel.app/emi-calculator',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'All',
      browserRequirements: 'Requires JavaScript',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
      },
    },
  ],
};
