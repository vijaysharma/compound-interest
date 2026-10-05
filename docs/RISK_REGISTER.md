| R-14 | Security | `getShiprocketAuth`/`shiprocketFetch` wrappers in a
`'use server'` module have no explicit auth and handle credentials/arbitrary
upstream calls | Low/unknown because no client references in source/local client
bundle | Critical if callable | HIGH conditional | Confirm production action
registration; if reachable, add auth, endpoint allowlist and secret-safe
response | UNASSIGNED | Human confirmation |

Probability/impact are qualitative initial assessments, not measured production
metrics.

# Risk Register

Status: Initial source-evidence register; no production risk workshop performed
Source: Repository code/config/docs and test inventory Last Verified: 2026-10-05
Confidence: MEDIUM; probability and production exposure are not measured Owner:
UNASSIGNED Related Documents: [Security findings](SECURITY_FINDINGS.md),
[financial audit](FINANCIAL_CALCULATION_AUDIT.md),
[technical debt](TECHNICAL_DEBT_REGISTER.md)

| ID   | Category              | Risk                                                                                                    | Probability                                    | Impact           | Level       | Mitigation/recommendation                                                                 | Owner      | Status                                |
| ---- | --------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------------- | ----------- | ----------------------------------------------------------------------------------------- | ---------- | ------------------------------------- |
| R-01 | Security/availability | Unauthenticated `/api/admin/sync-nav` can trigger writes and upstream work                              | Medium; endpoint appears public in source      | High             | HIGH        | Add route-level auth and abuse controls; review logs                                      | UNASSIGNED | Open; requires authorized code change |
| R-02 | Privacy/legal         | Policy materially understates stored and externally transmitted user data                               | High; source contradicts policy                | Critical         | CRITICAL    | Legal/privacy review; correct disclosures/retention/processor inventory                   | UNASSIGNED | Open                                  |
| R-03 | Payments/integrity    | Client-supplied plan during verification is not bound to a server-recorded order plan/amount            | Medium                                         | High             | HIGH        | Bind user/order/amount/currency/plan; validate against Razorpay server data               | UNASSIGNED | Potential defect                      |
| R-04 | Financial correctness | Tax/PFRDA/PPF rules are hardcoded without official sources or continuous update process                 | High over time                                 | High             | HIGH        | Independent professional validation and dated source ledger                               | UNASSIGNED | Open                                  |
| R-05 | AI                    | Gemini may produce unsupported/outdated tax advice from arbitrary client summary/question               | Medium                                         | High             | HIGH        | Input allowlist, disclosure, source validation, reviewed prompts, cost/rate controls      | UNASSIGNED | Open                                  |
| R-06 | Data integrity        | DB migration coordinator stores target schema version before later migration groups finish              | Low-to-medium conditional on migration failure | High             | MEDIUM-HIGH | Make migrations atomic or advance version only after all steps; rehearse failure recovery | UNASSIGNED | Conditional source risk               |
| R-07 | Data integrity        | Legacy NAV table rebuild can drop payload-shaped `mutual_fund_nav` without visible row conversion       | Unknown until production schema checked        | Critical         | HIGH        | Inspect live schema/data; backup and dry-run migration                                    | UNASSIGNED | Human confirmation required           |
| R-08 | Security/privacy      | LocalStorage bearer token increases impact of XSS; CSP allows unsafe inline/eval                        | Medium                                         | High             | HIGH        | Threat model, reduce script allowances, review session storage design                     | UNASSIGNED | Open                                  |
| R-09 | Secrets               | Ignored local secret material exists and contains credential-like values                                | Unknown validity                               | Critical if live | HIGH        | Securely confirm validity and rotate/revoke if real; inspect history/backups              | UNASSIGNED | Human confirmation required           |
| R-10 | Data freshness        | IMF stored payload path lacks DB-age check; fallback result may be empty without clear stale disclosure | Medium                                         | Medium           | MEDIUM      | Define freshness contract and surface source/effective date                               | UNASSIGNED | Open                                  |
| R-11 | Availability          | Process memory Redis fallback does not coordinate serverless instances                                  | Medium when Redis absent/down                  | Medium           | MEDIUM      | Surface degraded state; avoid using fallback for correctness-critical distributed limits  | UNASSIGNED | Open                                  |
| R-12 | Operations            | No checked-in CI workflow, restore runbook, alert policy or owner mapping found                         | Medium                                         | High             | HIGH        | Assign owners, document/test backup/deploy/rollback/alert procedures                      | UNASSIGNED | Open                                  |
| R-13 | Dependency            | `productionBrowserSourceMaps: true` and legacy Vite env aliases may be unintended                       | Low/unknown                                    | Medium           | LOW-MEDIUM  | Verify production source-map access and eliminate aliases only through approved change    | UNASSIGNED | Review                                |

Probability/impact are qualitative initial assessments, not measured production
metrics. Deployment exposure and owners require human confirmation.
