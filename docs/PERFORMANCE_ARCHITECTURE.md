# Performance Architecture

Status: Source/config inventory; no current benchmark run Source:
`next.config.ts`, `vercel.json`, `src/actions/data/`, `src/lib/redis.ts`,
`src/components/AppClientLayout.tsx` Last Verified: 2026-10-05 Confidence: HIGH
for declared controls; LOW for production performance Owner: UNKNOWN Related
Documents: [Performance findings](PERFORMANCE_FINDINGS.md),
[data freshness](DATA_FRESHNESS.md), [DevOps](DEVOPS_GUIDE.md)

## Implemented Mechanisms

- Next.js App Router and route-level modules provide framework code splitting;
  exact bundle sizes and route rendering are not measured here.
- `next.config.ts` sets compression and optimizes package imports for
  `react-icons`, `ag-charts-community`, and `ag-charts-react`.
- `productionBrowserSourceMaps` is enabled; review operational exposure.
- NAV batches limit concurrency to 4; NAV upstream timeout is 8s, background
  timeout/cron budgets are bounded, and per-scheme Redis single-flight/cooldown
  logic exists.
- Redis REST is used to avoid maintaining Redis TCP pools in serverless, with
  process-local fallback; this fallback is not distributed.
- Vercel functions are configured with `maxDuration: 30`; cron NAV workers use
  20s refresh budget and max 40 candidates.
- Next/image remote patterns permit Google profile images, Dicebear, and
  Razorpay checkout.
- Static assets have cache headers in `vercel.json`.

## Rendering/Data Fetching

App shell is a server root layout wrapping a client app shell/Suspense boundary.
Many calculator views are client-side interactive components; server actions and
route handlers fetch/persist data. NAV is cached in PostgreSQL, Redis and
process memory. Static/SSR/ISR status per route is not certified; deployment
build manifests should be examined for a release-specific rendering profile.

## Metrics Not Available in Repository

No measured LCP/INP/CLS, route bundle budgets, DB query latency dashboards, AI
latency/cost metrics, cache hit ratios, upstream success SLOs, or load-test
reports were found in the inspected source. Existing
`PERFORMANCE_AND_SECURITY_REPORT.md` is a historical report; its figures/results
are not treated as current verification.
