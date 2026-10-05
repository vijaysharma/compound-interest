# Team Onboarding Guide

Status: Role map derived from repository boundaries Source: `src/`, `db/`,
`scripts/`, package/config files Last Verified: 2026-10-05 Confidence: MEDIUM;
named owners are UNKNOWN Owner: UNKNOWN Related Documents:
[Handover guide](HANDOVER_GUIDE.md), [Developer guide](DEVELOPER_GUIDE.md),
[Documentation index](DOCUMENTATION_INDEX.md)

| Role               | Relevant areas                                         | Responsibilities and checks                                                                                     | Common risk                                                          |
| ------------------ | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Frontend           | `src/app`, `src/views`, `src/components`, `src/styles` | Responsive behavior, semantics, route metadata, loading/error states; run lint/build and manual viewport checks | Assuming client gate is security; breaking calculator assumptions    |
| Backend            | `src/actions`, `src/app/api`, `src/lib`                | Authorization, validation, timeouts, provider failures, SQL/query tests                                         | Unauthenticated route mutation or stale fallback confusion           |
| Full-stack         | Route + view + action + utility + tests                | Trace user flow end-to-end and update API/data docs                                                             | Missing server-side authorization or persistence edge                |
| QA                 | `src/**/__tests__`, Storybook                          | Test financial boundaries, payments, auth, responsive/accessibility manually                                    | No E2E/a11y suite; no financial oracle for many formulas             |
| DevOps             | `vercel.json`, env docs, runtime migrations            | Verify env scopes, crons, migrations, backup/rollback, logs                                                     | Runtime schema gate/order and unknown restore procedure              |
| Security           | auth, payment, admin routes, CSP, secrets              | Review endpoints, token storage, secret rotation, logs, privacy                                                 | Public NAV sync route, plan binding, local secrets file              |
| Product            | `src/app`, metadata/navigation, feature inventory      | Validate feature status, disclosures and intended audience                                                      | SEO/marketing claims exceed implementation or data evidence          |
| Designer           | SCSS tokens and component stories                      | Maintain existing tokens, breakpoints, interaction affordances                                                  | Components duplicate styles; no contrast certification               |
| Data engineer      | `src/lib/amfi`, `src/lib/fiiDii`, actions/data, DB     | Validate lineage, date normalization, freshness and idempotency                                                 | No per-record provenance/fetched-at fields in many datasets          |
| AI engineer        | `src/actions/taxAi.ts`, `src/actions/tax-ai/`          | Prompt governance, user-input safety, output validation, privacy/cost                                           | Arbitrary financial summary sent to Gemini; no structured validation |
| Technical writer   | `docs/`, root docs, source refs                        | Keep evidence links/date/confidence and drift register current                                                  | Existing prose may be stale or contradicted by source                |
| Support/operations | admin screens, runbook, cron/API                       | Triage data sync and account/payment failures without exposing PII/secrets                                      | No named escalation, SLO or restore procedures                       |

All role owners are UNKNOWN until assigned by the organization.
