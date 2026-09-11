import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import '@/index.scss';
import AppClientLayout from '@/components/AppClientLayout';
export const metadata: Metadata = {
  metadataBase: new URL('https://rupees.vercel.app'),
  title: {
    default: 'Free Online Financial Calculators India — SIP, EMI, FD, SWP & More | Rupee Calculator',
    template: '%s | Rupee Calculator',
  },
  description:
    'Calculate SIP returns, compound interest, EMI amortization, SWP withdrawals, inflation impact & PPP with 100% free, private financial tools. Trusted by Indian investors.',
  keywords: [
    'rupee calculator',
    'compound interest calculator India',
    'SIP calculator',
    'SWP calculator',
    'mutual fund return calculator',
    'EMI calculator',
    'inflation calculator India',
    'PPP calculator',
    'financial planning tools India',
    'FD calculator',
    'RD calculator',
  ],
  authors: [{ name: 'Rupee Calculator' }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  alternates: {
    canonical: 'https://rupees.vercel.app/',
    languages: {
      'en-IN': 'https://rupees.vercel.app/',
      en: 'https://rupees.vercel.app/',
      'x-default': 'https://rupees.vercel.app/',
    },
  },
  openGraph: {
    type: 'website',
    url: 'https://rupees.vercel.app/',
    siteName: 'Rupee Calculator',
    title: 'Free Online Financial Calculators India — SIP, EMI, FD, SWP & More | Rupee Calculator',
    description:
      'Calculate SIP returns, compound interest, EMI amortization, SWP withdrawals, inflation impact & PPP with 100% free, private financial tools. Trusted by Indian investors.',
    images: [
      {
        url: 'https://rupees.vercel.app/images/og-image.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'Rupee Calculator — Free SIP, FD, EMI and Mutual Fund financial calculators for India',
      },
    ],
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@RupeeCalc',
    title: 'Free Online Financial Calculators India — SIP, EMI, FD, SWP & More | Rupee Calculator',
    description:
      'Calculate SIP returns, compound interest, EMI amortization, SWP withdrawals, inflation impact & PPP with 100% free, private financial tools. Trusted by Indian investors.',
    images: ['https://rupees.vercel.app/images/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/site.webmanifest',
};
export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
};
const jsonLdData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://rupees.vercel.app/#organization',
      name: 'Rupee Calculator',
      url: 'https://rupees.vercel.app/',
      logo: {
        '@type': 'ImageObject',
        url: 'https://rupees.vercel.app/images/logo.svg',
        width: 200,
        height: 60,
      },
      description:
        'Free institutional-grade financial calculators for Indian investors, NRIs, and financial planners.',
      areaServed: {
        '@type': 'Country',
        name: 'India',
      },
      knowsAbout: [
        'Mutual Funds',
        'SIP',
        'Fixed Deposits',
        'EMI',
        'Inflation',
        'Purchasing Power Parity',
      ],
      sameAs: [],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://rupees.vercel.app/#website',
      url: 'https://rupees.vercel.app/',
      name: 'Rupee Calculator',
      description:
        'Free, institutional-grade Indian financial calculators for SIP, SWP, FD, EMI, Inflation and PPP.',
      inLanguage: 'en-IN',
      publisher: { '@id': 'https://rupees.vercel.app/#organization' },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://rupees.vercel.app/?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" data-theme="fantasy" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.mfapi.in" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.mfapi.in" />
        <link rel="preconnect" href="https://api.worldbank.org" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.worldbank.org" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body suppressHydrationWarning>
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="lazyOnload"
        />
        <AppClientLayout>{children}</AppClientLayout>
        <noscript>
          <div
            style={{
              fontFamily: 'system-ui, sans-serif',
              maxWidth: 800,
              margin: '40px auto',
              padding: 20,
            }}
          >
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1d4ed8' }}>
              Free Online Financial Calculators India — SIP, EMI, FD &amp; More
            </h1>
            <p style={{ color: '#374151', lineHeight: 1.6 }}>
              India&apos;s most precise, 100% free financial calculator suite. This application requires
              JavaScript to run the interactive calculators.
            </p>
          </div>
        </noscript>
      </body>
    </html>
  );
}
