# Holistic Performance, Security, Redis Caching & SEO Audit Report

**Date:** September 13, 2026  
**Status:** Completed & Verified  
**Project:** Rupee Calculator (Compound Interest Suite)  

---

## Executive Summary

A comprehensive architectural, security, performance, caching, and search engine optimization (SEO) overhaul was conducted across the Next.js App Router codebase, server actions, external API integrations, and asset pipelines.

Key achievements in this phase:
1. **Critical Vulnerabilities Neutralized**:
   - Closed a critical mathematical expression code injection risk in `src/utilities/calculatorHelper.ts` by introducing strict regex and character whitelisting before calculation evaluation.
   - Protected against denial-of-service and thread exhaustion from hanging external upstream services (AMFI, World Bank, Google OAuth, Gemini AI) by enforcing bounded HTTP timeouts with `AbortSignal.timeout(...)`.
   - Prevented Gemini API secret leaks by removing the API key from URL query strings and enforcing standard `x-goog-api-key` authorization headers.
2. **Serverless-Optimized Redis Caching Architecture**:
   - Engineered a zero-cold-start Redis caching layer in `src/lib/redis.ts` utilizing Upstash REST API (`UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`) with an automated in-memory LRU fallback when Redis credentials are not configured.
   - Cached high-latency external endpoints in `src/actions/data.ts` (World Bank PPP data, IMF inflation figures, AMFI mutual fund search, mutual fund NAV historicals, USD exchange rates) and Vercel Blob notes in `src/actions/notes.ts`.
3. **Build & Runtime Performance**:
   - Activated Gzip/Brotli compression (`compress: true`) and icon tree-shaking (`experimental: { optimizePackageImports: ['react-icons'] }`) in `next.config.ts`.
   - Configured high-performance edge redirects in `vercel.json` for legacy alias routes.
4. **Comprehensive SEO Optimization (Zero UI Changes)**:
   - Developed `src/data/seoMetadata.ts` containing high-CTR metadata, search keywords, OpenGraph specifications, Twitter cards, and canonical URL definitions.
   - Exported static `Metadata` across all 27+ App Router routes (`page.tsx`), enabling pre-rendered HTML meta tags for Googlebot, Bingbot, and social crawlers.
   - Enhanced `src/components/SEOHead.tsx` to render `<script type="application/ld+json">` during Server-Side Rendering (SSR) for rich search engine snippets (`FinancialProduct`, `WebApplication`, `FAQPage`).
   - Implemented dynamic Next.js App Router sitemaps and robots rules (`src/app/sitemap.ts`, `src/app/robots.ts`) and synchronized `public/sitemap.xml`.

---

## 1. Security Vulnerabilities Identified & Remediated

### 1.1 Critical: Calculator Expression Injection (`src/utilities/calculatorHelper.ts`)
* **Vulnerability**: The mathematical calculation helper function previously sanitized expressions by removing whitespace and replacing operators, but then directly passed the resulting string to `new Function('return ' + expr)`. If unexpected input containing identifiers, property accessors, or malicious JavaScript syntax slipped past sanitization, it could result in arbitrary code execution in the client browser context.
* **Remediation**:
  - Implemented strict regex-based validation (`/^[0-9+\-*/().\s]+$/`) before evaluating any expression string.
  - Blocked all dangerous tokens (`window`, `document`, `globalThis`, `eval`, `Function`, `constructor`, `fetch`, `import`, prototype accessors `__proto__`, etc.).
  - Added boundary and length limits, ensuring that only pure arithmetic statements can be evaluated.

### 1.2 High: Unbounded Network Requests & Thread Starvation DoS (`src/actions/*`)
* **Vulnerability**: Server actions fetching external third-party data (AMFI mutual fund NAVs, Google OAuth token verification, and Gemini AI endpoints) lacked timeout thresholds. If upstream APIs suffered outages, degraded latency, or kept sockets open, serverless execution slots would hang until platform timeout (60s+), exhausting execution budgets and causing gateway timeouts (504).
* **Remediation**:
  - Added strict bounded timeouts using `AbortSignal.timeout(...)`:
    - `src/actions/data.ts` (`getMutualFundNavAction`): 8-second timeout.
    - `src/actions/auth.ts` (Google OAuth token verification): 6-second timeout.
    - `src/actions/taxAi.ts` (Gemini Tax AI parsing): 25-second timeout.
  - Implemented graceful error recovery returning typed error responses rather than unhandled promise rejections.

