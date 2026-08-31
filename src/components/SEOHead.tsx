import { useEffect } from 'react';
export interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalPath?: string;
  ogType?: 'website' | 'article';
  schema?: object | object[];
}
const DOMAIN = 'https://rupees.vercel.app';
export const SEOHead = ({
  title,
  description,
  keywords,
  canonicalPath = '',
  ogType = 'website',
  schema,
}: SEOHeadProps) => {
  useEffect(() => {
    // 1. Update Title
    document.title = title;
    // 2. Helper function to upsert meta tag
    const setMeta = (nameAttr: 'name' | 'property', attrValue: string, content: string) => {
      let element = document.querySelector(`meta[${nameAttr}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(nameAttr, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };
    // 3. Update Standard Meta
    setMeta('name', 'description', description);
    if (keywords) {
      setMeta('name', 'keywords', keywords);
    }
    // 4. Update OpenGraph & Twitter
    const cleanPath = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
    const fullCanonical = `${DOMAIN}${cleanPath === '/' ? '' : cleanPath}`;
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', fullCanonical);
    setMeta('property', 'og:type', ogType);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    // 5. Update Canonical Tag
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', fullCanonical);
    // 6. Inject Dynamic JSON-LD Schema
    const existingScript = document.getElementById('json-ld-structured-data');
    if (existingScript) {
      existingScript.remove();
    }
    if (schema) {
      const script = document.createElement('script');
      script.id = 'json-ld-structured-data';
      script.type = 'application/ld+json';
      script.text = JSON.stringify(schema);
      document.head.appendChild(script);
    }
    return () => {
      const scriptToClean = document.getElementById('json-ld-structured-data');
      if (scriptToClean) {
        scriptToClean.remove();
      }
    };
  }, [title, description, keywords, canonicalPath, ogType, schema]);
  return null;
};
export default SEOHead;
