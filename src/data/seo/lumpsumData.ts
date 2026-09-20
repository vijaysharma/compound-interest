export const lumpsumSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'Mutual Fund Lumpsum Calculator — Rupee Calculator',
      url: 'https://rupees.vercel.app/mutual-funds/lumpsum',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'All',
      browserRequirements: 'Requires JavaScript',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
    },
    {
      '@type': 'FinancialProduct',
      name: 'Mutual Fund Lumpsum Return & Historical NAV Calculator',
      description: 'Analyzes historical mutual fund lumpsum investments, CAGR performance, absolute returns, and rolling NAV trajectories with live AMFI data.',
      category: 'InvestmentAccount',
      provider: { '@type': 'Organization', name: 'Rupee Calculator', url: 'https://rupees.vercel.app/' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://rupees.vercel.app/' },
        { '@type': 'ListItem', position: 2, name: 'Mutual Fund Lumpsum Calculator', item: 'https://rupees.vercel.app/mutual-funds/lumpsum' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How is Compound Annual Growth Rate (CAGR) calculated for Mutual Funds?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'CAGR measures the annual compounded rate of return of an investment over a specific time horizon using the formula: CAGR = [(Ending NAV / Beginning NAV)^(1 / Years) - 1] × 100.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the taxation on Lumpsum Equity Mutual Fund investments in India?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Long-Term Capital Gains (LTCG) on equity mutual fund units held for over 12 months are tax-exempt up to ₹1.25 Lakh per financial year, with gains exceeding ₹1.25 Lakh taxed at 12.5%. Short-Term Capital Gains (STCG on units held under 12 months) are taxed at 20%.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is Lumpsum investment better than SIP?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Lumpsum investing generally delivers higher long-term returns during bull or upward trending markets because 100% of your capital compounds from Day 1. However, SIPs offer superior risk protection during volatile or declining markets through Rupee Cost Averaging.',
          },
        },
      ],
    },
  ],
};
export const lumpsumFaqs = [
  {
    question: 'How does historical NAV backtesting work on Rupee Calculator?',
    answer: 'We fetch verified daily Net Asset Value (NAV) price histories directly from the Association of Mutual Funds in India (AMFI). When you choose a date range, our engine calculates the exact historical unit allotment, absolute profit, and annualized CAGR across thousands of direct and regular mutual fund schemes.',
  },
  {
    question: 'What is the difference between Direct Plan and Regular Plan mutual funds?',
    answer: 'Direct plans have lower annual expense ratios (TER) because no distributor commissions are paid. Over 10-20 years, direct plans frequently deliver 1.0% to 1.5% higher annual CAGR, compounding into lakhs of rupees in extra wealth.',
  },
  {
    question: 'Can I compare multiple mutual funds simultaneously?',
    answer: 'Yes. Rupee Calculator allows you to pin and backtest up to 8 mutual funds side-by-side on interactive multi-line growth charts with synchronized date ranges.',
  },
  {
    question: 'What is the difference between Absolute Return and CAGR?',
    answer: 'Absolute Return measures the raw percentage gain from start to finish without accounting for time. CAGR normalizes this growth over multiple years to show the smooth annual compounding pace, making it the industry standard for multi-year comparisons.',
  },
];
