export const homeSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://rupees.vercel.app/#website',
      url: 'https://rupees.vercel.app/',
      name: 'Rupee Calculator',
      description:
        'Free institutional-grade financial calculators for Indian investors — SIP, SWP, FD, EMI, Inflation & PPP. 100% private, client-side execution.',
      inLanguage: 'en-IN',
      publisher: { '@id': 'https://rupees.vercel.app/#organization' },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://rupees.vercel.app/mutual-funds/sip?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://rupees.vercel.app/#organization',
      name: 'Rupee Calculator',
      url: 'https://rupees.vercel.app/',
      logo: 'https://rupees.vercel.app/images/logo.svg',
      sameAs: [],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Are the financial calculations on Rupee Calculator 100% free and private?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. All mathematical models, compounding algorithms, and EMI amortization schedules run 100% client-side in your browser. No financial numbers or personal inputs are transmitted to external servers.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does Rupee Calculator source its mutual fund and macroeconomic data?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Mutual fund NAV histories are retrieved directly from AMFI (Association of Mutual Funds in India), while purchasing power parity and inflation datasets are verified via the World Bank and International Monetary Fund (IMF).',
          },
        },
        {
          '@type': 'Question',
          name: 'What calculators are available on Rupee Calculator?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Rupee Calculator provides 9+ institutional-grade tools including SIP Calculator, SWP Calculator, Fixed Deposit (FD) Compounding Calculator, Recurring Deposit (RD) Calculator, Loan EMI & Amortization Calculator, Inflation Calculator, Purchasing Power Parity (PPP) Converter, Live Currency Converter, and Mutual Fund CAGR Analytics Engine.',
          },
        },
      ],
    },
  ],
};
