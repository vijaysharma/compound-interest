export const currencyConverterSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'Currency Converter — Rupee Calculator',
      url: 'https://rupees.vercel.app/currency-converter',
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
      name: 'Live Foreign Exchange Currency Converter',
      description:
        'Convert 160+ world currencies with live mid-market exchange rates. Free real-time currency conversion for USD, INR, EUR, GBP, AED, CAD, and more.',
      category: 'CurrencyConversion',
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
          name: 'Currency Converter',
          item: 'https://rupees.vercel.app/currency-converter',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How are real-time currency conversion rates determined?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Currency conversion rates are determined by the global foreign exchange (forex) market where currencies are traded 24 hours a day. Rates fluctuate continuously based on supply, demand, interest rates, inflation expectations, and geopolitical events.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the difference between mid-market rate and bank retail exchange rate?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The mid-market rate is the midpoint between the buy and sell prices on global wholesale markets—the real exchange rate without retail markups. Banks, airports, and card issuers usually add a 1% to 4% markup or forex markup fee on top of this rate.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the difference between Currency Conversion and Purchasing Power Parity (PPP)?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Currency conversion tells you the exact financial amount you receive when exchanging currencies at current market prices. Purchasing Power Parity (PPP) tells you how much money you need in another country to buy the same lifestyle and basket of goods, taking into account local rent, groceries, and living costs.',
          },
        },
        {
          '@type': 'Question',
          name: 'How frequently are the currency exchange rates updated?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Exchange rates on Rupee Calculator are sourced from real-time open forex market feeds and updated continuously to reflect live global mid-market values.',
          },
        },
      ],
    },
  ],
};