### 1.3 Medium: Secret Key Leak in URL Query Parameters (`src/actions/taxAi.ts`)
* **Vulnerability**: Gemini AI requests passed the API key as a query parameter in the request URL (`?key=${apiKey}`). Query parameters are frequently logged in plain text across upstream CDN edge logs, proxy server access logs, and network monitor traces.
* **Remediation**:
  - Removed `?key=${apiKey}` from the request URI.
  - Passed the API key securely via the `x-goog-api-key: apiKey` HTTP request header, ensuring encryption over transit and omission from URL access logs.

---

## 2. Serverless Redis Caching Architecture

### 2.1 Design & Implementation (`src/lib/redis.ts`)
To achieve sub-20ms response times on cold and warm serverless invocations without running into TCP connection exhaustion typical of standard Redis clients (e.g. `ioredis`), a REST-based Redis client was created:
- **Upstash REST Redis Support**: Connects over HTTPS using `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Stateless, edge-compatible, and connectionless.
- **In-Memory LRU Cache Fallback**: When Upstash credentials are not configured (local development or standalone deployments), the caching layer transparently falls back to an in-memory `Map`-based LRU cache with TTL auto-expiration.
- **Cache-Aside Pattern**: `getCachedOrFetch<T>(key, fetcher, ttlSeconds)` handles cache hits, serialized JSON parsing, cache misses, and upstream storage atomically.

### 2.2 Cached Datasets & TTL Policy
| Key Pattern | Data Source | TTL | Impact |
| :--- | :--- | :--- | :--- |
| `cache:rates:usd` | Open Exchange Rates / Fallback | 1 hour | Eliminates repeated foreign exchange rate queries |
| `cache:ppp:worldbank` | World Bank API | 24 hours | Prevents slow multi-second World Bank API calls |
| `cache:inflation:imf` | IMF Data API | 24 hours | Speeds up inflation calculator historical lookups |
| `cache:mf:search:<query>` | AMFI Scheme Master | 1 hour | Provides instant mutual fund autocomplete |
| `cache:mf:nav:<codeFilter>` | AMFI NAV Historicals | 30 mins | Fast NAV history rendering for lumpsum/SIP charts |
| `cache:note:<id>:<updated_at>` | Vercel Blob Note Content | 1 hour | Eliminates blob download latency on note access |

### 2.3 How to Configure Upstash Redis on Vercel
1. Create a free Redis database at [console.upstash.com](https://console.upstash.com/).
2. In the Upstash database dashboard, copy the **REST API** credentials:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Add these two environment variables to your Vercel Project Settings (`Settings > Environment Variables`).
4. Redeploy or push to `main`. The app will immediately switch from the in-memory fallback to distributed global Redis caching.

---

## 3. SEO & Rich Snippet Overhaul (Zero UI Changes)

### 3.1 Static Metadata Architecture (`src/data/seoMetadata.ts`)
Next.js App Router routes now export pre-compiled, static `Metadata` objects. Search engine crawlers receive complete, fully populated `<title>`, `<meta name="description">`, `<meta name="keywords">`, `<link rel="canonical">`, OpenGraph cards, and Twitter cards directly in initial HTML responses.

### 3.2 Coverage Across All App Routes
All 27+ routes are covered:
- **Core Financial Calculators**: `/` (Compound Interest), `/emi-calculator`, `/income-tax-calculator`, `/fd-calculator`, `/rd-calculator`, `/sip-calculator`, `/swp-calculator`, `/ppf-calculator`, `/nps-calculator`, `/mutual-funds/lumpsum`, `/mutual-funds/sip`, `/mutual-funds/swp`.
- **Economic & Currency Tools**: `/inflation-calculator`, `/ppp-calculator`, `/currency-converter`.
- **Utilities & Productivity**: `/calculator`, `/date-calculator`, `/utilities/calculator`, `/utilities/date-calculator`, `/utilities/unit-converter`, `/utilities/quick-notes`.
- **Trust & Compliance Pages**: `/about`, `/privacy`, `/disclaimer`, `/login`, `/upgrade`.

### 3.3 Server-Side Rendered JSON-LD Structured Data (`src/components/SEOHead.tsx`)
- Structured data schemas (`FinancialProduct`, `WebApplication`, `FAQPage`) were previously generated only in client-side `useEffect` hooks.
- `SEOHead.tsx` was enhanced to render `<script type="application/ld+json">` during SSR. Search crawlers parsing static HTML now index rich snippets without requiring JavaScript execution.

### 3.4 Sitemaps & Search Crawler Directives
- **`src/app/sitemap.ts`**: Implemented a dynamic Next.js App Router sitemap with priority rankings (1.0 for high-intent calculators, 0.9 for mutual funds/SIP, 0.7 for utilities) and change frequencies.
- **`src/app/robots.ts`**: Configured crawler rules allowing full indexing of public calculator routes while disallowing private admin/auth paths (`/admin`, `/api/admin`, `/api/auth`).
- **`public/sitemap.xml`**: Synchronized with all newly created routes (`/income-tax-calculator`, `/ppf-calculator`, `/nps-calculator`, `/file-itr`, `/utilities/unit-converter`).

---

## 4. Build & Asset Optimizations

### 4.1 Next.js Configuration (`next.config.ts`)
- **Package Tree-Shaking**: Added `experimental: { optimizePackageImports: ['react-icons'] }` to tree-shake heavy barrel files from `react-icons/fi`, `react-icons/fa`, `react-icons/md`, reducing bundle sizes across all routes.
- **Compression**: Enabled `compress: true` for automatic Gzip and Brotli compression on static assets and API payloads.

### 4.2 Edge Redirects (`vercel.json`)
Added permanent edge redirects (HTTP 308) routing legacy URLs to their canonical App Router paths:
- `/deposits/ppf` -> `/ppf-calculator`
- `/fixed-plans/ppf` -> `/ppf-calculator`
- `/fixed-plans/nps` -> `/nps-calculator`
- `/tax/income-tax` -> `/income-tax-calculator`
- `/tax-calculator` -> `/income-tax-calculator`
- `/admin/notes` -> `/utilities/quick-notes`
- `/notes` -> `/utilities/quick-notes`

---

## 5. Verification & Validation

1. **Linting Verification**:
   - `npm run lint` (`next lint`): Passed cleanly with 0 errors.
2. **Build Verification**:
   - `npm run build` (`next build` with Turbopack): Completed successfully with 0 TypeScript or build errors in 10.3s.
   - All 37 routes generated as optimized static pages (`○ (Static)`).
3. **Zero UI Disruption**:
   - No CSS files, styles, visual components, layout structures, or user-facing copy were altered. All SEO enhancements are embedded exclusively in HTML `<head>` metadata and structured JSON-LD schemas.

---

## 6. Comprehensive Summary of Modified Files

| File | Category | Description |
| :--- | :--- | :--- |
| `src/utilities/calculatorHelper.ts` | Security | Regex token validation preventing code/expression injection in `new Function` |
| `src/actions/data.ts` | Security / Perf | `AbortSignal.timeout(8000)` on NAV fetch; multi-tiered Redis caching |
| `src/actions/auth.ts` | Security / Perf | `AbortSignal.timeout(6000)` on Google OAuth token verification |
| `src/actions/taxAi.ts` | Security | `AbortSignal.timeout(25000)` on Gemini API; `x-goog-api-key` header migration |
| `src/actions/notes.ts` | Performance | Distributed Redis caching for encrypted note content from Vercel Blob |
| `src/lib/redis.ts` | Infrastructure | Serverless Upstash REST Redis client with automated in-memory LRU fallback |
| `next.config.ts` | Performance | Enabled `compress: true` and `optimizePackageImports: ['react-icons']` |
| `vercel.json` | Performance / SEO | Permanent edge redirects for legacy calculator and utility routes |
| `src/data/seoMetadata.ts` | SEO | Centralized metadata registry with high-CTR titles, descriptions, keywords |
| `src/components/SEOHead.tsx` | SEO | SSR-rendered `<script type="application/ld+json">` for search crawler schemas |
| `src/app/sitemap.ts` | SEO | Dynamic App Router sitemap generation with priority and change frequencies |
| `src/app/robots.ts` | SEO | App Router search crawler directives and sitemap link |
| `public/sitemap.xml` | SEO | Added missing high-traffic routes to the static XML sitemap |
| `src/app/**/page.tsx` (26 files) | SEO | Exported static `Metadata` across all App Router routes |
