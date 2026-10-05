# Functional Requirements (Reverse-Engineered)

Status: Observed behavior statements; not approved product requirements Source:
Current routes, views, actions, tests and schema Last Verified: 2026-10-05
Confidence: HIGH for implemented observations Owner: UNKNOWN Related Documents:
[Product inventory](PRODUCT_AND_FEATURE_INVENTORY.md),
[traceability](TRACEABILITY_MATRIX.md)

These IDs describe behavior found in the repository. They do not imply customer
approval or acceptance criteria.

| ID     | Observed behavior                                                                                              | Evidence                                                         | Status                         | Gap/notes                                                 |
| ------ | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------- |
| FR-001 | Public users can access financial calculator routes and enter local inputs                                     | `src/app/**/page.tsx`, `src/views/**`                            | Implemented                    | Product acceptance requirements UNKNOWN                   |
| FR-002 | Fund tools fetch scheme/NAV information through server actions and `/api/nav`                                  | `src/actions/data.ts`, `src/app/api/nav/**`                      | Implemented                    | Freshness disclosure and provider contract partial        |
| FR-003 | Users can create password/Google accounts and obtain sessions                                                  | `src/actions/auth/**`                                            | Implemented                    | MFA/password reset lifecycle NOT FOUND                    |
| FR-004 | Usage/trial/subscription checks can block supported actions                                                    | `src/actions/auth/sessionAndUsage.ts`, `src/lib/db/userUtils.ts` | Implemented                    | Exact action coverage needs map                           |
| FR-005 | Users can initiate Razorpay or manual UPI payment and receive subscription updates after verification/approval | `src/actions/payments/**`                                        | Implemented                    | Order-plan integrity requires review                      |
| FR-006 | Admin operations can sync NAV/FII-DII and manage users/settings/Shiprocket                                     | `src/actions/admin/**`, `src/app/admin/**`                       | Implemented                    | Authorization coverage is not uniform                     |
| FR-007 | Users can persist strategies, PPF entries/preferences, notes and game scores                                   | Actions and migrations                                           | Implemented                    | Retention/delete/export rules unclear                     |
| FR-008 | Tax Pro/admin users can request Gemini tax advice when enabled/configured                                      | `src/actions/taxAi.ts`                                           | Implemented                    | Data disclosure and output correctness gaps               |
| FR-009 | Games provide seven puzzle routes and server-recorded leaderboard scores                                       | `src/views/games/`, `src/actions/gameLeaderboard.ts`             | Implemented                    | `/api/leaderboard` is mock-only                           |
| FR-010 | App publishes route metadata, sitemap, robots and security headers                                             | App metadata/robots/sitemap/config                               | Implemented                    | Crawler behavior and dynamic/static precedence unverified |
| FR-011 | User can access a broad mobile-responsive UI                                                                   | Responsive SCSS and layout                                       | Partially verified             | No device audit performed                                 |
| FR-012 | Support/account deletion requests are fulfilled                                                                | Privacy page statement                                           | Unknown                        | No deletion workflow identified for account/data          |
| FR-013 | Scheduled NAV/FII-DII ingestion executes in production                                                         | `vercel.json`                                                    | Declared, not runtime verified | Requires deployment logs/operator confirmation            |

No future/planned features were inferred. Requirements owner and acceptance
process: UNKNOWN.
