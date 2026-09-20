import type { Metadata } from 'next';
export interface PageMetadataOptions {
  title: string;
  description: string;
  keywords?: string[];
  canonicalPath: string;
  ogImage?: string;
  noIndex?: boolean;
}
export const DOMAIN = 'https://rupees.vercel.app';
export const DEFAULT_OG_IMAGE = `${DOMAIN}/images/og-image.png`;
export function createPageMetadata({
  title,
  description,
  keywords,
  canonicalPath,
  ogImage = DEFAULT_OG_IMAGE,
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const cleanPath = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
  const canonicalUrl = cleanPath === '/' ? DOMAIN : `${DOMAIN}${cleanPath}`;
  const image = ogImage.startsWith('http') ? ogImage : `${DOMAIN}${ogImage}`;
  return {
    title,
    description,
    keywords: keywords || [],
    alternates: {
      canonical: canonicalUrl,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
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
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      title,
      description,
      siteName: 'Rupee Calculator',
      locale: 'en_IN',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@RupeeCalc',
      title,
      description,
      images: [image],
    },
  };
}
