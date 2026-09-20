export const aboutSchema = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'About Rupee Calculator',
  url: 'https://rupees.vercel.app/about',
  description:
    'Rupee Calculator is a free, privacy-first financial calculator suite built for Indian investors. Learn about our mission, data sources, and technology.',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://rupees.vercel.app/' },
      { '@type': 'ListItem', position: 2, name: 'About', item: 'https://rupees.vercel.app/about' },
    ],
  },
};
