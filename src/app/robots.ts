import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/admin/',
          '/api/auth/',
          '/api/payments/',
          '/login',
          '/admin',
          '/upgrade',
          '/utilities/quick-notes',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
      },
    ],
    sitemap: 'https://rupees.vercel.app/sitemap.xml',
    host: 'https://rupees.vercel.app',
  };
}
