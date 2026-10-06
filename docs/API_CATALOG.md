# API Catalog

Status: Source-backed route inventory; server-action request schemas are not
uniformly formalized Source: `src/app/api/**/route.ts`, `src/actions/**`,
`src/lib/db/userUtils.ts`, `vercel.json` Last Verified: 2026-10-05 Confidence:
HIGH for local route code; live proxy/deployment behavior NOT VERIFIED Owner:
UNKNOWN Related Documents: [System design](SYSTEM_DESIGN.md),
[auth security](AUTH_SECURITY.md),
[database architecture](DATABASE_ARCHITECTURE.md)

## HTTP Route Handlers

| Method/path                    | Auth in source                                                      | Behavior/inputs                                                                                               | Side effects / data                                                                         | Status/errors                                                                          | Evidence                                                 |
| ------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `GET /api/nav`                 | Public                                                              | Returns NAV service label, watermark, scheme counts, endpoint hints                                           | Reads PostgreSQL counts and watermark                                                       | JSON; DB count errors are swallowed and counts remain zero                             | `src/app/api/nav/route.ts`                               |
| `GET /api/nav/:schemeCode`     | Public                                                              | Numeric scheme code; optional `startDate`, `endDate`                                                          | Reads stored NAV; may auto-include/backfill from upstream AMFI; returns filtered rows | 400 invalid code; 404 missing scheme; source labels AMFI                               | `src/app/api/nav/[schemeCode]/route.ts`                  |
| `GET /api/cron/sync-nav`       | Bearer `CRON_SECRET`, timing-safe compare                           | Nightly ~01:00 IST: last 10 days of AMFI NAV for tracked schemes only, queued gap fill per fund house, scheme names, watermark probe; 24s work budget | PostgreSQL, AMFI, Redis                                                                     | 401 unauthorized; 503 sync failure; otherwise JSON report                              | `src/app/api/cron/sync-nav/route.ts`, `src/lib/amfi/trackedNavSync.ts` |
| `GET /api/cron/sync-daily-nav` | Exact `Authorization: Bearer ${CRON_SECRET}`; secret missing denies | Optional `date` query; latest tracked schemes with fallback to prior trading day                              | AMFI fetch, PostgreSQL upsert, Redis NAV cache                                              | 400 no active schemes; 404 no NAV found; 401 unauthorized                              | `src/app/api/cron/sync-daily-nav/route.ts`               |
| `GET /api/cron/sync-fii-dii`   | Bearer `CRON_SECRET` **or** `?key=` secret                          | Fetches NSE FII/DII, Yahoo index prices, annual World Bank CPI/PPP                                            | Writes `institutional_flows`, `index_prices`, `macro_indicators`                            | 401 unauthorized; per-source errors returned in results; often 200 with partial errors | `src/app/api/cron/sync-fii-dii/route.ts`                 |
| `GET /api/admin/sync-nav`      | **No auth check in route source**                                   | Delegates to POST behavior; date can be query string                                                          | Checks/upserts NAV for active schemes, Redis update                                         | 404 for no data; otherwise JSON                                                        | `src/app/api/admin/sync-nav/route.ts`                    |
| `POST /api/admin/sync-nav`     | **No auth check in route source**                                   | Date from query/body or current date; accepts only `YYYY-MM-DD` syntactically                                 | May fetch AMFI and mutate NAV storage                                                       | 404 no source data; otherwise JSON                                                     | `src/app/api/admin/sync-nav/route.ts`                    |
| `GET /api/leaderboard?game=`   | Public                                                              | Filters a hardcoded mock list                                                                                 | No DB read                                                                                  | 200 JSON                                                                               | `src/app/api/leaderboard/route.ts`                       |
| `POST /api/leaderboard`        | Public                                                              | Returns instruction to use server actions                                                                     | No score write                                                                              | Always 405                                                                             | `src/app/api/leaderboard/route.ts`                       |

`/api/admin/sync-nav` is a **HIGH security/abuse concern** because the handler
mutates data without an in-handler authorization check. This documentation does
not change it.

## Vercel Rewrites and Scheduled Calls

`vercel.json` declares rewrites for `/api/_rzp-proxy/:path*` to Razorpay and
`/api/shiprocket-postcode/:path*` to Shiprocket. The `sync-nav` cron is
scheduled `30 2 * * *` UTC; `sync-fii-dii` is `35 12 * * 1-5` UTC.
`sync-daily-nav` exists but is not listed in `vercel.json` crons. Whether
external scheduling invokes it is UNKNOWN.

## Server Actions

See [Server Actions Inventory](SERVER_ACTIONS_INVENTORY.md) for exported action
names by domain and source-level authorization notes.

Server Actions are not REST endpoints with stable public URLs. Their exported
modules are:

- Authentication/session: `src/actions/auth.ts` — signup, password/Google login,
  current user, usage, logout.
- Market data: `src/actions/data.ts` — NAV, batch NAV, fund search, exchange
  rates, PPP, IMF inflation.
- Tax AI: `src/actions/taxAi.ts` — status and personalized advice.
- Payments: `src/actions/payments.ts` — settings, order creation, payment
  verification, UPI manual submissions and admin review.
- Admin: `src/actions/admin.ts`, `src/actions/admin/**` — users, sync, AI
  settings, Shiprocket, postcode, payments and related operations.
- Notes: `src/actions/notes.ts` — note CRUD, trash, backup and storage status.
- FII/DII: `src/actions/fiiDii.ts`, `src/actions/getFIIDIIDataAction.ts`.
- PPF history: `src/actions/ppfHistory.ts`.
- Strategy persistence: `src/actions/strategyPersistence.ts`.
- Game scores: `src/actions/gameLeaderboard.ts`.

Inputs are TypeScript types at these modules; they are not a generated OpenAPI
contract. Per-action validation and authorization vary. Treat action signatures
as internal implementation contracts, not a promise of stable external API
compatibility.

## Not Found

No API versioning policy, OpenAPI specification, global rate-limit middleware,
or API deprecation policy was found. Rate limiting exists for selected game
score actions. Server-action abuse limits outside explicitly inspected actions
are NOT VERIFIED.
