# Technical Debt Register

Status: Initial evidence-based register Source: Current source, config, test and
documentation inventory Last Verified: 2026-10-05 Confidence: MEDIUM; effort
estimates not assigned Owner: UNASSIGNED Related Documents:
[Risk register](RISK_REGISTER.md),
[documentation gap analysis](DOCUMENTATION_GAP_ANALYSIS.md)

| ID     | Type                      | Description/location                                                                             | Impact/severity  | Effort  | Recommended action                                                   | Evidence/status                                                     |
| ------ | ------------------------- | ------------------------------------------------------------------------------------------------ | ---------------- | ------- | -------------------------------------------------------------------- | ------------------------------------------------------------------- |
| TD-001 | Security defect candidate | `/api/admin/sync-nav` has no route auth                                                          | High             | UNKNOWN | Add authorization/abuse tests in separately approved code change     | Verified source                                                     |
| TD-002 | Privacy/legal gap         | Privacy page conflicts with DB/AI/analytics flows                                                | Critical         | UNKNOWN | Legal review and policy correction                                   | Verified drift                                                      |
| TD-003 | Financial correctness gap | Tax/NPS/PPF rate and rule sources are not linked/dated                                           | High             | UNKNOWN | Create authoritative source ledger and annual expert verification    | Source provenance absent                                            |
| TD-004 | Payment defect candidate  | Verified Razorpay plan not bound to a server-side order record                                   | High             | UNKNOWN | Verify securely and bind order/plan/amount/user                      | `razorpayVerify.ts`                                                 |
| TD-005 | Migration reliability     | Schema version persisted before all migration modules; NAV table shape rebuild can drop old rows | High/conditional | UNKNOWN | Atomic migrations/versioning; inspect live schema and backups        | `migrations.ts`, `dataMigrations.ts`, `trackedSchemesMigrations.ts` |
| TD-006 | Test gap                  | No dedicated tests found for EMI, FD/RD, NPS, tax, currency/inflation formulas                   | High             | UNKNOWN | Build independent numerical oracles and boundary suites              | Test inventory                                                      |
| TD-007 | Observability gap         | No metrics/tracing/alerting or operator ownership found                                          | High operational | UNKNOWN | Define SLOs, alerts, log redaction and on-call                       | Config inventory                                                    |
| TD-008 | Documentation drift       | `db/schema.sql`, API/security/privacy prose do not match full source                             | High             | UNKNOWN | Keep docs synchronized and generate/check inventories                | Drift register                                                      |
| TD-009 | Auth lifecycle gap        | LocalStorage bearer session; MFA/reset/rotation features not found                               | Medium/High      | UNKNOWN | Security review and document lifecycle requirements                  | Auth source                                                         |
| TD-010 | AI governance gap         | No response validation/source citations/rate-cost ledger; stale prompt FY string                 | High             | UNKNOWN | Tax/professional review and safety controls                          | AI source                                                           |
| TD-011 | SEO consistency           | Runtime sitemap, static sitemap and route set differ; crawler behavior unverified                | Medium           | UNKNOWN | Choose source of truth and validate generated output                 | SEO guide                                                           |
| TD-012 | Compatibility debt        | Legacy `VITE_*` aliases remain in Next source                                                    | Low/Medium       | UNKNOWN | Inventory deployments; retire only after confirmation                | Env references                                                      |
| TD-013 | API contract gap          | No OpenAPI or version policy; leaderboard HTTP route remains mock-only                           | Medium           | UNKNOWN | Mark unsupported route or align docs/clients through authorized work | API catalog                                                         |

Effort and owners remain UNKNOWN; no priority ordering beyond severity is
approved.
