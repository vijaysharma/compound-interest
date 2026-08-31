import { useEffect } from 'react';

export interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalPath?: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
  ogImageAlt?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  schema?: object | object[];
  noIndex?: boolean;
}

const DOMAIN = 'https://rupees.vercel.app';
const DEFAULT_OG_IMAGE = `${DOMAIN}/images/og-image.png`;
const DEFAULT_OG_IMAGE_ALT = 'Rupee Calculator — Free Indian Financial Calculators';

/**
 * SEOHead — Manages all dynamic <head> meta tags for each calculator page.
 *
 * NOTE: Organization + WebSite base schemas are injected statically in index.html
 * (crawler-visible on first load). This component manages page-specific schemas
 * (FAQPage, BreadcrumbList, FinancialProduct, HowTo) which are injected after hydration.
 */
export const SEOHead = ({
  title,
  description,
  keywords,
  canonicalPath = '',
  ogType = 'website',
  ogImage,
  ogImageAlt,
  ogImageWidth = 1200,
  ogImageHeight = 630,
  schema,
  noIndex = false,
}: SEOHeadProps) => {
  useEffect(() => {
    // ── 1. Title ──────────────────────────────────────────────────
    document.title = title;

    // ── 2. Helper: upsert a <meta> tag by attribute selector ──────
    const setMeta = (nameAttr: 'name' | 'property', attrValue: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[${nameAttr}="${attrValue}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(nameAttr, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // ── 3. Helper: upsert a <link> tag ────────────────────────────
    const setLink = (rel: string, content: string, extra?: Record<string, string>) => {
      let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', content);
      if (extra) {
        Object.entries(extra).forEach(([k, v]) => el!.setAttribute(k, v));
      }
    };

    // ── 4. Canonical URL ──────────────────────────────────────────
    const cleanPath = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
    const fullCanonical = cleanPath === '/' ? DOMAIN + '/' : `${DOMAIN}${cleanPath}`;
    setLink('canonical', fullCanonical);

    // ── 5. Standard Meta ──────────────────────────────────────────
    setMeta('name', 'description', description);
    if (keywords) setMeta('name', 'keywords', keywords);
    setMeta('name', 'robots', noIndex
      ? 'noindex, nofollow'
      : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
    );

    // ── 6. Open Graph ─────────────────────────────────────────────
    const resolvedImage = ogImage ? (ogImage.startsWith('http') ? ogImage : `${DOMAIN}${ogImage}`) : DEFAULT_OG_IMAGE;
    const resolvedAlt = ogImageAlt ?? DEFAULT_OG_IMAGE_ALT;

    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', fullCanonical);
    setMeta('property', 'og:type', ogType);
    setMeta('property', 'og:image', resolvedImage);
    setMeta('property', 'og:image:width', String(ogImageWidth));
    setMeta('property', 'og:image:height', String(ogImageHeight));
    setMeta('property', 'og:image:type', 'image/png');
    setMeta('property', 'og:image:alt', resolvedAlt);
    setMeta('property', 'og:locale', 'en_IN');
    setMeta('property', 'og:site_name', 'Rupee Calculator');

    // ── 7. Twitter Card ───────────────────────────────────────────
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', resolvedImage);
    setMeta('name', 'twitter:image:alt', resolvedAlt);

    // ── 8. JSON-LD Schema (page-specific) ─────────────────────────
    // Remove previous page's schema before injecting new one
    document.querySelectorAll('script[data-seo-schema]').forEach((s) => s.remove());
    if (schema) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-schema', 'true');
      script.text = JSON.stringify(schema, null, 0);
      document.head.appendChild(script);
    }

    // ── Cleanup ───────────────────────────────────────────────────
    return () => {
      document.querySelectorAll('script[data-seo-schema]').forEach((s) => s.remove());
    };
  }, [title, description, keywords, canonicalPath, ogType, ogImage, ogImageAlt, ogImageWidth, ogImageHeight, schema, noIndex]);

  return null;
};

export default SEOHead;
