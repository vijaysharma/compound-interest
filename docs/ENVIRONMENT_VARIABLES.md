# Environment Variables

Status: Names and code consumers inventoried; requiredness is per-path Source:
`process.env` references under `src/`, `scripts/`, `next.config.ts`,
`vercel.json` Last Verified: 2026-10-08 Confidence: HIGH for source references;
deployment values/availability UNKNOWN Owner: UNKNOWN Related Documents:
[System design](SYSTEM_DESIGN.md),
[security architecture](SECURITY_ARCHITECTURE.md), [DevOps](DEVOPS_GUIDE.md)

Never place values, sample secrets, database hosts, account names, or tokens in
this document. Public-prefixed values are compiled/client-visible and must not
contain secrets.

| Name                                | Purpose/consumer                                             | Requiredness/fallback                                                    | Sensitivity                           | Failure behavior                                             |
| ----------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------- | ------------------------------------------------------------ |
| `DATABASE_URL`                      | Neon connection in `src/lib/db.ts`                           | Required for DB-backed paths                                             | Secret                                | DB actions fail                                              |
| `ADMIN_SYNC_TOKEN`                  | Alternative admin authorization in `src/lib/db/userUtils.ts` | Optional if admin session used                                           | Secret                                | Token auth disabled if missing                               |
| `ADMIN_EMAILS`                      | Server-side email allowlist/admin promotion                  | Optional; falls back to public/legacy aliases                            | Sensitive configuration, not password | No allowlist if all absent                                   |
| `NEXT_PUBLIC_ALLOWED_EMAIL`         | Google registration/admin allowlist fallback                 | Optional; public build variable                                          | Public configuration                  | Legacy behavior                                              |
| `VITE_ALLOWED_EMAIL`                | Legacy allowlist fallback                                    | Optional                                                                 | Public/legacy configuration           | Legacy behavior                                              |
| `NEXT_PUBLIC_VITE_ALLOWED_EMAIL`    | Registration component fallback                              | Optional legacy alias                                                    | Public configuration                  | Registration fallback                                        |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`      | Google Identity Services client ID                           | Required for configured Google sign-in; legacy Vite alias fallback in UI | Public identifier                     | Google UI/provider flow unavailable                          |
| `NEXT_PUBLIC_VITE_GOOGLE_CLIENT_ID` | Legacy Google client ID fallback                             | Optional                                                                 | Public identifier                     | Legacy fallback                                              |
| `CRON_SECRET`                       | Bearer auth for cron routes                                  | Required for protected cron routes                                       | Secret                                | Those handlers return 401 if absent                          |
| `UPSTASH_REDIS_REST_URL`            | Redis REST endpoint                                          | Optional; `KV_REST_API_URL` fallback                                     | Infrastructure metadata               | Memory fallback if no config/unreachable                     |
| `UPSTASH_REDIS_REST_TOKEN`          | Redis REST auth                                              | Optional; `KV_REST_API_TOKEN` fallback                                   | Secret                                | Memory fallback if no config/unreachable                     |
| `KV_REST_API_URL`                   | Legacy Upstash/Vercel KV URL alias                           | Optional                                                                 | Infrastructure metadata               | Alias fallback                                               |
| `KV_REST_API_TOKEN`                 | Legacy Upstash/Vercel KV token alias                         | Optional                                                                 | Secret                                | Alias fallback                                               |
| `BLOB_READ_WRITE_TOKEN`             | Private Vercel Blob note operations                          | Optional                                                                 | Secret                                | Blob disabled; DB path remains available per action behavior |
| `GEMINI_API_KEY`                    | Gemini tax advice                                            | Optional; AI DB key first, then Google alias                             | Secret                                | Advice returns no-key error                                  |
| `GOOGLE_API_KEY`                    | Legacy/alternate Gemini key fallback                         | Optional                                                                 | Secret                                | Advice returns no-key error                                  |
| `RAZORPAY_KEY_ID`                   | Server order creation                                        | Optional; public/Vite aliases fallback                                   | Public identifier                     | Payment creation fails if absent                             |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`       | Checkout key ID fallback                                     | Optional; public                                                         | Public identifier                     | Payment setup may fail                                       |
| `VITE_RAZORPAY_KEY_ID`              | Legacy key ID fallback                                       | Optional                                                                 | Public/legacy identifier              | Fallback only                                                |
| `RAZORPAY_KEY_SECRET`               | Order API auth/payment signature verification                | Required for Razorpay paths                                              | Secret                                | Payment actions fail                                         |

## Operational Notes

- Shiprocket no longer reads any environment variables. `SHIPROCKET_EMAIL`,
  `SHIPROCKET_PASSWORD`, `SHIPROCKET_API_TOKEN` and `SHIPROCKET_TOKEN` were
  removed with the env fallback; credentials come only from the active row in
  `shiprocket_accounts` (see the Shiprocket technical doc). Remove them from
  deployment settings.
- No `.env.example` was found in the root inventory. Required variable sets are
  not validated centrally at startup.
- `.env`, `.env.local`, and `README_SECRETS.md` exist in the local workspace
  listing; the secrets-named README is ignored by Git. Never copy its contents.
  The validity/rotation status of local values requires secure owner review.
- `VITE_*` references remain in a Next application and should be treated as
  compatibility aliases until removed through an explicit change process.
- Actual Vercel environment scope (development/preview/production), secret
  rotation, and configured values are NOT VERIFIED.
