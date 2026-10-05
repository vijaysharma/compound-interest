# Security Architecture

Status: Initial repository-based security inventory; not a penetration test
Source: `next.config.ts`, `vercel.json`, `src/actions/`, `src/app/api/`,
`src/lib/db/`, `src/lib/blob.ts`, `src/utilities/clientSession.ts` Last
Verified: 2026-10-05 Confidence: MEDIUM; production behavior and deployed
headers are NOT VERIFIED Owner: UNKNOWN Related Documents:
[Auth security](AUTH_SECURITY.md), [security findings](SECURITY_FINDINGS.md),
[environment variables](ENVIRONMENT_VARIABLES.md)

## Implemented Controls Observed

- Neon queries use tagged SQL template interpolation through
  `@neondatabase/serverless`; no raw query concatenation was found in the
  reviewed database code.
- Password hashes use PBKDF2-SHA256 with per-account salt and constant-time
  string comparison for equal-length values.
- Cron NAV route uses Node timing-safe comparison and fails closed when
  `CRON_SECRET` is absent. Other cron routes compare Bearer strings directly.
- Razorpay payment signature uses HMAC verification
  (`src/actions/payments/razorpaySignature.ts`) before activation, but
  order/plan binding remains a separate risk.
- Game score submission uses one-time server-created game sessions, bounded
  fields, implausible-time checks, and Redis per-owner/IP rate limits.
- Note bodies are written to private Vercel Blob paths where configured; DB
  fallback/storage also exists.
- `next.config.ts` and `vercel.json` declare HSTS, `X-Content-Type-Options`,
  `X-Frame-Options`, Referrer-Policy, Permissions-Policy, and CSP.
- `src/utilities/calculator/decimalEval.ts` implements a parser/evaluator rather
  than relying solely on arbitrary expression execution (confirm all call sites
  before asserting complete elimination of dynamic evaluation).

## Declared Browser Policy

CSP allows `unsafe-inline` and `unsafe-eval` in script sources. It permits
Google auth, Razorpay, Vercel live tooling, AMFI, World Bank, Open ER,
Shiprocket, India Post, and other declared endpoints.
`productionBrowserSourceMaps: true` is set in `next.config.ts`. These are
observed configuration choices, not proof of effective deployment headers or
source-map access controls.

## Not Established

- Security monitoring/SIEM, alerting, WAF/bot protection, centralized audit
  logs, formal vulnerability management, secrets rotation cadence, backup
  encryption, database network policy, production CSP report-only rollout, and
  incident response ownership are NOT FOUND/UNKNOWN.
- No comprehensive authorization middleware was found. Server actions/routes
  require per-operation review.
- No automated dependency vulnerability scan workflow was found in repository CI
  configuration.
- CORS behavior is not separately configured in the checked route code;
  same-origin deployment assumptions require verification.

See `SECURITY_FINDINGS.md` for prioritized evidence and recommended non-code
actions. This is not a compliance certification.
