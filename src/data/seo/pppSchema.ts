export const pppSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'PPP Calculator — Rupee Calculator',
      url: 'https://rupees.vercel.app/ppp-calculator',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'All',
      browserRequirements: 'Requires JavaScript',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
      },
    },
    {
      '@type': 'FinancialProduct',
      name: 'Purchasing Power Parity (PPP) Salary & Cost of Living Calculator',
      description:
        'Calculates real purchasing power parity and equivalent standard-of-living salaries across 150+ countries using official World Bank conversion factors and real-time exchange rates.',
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
          name: 'PPP Calculator',
          item: 'https://rupees.vercel.app/ppp-calculator',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is Purchasing Power Parity (PPP)?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Purchasing Power Parity (PPP) is an economic metric that measures the amount of local currency required to purchase an identical basket of goods and services in different countries, accounting for price differences and living costs rather than currency exchange rates alone.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the PPP conversion factor between India and the United States?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'According to World Bank data, the PPP conversion factor for India is approximately ~₹23-25 per 1 US Dollar (compared to nominal exchange rates of ~₹83-87 per USD). This means ₹25 Lakhs in India offers equivalent domestic purchasing power to roughly $100,000 in the USA.',
          },
        },
        {
          '@type': 'Question',
          name: 'Why do nominal currency conversions mislead global salary comparisons?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Converting salary using market foreign exchange rates ignores local rent, healthcare, groceries, and services. A $100,000 salary in New York or San Francisco may purchase a similar lifestyle to ₹20-25 Lakhs in Bengaluru or Hyderabad once living costs are factored in.',
          },
        },
      ],
    },
  ],
};
