# Traceability Matrix

Status: Representative high-level traceability; not exhaustive line-by-line
trace Source: Routes, actions, utilities, migrations, and test tree Last
Verified: 2026-10-05 Confidence: MEDIUM Owner: UNKNOWN Related Documents:
[Feature inventory](PRODUCT_AND_FEATURE_INVENTORY.md),
[API catalog](API_CATALOG.md),
[database dictionary](DATABASE_DATA_DICTIONARY.md)

| Requirement/feature  | Route                                            | UI/component                        | Action/service                           | Database/external data                                                  | Tests/evidence                         | Status/gap                                         |
| -------------------- | ------------------------------------------------ | ----------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------- |
| NAV lookup           | `/api/nav/:schemeCode`, mutual-fund routes       | fund selectors/charts               | `getMutualFundNavAction`, NAV repository | AMFI -> `mutual_fund_nav`, Redis                                        | AMFI/parser/NAV tests                  | Implemented; freshness/provenance partial          |
| Account/session      | `/login`                                         | Google/password forms, AuthProvider | `src/actions/auth.ts`                    | `users`, `user_sessions`, Google tokeninfo                              | Auth tests not found in test inventory | Implemented; browser token localStorage            |
| Payment              | `/upgrade`                                       | paywall/checkout                    | `src/actions/payments.ts`                | users/payment submissions; Razorpay                                     | Payment tests not found                | Plan-order binding risk                            |
| Tax AI               | Income tax route                                 | tax strategy card                   | `generateTaxAIAdviceAction`              | user/session, `ai_settings`, Gemini                                     | No AI test found                       | Implemented; safety/privacy gaps                   |
| PPF                  | `/ppf-calculator`                                | PPF views/history modal             | `ppfHistory.ts`                          | `ppf_investments`, `ppf_preferences`; optional NAV                      | PPF calculation and comparison tests   | Implemented; legal source/provenance gaps          |
| Strategy             | `/mutual-funds/strategy`, `/strategy-calculator` | strategy editor/chart               | `strategyPersistence.ts`, data actions   | `user_strategies`, AMFI NAV                                             | many `src/views/strategy/__tests__`    | Implemented; scenarios are assumptions             |
| FII/DII              | `/fii-dii`                                       | tracker/chart/summary               | FII/DII actions; cron                    | `institutional_flows`, `index_prices`, `macro_indicators`; NSE/Yahoo/WB | no direct calculation tests found      | Implemented; fallback/provenance gaps              |
| Notes                | `/utilities/quick-notes`                         | notes manager/editor                | `src/actions/notes.ts`                   | `admin_notes`, optional Blob, Redis                                     | no direct action tests found           | Implemented; retention/privacy gap                 |
| Game score           | `/games/*`                                       | game views/hub                      | start/record/read leaderboard actions    | `game_sessions`, `game_leaderboard`, Redis                              | game and submission tests              | Implemented; public HTTP leaderboard route is mock |
| Shiprocket customers | `/admin/shiprocket-customers`                    | customer manager                    | `shiprocketCustomerManager.ts`           | Shiprocket API, `shiprocket_customers`, order link table                | cache tests only                       | Implemented; credentials/PII review                |
| Admin NAV sync       | `/api/admin/sync-nav`                            | admin sync UI                       | route handler directly                   | AMFI, tracked schemes, NAV tables                                       | no endpoint auth test                  | Source lacks auth guard; HIGH risk                 |

Complete endpoint routes and feature pages are indexed in `API_CATALOG.md`,
`PRODUCT_AND_FEATURE_INVENTORY.md`, and JSON inventories. A full
action-to-column-level trace remains a documentation gap.
