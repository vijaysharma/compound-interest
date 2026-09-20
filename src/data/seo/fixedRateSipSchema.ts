export const sipSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FinancialProduct',
      name: 'Systematic Investment Plan (SIP) Calculator India',
      description:
        'Calculates mutual fund SIP wealth accumulation, total invested amount, maturity corpus, and estimated capital gains using monthly compounding.',
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
          name: 'SIP Calculator',
          item: 'https://rupees.vercel.app/sip-calculator',
        },
      ],
    },
    {
      '@type': 'HowTo',
      name: 'How to Use the SIP Calculator',
      description:
        'Calculate your Systematic Investment Plan returns and projected wealth in 4 simple steps.',
      totalTime: 'PT1M',
      step: [
        {
          '@type': 'HowToStep',
          position: 1,
          name: 'Enter Monthly Investment Amount',
          text: 'Enter the amount you plan to invest every month via SIP (e.g., ₹10,000). You can also switch to "Target Amount" mode to calculate the required monthly SIP.',
        },
        {
          '@type': 'HowToStep',
          position: 2,
          name: 'Set Expected Annual Return (CAGR)',
          text: 'Enter the expected annualized return rate. Use 12% for diversified equity mutual funds based on historical Indian market performance.',
        },
        {
          '@type': 'HowToStep',
          position: 3,
          name: 'Choose Investment Duration',
          text: 'Select how many years or months you plan to continue your SIP (1–35 years).',
        },
        {
          '@type': 'HowToStep',
          position: 4,
          name: 'View Instant Results',
          text: 'Your projected maturity value, total amount invested, estimated capital gains, and wealth multiplier are calculated and displayed instantly.',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is the formula for calculating SIP returns?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The maturity amount of a Systematic Investment Plan (SIP) is calculated using the future value of an annuity formula: M = P × [((1 + i)^n - 1) / i] × (1 + i), where P is the monthly investment amount, i is the monthly interest rate (annual rate / 12 / 100), and n is the total number of monthly payments.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does a Step-Up SIP accelerate wealth accumulation?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A Step-Up SIP (or Top-Up SIP) increases your monthly contribution annually (typically by 10% in line with salary increments). Over a 15-20 year investment horizon, a 10% annual step-up can more than double your final maturity corpus compared to a flat SIP.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the tax on Equity Mutual Fund SIP returns in India?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'For Equity Mutual Funds, Long-Term Capital Gains (LTCG) on units held for more than 12 months are tax-exempt up to ₹1.25 Lakh per financial year; gains exceeding ₹1.25 Lakh are taxed at 12.5% without indexation. Short-Term Capital Gains (STCG on units held under 12 months) are taxed at 20%.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is SIP and how does it work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A Systematic Investment Plan (SIP) is a method of investing a fixed amount regularly (monthly or weekly) in mutual funds. Each SIP installment buys units at the prevailing NAV, enabling rupee cost averaging — you automatically buy more units when markets are low and fewer when markets are high, reducing the average cost per unit over time.',
          },
        },
        {
          '@type': 'Question',
          name: 'SIP vs Lump Sum: Which is better for mutual fund investment?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'SIP is better for salaried investors who want disciplined, regular investing with reduced market timing risk through rupee cost averaging. Lump sum is better when you have a large corpus available and markets are at reasonable valuations. Historical data shows that over 10+ year periods, lump sum investments slightly outperform SIP in rising markets, but SIP provides better risk-adjusted returns during volatile periods.',
          },
        },
      ],
    },
    {
      '@type': 'WebApplication',
      name: 'SIP Calculator — Rupee Calculator',
      url: 'https://rupees.vercel.app/sip-calculator',
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
