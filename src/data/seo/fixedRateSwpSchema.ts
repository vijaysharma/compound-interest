export const swpSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FinancialProduct',
      name: 'Systematic Withdrawal Plan (SWP) Calculator India',
      description:
        'Calculates monthly pension cashflows, inflation-adjusted systematic withdrawals, and remaining portfolio longevity from mutual fund investments.',
      category: 'InvestmentAccount',
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
          name: 'SWP Calculator',
          item: 'https://rupees.vercel.app/swp-calculator',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is a Systematic Withdrawal Plan (SWP) in mutual funds?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A Systematic Withdrawal Plan (SWP) allows investors to withdraw a predetermined sum of money from their mutual fund scheme at regular intervals (monthly or quarterly), while the remaining balance continues to generate market-linked returns.',
          },
        },
        {
          '@type': 'Question',
          name: 'Why is SWP more tax-efficient than Fixed Deposit monthly interest payout?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'In an FD, the entire monthly interest payout is taxed at your income tax slab rate. In an SWP, each withdrawal is treated as a redemption of units composed of both principal (tax-free capital) and capital gains. Only the capital gains portion is subject to LTCG/STCG tax, resulting in drastically lower annual tax liability.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is a Safe Withdrawal Rate (SWR) for retirement in India?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Due to higher historical CPI inflation in India (5-7%), a Safe Withdrawal Rate of 3.5% to 4.0% of your initial retirement corpus in Year 1 (subsequently adjusted annually for inflation) is recommended to ensure your corpus lasts 30+ years without exhaustion.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is SWP in mutual fund?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A Systematic Withdrawal Plan (SWP) allows you to withdraw a fixed amount from your mutual fund investment at regular intervals (monthly, quarterly, or annually) while keeping the remaining corpus invested. Unlike FD interest payouts, SWP withdrawals are a mix of capital redemption and gains, making them more tax-efficient — only the capital gains portion is taxed, not the entire withdrawal amount.',
          },
        },
        {
          '@type': 'Question',
          name: 'How much corpus do I need for ₹50,000 monthly pension through SWP?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Using the 4% safe withdrawal rate (SWR) rule adapted for India, you need approximately ₹1.5 Crore corpus to sustain ₹50,000/month (₹6 Lakh/year) indefinitely. However, if your mutual fund earns 9–10% annual returns and inflation averages 6%, a corpus of ₹1 Crore can sustain ₹50,000/month for approximately 25–30 years with the residual balance still growing.',
          },
        },
      ],
    },
    {
      '@type': 'WebApplication',
      name: 'SWP Calculator — Rupee Calculator',
      url: 'https://rupees.vercel.app/swp-calculator',
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
