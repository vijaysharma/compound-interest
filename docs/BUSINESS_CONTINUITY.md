# Business Continuity

Status: Initial dependency map; no approved continuity plan found Source: App
routes, provider clients, migrations, cron configuration Last Verified:
2026-10-05 Confidence: MEDIUM Owner: UNKNOWN Related Documents:
[Disaster recovery](DISASTER_RECOVERY.md), [risk register](RISK_REGISTER.md),
[operations runbook](OPERATIONS_RUNBOOK.md)

## Critical Domains and Degraded Modes

| Domain                     | Critical dependency               | Degraded behavior observed                              | Continuity gap                                                 |
| -------------------------- | --------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| Core calculator arithmetic | Browser JavaScript                | Most formulas compute locally                           | Browser compatibility/testing target UNKNOWN                   |
| Mutual-fund history        | AMFI/MFAPI, DB, Redis             | Stored NAV and scheduled refresh; source fetch can fail | Stale-age disclosure and alternate provider agreement UNKNOWN  |
| Auth/admin                 | Neon DB                           | DB unavailable breaks session checks/actions            | No offline admin/bootstrap process documented                  |
| Tax AI                     | Neon settings + Gemini            | Missing key/provider error returned                     | Manual advice fallback and provider outage procedure UNKNOWN   |
| Payments                   | Razorpay/DB or manual UPI review  | Checkout/manual workflow                                | Reconciliation/refund process UNKNOWN                          |
| Notes                      | DB + optional Blob/Redis          | DB fallback exists in some paths                        | Backup/export/restore and orphan cleanup not fully established |
| Shiprocket                 | Provider/API credentials/DB       | Provider errors and cached data may degrade operations  | Manual shipping fallback and account rotation UNKNOWN          |
| Games                      | Browser, DB/Redis for leaderboard | Core play client-side; ranked scoring can fail          | Offline score policy UNKNOWN                                   |

## Recovery Priorities

Actual business priorities are UNKNOWN. Suggested owner workshop should
identify: (1) authentication and data integrity, (2) user-facing calculations
and market-data freshness, (3) payments/admin operations, (4) notes/strategy/PPF
user data, (5) leaderboard and non-critical UI analytics. This order is a
recommendation only, not an approved priority.
