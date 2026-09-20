export const swpSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'Mutual Fund SWP Backtest — Rupee Calculator',
      url: 'https://rupees.vercel.app/mutual-funds/swp',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'All',
      browserRequirements: 'Requires JavaScript',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
    },
    {
      '@type': 'FinancialProduct',
      name: 'Mutual Fund SWP Retirement Backtesting Engine India',
      description: 'Backtests historical mutual fund Systematic Withdrawal Plans (SWP), inflation-adjusted monthly pension drawdowns, and portfolio longevity with live AMFI data.',
      category: 'InvestmentAccount',
      provider: { '@type': 'Organization', name: 'Rupee Calculator', url: 'https://rupees.vercel.app/' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://rupees.vercel.app/' },
        { '@type': 'ListItem', position: 2, name: 'Mutual Fund SWP Backtest', item: 'https://rupees.vercel.app/mutual-funds/swp' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How does historical SWP backtesting account for mutual fund market crashes?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Historical SWP backtesting uses exact daily AMFI NAV prices to simulate redemptions during market crashes (such as 2008 and 2020), revealing true sequence-of-returns risk and testing whether your portfolio could survive severe bear markets.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does step-up SWP combat retirement inflation?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Step-up SWP increases your monthly payout by a set percentage each year (e.g., 6%), matching living cost inflation while testing if your underlying mutual fund growth sustains the higher withdrawal demands.',
          },
        },
      ],
    },
  ],
};
export const liveSwpFaqs = [
  {
    question: 'What is Sequence of Returns Risk in retirement SWP planning?',
    answer: 'Sequence of Returns Risk is the risk of experiencing poor market returns in the first few years of retirement. When market NAVs crash early, more units must be liquidated to meet fixed monthly cashflows, causing permanent capital impairment unless buffered by hybrid or debt funds.',
  },
  {
    question: 'How do Hybrid / Balanced Advantage Funds help in SWP backtests?',
    answer: 'Balanced Advantage Funds dynamically shift between equity and debt based on market valuations, limiting downside drawdowns and preventing excessive unit redemptions during market corrections.',
  },
  {
    question: 'How are capital gains taxed when redeeming units under an SWP mandate?',
    answer: 'Each monthly SWP installment redeems a fraction of mutual fund units. Only the capital appreciation portion of the redeemed units is taxed (First-In, First-Out basis), making SWP vastly more tax-efficient than interest-bearing deposits.',
  },
];
