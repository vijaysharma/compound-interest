export const privacySchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Privacy Policy — Rupee Calculator',
  url: 'https://rupees.vercel.app/privacy',
  description:
    'Privacy policy for Rupee Calculator. We collect zero personal data — all calculations run 100% client-side in your browser.',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://rupees.vercel.app/' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Privacy Policy',
        item: 'https://rupees.vercel.app/privacy',
      },
    ],
  },
};
