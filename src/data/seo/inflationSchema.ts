export const inflationSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FinancialProduct',
      name: 'Inflation & Purchasing Power Calculator India',
      description:
        'Models historical purchasing power erosion and future cost inflation across India, USA, EU, and World using official World Bank and IMF consumer price index (CPI) datasets.',
      category: 'EconomicAnalysis',
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
          name: 'Inflation Calculator',
          item: 'https://rupees.vercel.app/inflation-calculator',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How does inflation affect the future purchasing power of money in India?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Inflation reduces the purchasing power of money over time. At an average annual inflation rate of 6%, ₹1,00,000 today will have the purchasing power of only approximately ₹55,800 in 10 years and ₹31,180 in 20 years.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the Rule of 72 for inflation?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The Rule of 72 estimates how many years it will take for prices to double (or your purchasing power to halve). Divide 72 by the annual inflation rate. For example, at a 6% inflation rate: 72 / 6 = 12 years to halve your money purchasing power.',
          },
        },
        {
          '@type': 'Question',
          name: 'Which investment asset classes historically beat inflation in India?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Diversified Equity Mutual Funds (12-15% CAGR) and Gold (9-11% CAGR) have historically generated positive real (inflation-adjusted) returns over long horizons in India, whereas traditional savings accounts (3-4%) and post-tax fixed deposits (4.5-5.5%) often result in negative real returns.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does inflation affect savings and fixed deposits?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "If your savings account earns 3.5% and inflation is 6%, your real (inflation-adjusted) return is −2.5% per year. Over 10 years, ₹10 Lakh in a savings account grows nominally to ~₹14.1 Lakh, but its purchasing power drops to only ~₹7.9 Lakh in today's terms. Even FDs at 7% barely break even after 30% tax (effective 4.9%) against 6% inflation. Equity investments averaging 12–15% are the primary inflation-beating asset class for Indian investors.",
          },
        },
      ],
    },
    {
      '@type': 'WebApplication',
      name: 'Inflation Calculator — Rupee Calculator',
      url: 'https://rupees.vercel.app/inflation-calculator',
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
