export const liveSipSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'Mutual Fund SIP Backtest — Rupee Calculator',
      url: 'https://rupees.vercel.app/mutual-funds/sip',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'All',
      browserRequirements: 'Requires JavaScript',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
    },
    {
      '@type': 'FinancialProduct',
      name: 'Mutual Fund SIP Historical Backtest & XIRR Calculator',
      description: 'Backtests historical SIP performance, XIRR returns, units accumulation, and rupee cost averaging on live AMFI mutual fund NAV histories.',
      category: 'InvestmentAccount',
      provider: { '@type': 'Organization', name: 'Rupee Calculator', url: 'https://rupees.vercel.app/' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://rupees.vercel.app/' },
        { '@type': 'ListItem', position: 2, name: 'Mutual Fund SIP Backtest', item: 'https://rupees.vercel.app/mutual-funds/sip' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is XIRR in Mutual Fund SIP performance?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Extended Internal Rate of Return (XIRR) is the true annual rate of return for multiple cashflows occurring at different dates. Since a SIP involves multiple monthly installment cash inflows, XIRR accurately measures the compounded return of your overall portfolio.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does step-up SIP backtesting work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Step-up SIP backtesting simulates annual percentage increases (e.g. 5%, 10%, 15%) in your monthly installment, reflecting real-world salary growth and showing the substantial compounding impact on unit accumulation.',
          },
        },
      ],
    },
  ],
};
export const liveSipFaqs = [
  {
    question: 'Why is XIRR superior to CAGR for evaluating SIP investments?',
    answer: 'CAGR assumes a single point-to-point lump-sum investment. In a SIP, each monthly installment has a different holding period. XIRR calculates the exact internal rate of return across all multiple periodic cash inflows.',
  },
  {
    question: 'How are NAV dates matched during market holidays or weekends?',
    answer: 'If your scheduled SIP date falls on a stock market holiday or weekend, our engine automatically allocates units using the immediately preceding active NAV transaction date, matching AMFI regulations.',
  },
  {
    question: 'Can I backtest SIPs across different mutual fund categories?',
    answer: 'Yes. You can search and compare index funds, large cap, flexi cap, mid cap, small cap, arbitrage, and hybrid funds across direct and regular growth options.',
  },
];
