# SEO Guide

Status: Source/config inventory; crawlers/live indexing NOT VERIFIED Source:
`src/data/rootMetadata.ts`, `src/data/seoMetadata.ts`, `src/app/**`,
`src/app/robots.ts`, `src/app/sitemap.ts`, `public/robots.txt`,
`public/sitemap.xml` Last Verified: 2026-10-05 Confidence: HIGH for source
declarations; LOW for crawler output Owner: UNKNOWN Related Documents:
[Product inventory](PRODUCT_AND_FEATURE_INVENTORY.md),
[drift register](DOCUMENTATION_VS_IMPLEMENTATION_DRIFT.md)

## Metadata and Canonical URLs

- Source count: 39 of 48 `page.tsx` files export route metadata; inspect the
  remaining nine before claiming full coverage.

- `src/app/layout.tsx` exports `rootMetadata` with `metadataBase` and canonical
  domain `https://rupees.vercel.app`.
- Many route files export Next `metadata` from `SEO_PAGES`; several define
  metadata inline. A search confirmed metadata declarations across many, but not
  every one of the 48 page files; verify route coverage from `src/app` before
  claiming universal coverage.
- Legacy `SEOHead` is a client component that updates title, description,
  robots, canonical, OpenGraph, Twitter tags in `useEffect`; it also returns
  JSON-LD as JSX when provided. Its comments reference an earlier `index.html`
  setup and should not be treated as runtime evidence.
- Root layout includes organization/website JSON-LD in `<head>`.

## Sitemap and Robots

`src/app/sitemap.ts` lists a curated subset of public routes (currently 22
records) and sets every `lastModified` to `new Date()` at generation time. It
omits many app routes, including games, admin and utilities not explicitly
selected. `src/app/robots.ts` disallows admin/API/login/upgrade/quick-notes for
`*`, then defines separate Googlebot/Bingbot groups allowing `/`; crawler-group
precedence should be verified. Robots rules are not access control.

Static `public/sitemap.xml` and `public/robots.txt` coexist with App Router
metadata routes. `vercel.json` assigns cache headers to both paths; confirm
which response is served in deployed hosting and avoid competing sitemap
sources.

## Verification Gaps

No Search Console/Bing Webmaster evidence, crawl test, canonical duplicate
analysis, structured-data validator output, or route-specific metadata snapshot
was found. SEO claims about all routes, indexation, traffic, or rankings are NOT
VERIFIED.
