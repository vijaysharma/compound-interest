# Data Privacy and Governance

Status: Source-based data map; legal/privacy review REQUIRED Source:
`src/views/privacy.tsx`, `src/actions/auth/**`, PPF/strategy/notes/payment
actions, `src/actions/taxAi.ts`, `src/lib/db/`, `src/lib/blob.ts`,
`src/utilities/clientSession.ts` Last Verified: 2026-10-05 Confidence: HIGH for
code-observed flows; LOW for deployed processor/retention configuration Owner:
UNKNOWN Related Documents: [Security findings](SECURITY_FINDINGS.md),
[AI architecture](AI_ARCHITECTURE.md),
[environment variables](ENVIRONMENT_VARIABLES.md)

## Data Observed in Source

| Data                                                        | Collection/storage path                                           | External sharing                                                                      | Classification                                                                    |
| ----------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Account email/name/picture/provider/role/subscription/usage | `users`, Google token/user actions                                | Google OAuth verification receives credential; Gemini only if included in prompt data | Personal/account data                                                             |
| Password hash and salt                                      | `users`                                                           | No external pass-through found                                                        | Authentication secret material                                                    |
| Session bearer token                                        | `user_sessions`; browser `localStorage`                           | Sent with server actions by client                                                    | Credential                                                                        |
| PPF investments, dates, amount, notes/preferences           | `ppf_investments`, `ppf_preferences`; user or guest owner         | Not inherently sent externally; user can also send financial summary to AI            | Sensitive financial data                                                          |
| Saved mutual-fund strategies/config                         | `user_strategies`, local strategy storage                         | NAV data queries go to app/AMFI; strategy persistence server-side                     | Financial preference/portfolio data                                               |
| Notes metadata/body                                         | `admin_notes`; optionally private Blob; Redis caching in handlers | Blob provider; backup/export user workflow                                            | Potentially personal/sensitive free text                                          |
| Payment UTR/amount/email/payment IDs                        | `payment_submissions`, `users`                                    | Razorpay order/payment API for card/checkout flow                                     | Financial transaction/personal data                                               |
| Shiprocket customer address/contact/order links             | Shiprocket API and customer/order tables                          | Shiprocket provider; API data originated there                                        | Third-party customer PII                                                          |
| Tax AI summary/question/output                              | Request body passed to Gemini; output returned to browser         | Google Gemini API                                                                     | Highly sensitive financial/tax data                                               |
| Guest identifier                                            | Browser `localStorage`, sent to PPF/game actions                  | App server                                                                            | Pseudonymous identifier; generated with `Math.random` for PPF/game guest identity |
| Analytics events                                            | `window.gtag` if installed                                        | GA4 if configured                                                                     | Usage metadata; production tag state UNKNOWN                                      |

## Policy Drift

`src/views/privacy.tsx` says the app collects no personal/financial data, uses
no third-party analytics, and stores only email for optional accounts. This
conflicts with database-backed account profile, usage, subscription, PPF,
strategy, notes, payments and Shiprocket data; AI transmission; and a GA4 event
helper. It also says auth cookies exist while source stores the session token in
localStorage. This is a CRITICAL disclosure/documentation/legal issue. Do not
rely on this policy as an accurate data inventory without human review.

## Governance Unknowns

- Retention periods, deletion fulfillment, account export, backup deletion,
  data-subject handling, production Blob access, provider DPAs/retention,
  region/transfer, and database encryption/backup details: UNKNOWN.
- `README_SECRETS.md` is ignored by Git but present locally and contains
  credential-like material; no values are copied here. Owner must securely
  establish validity and rotate if live.
- The disclaimer is educational-purpose-only text, not proof of regulatory
  status or legal sufficiency.

This document is an engineering inventory, not legal advice or a compliance
statement. Require legal/privacy counsel to validate disclosures and
jurisdictional duties.
