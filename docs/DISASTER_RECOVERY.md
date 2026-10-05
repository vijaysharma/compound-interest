# Disaster Recovery

Status: Capability inventory; no tested recovery plan found Source:
`vercel.json`, Neon/Blob/Redis integrations, database migrations Last Verified:
2026-10-05 Confidence: LOW for provider-level capability; HIGH that repo
runbooks are absent Owner: UNKNOWN Related Documents:
[Business continuity](BUSINESS_CONTINUITY.md),
[operations runbook](OPERATIONS_RUNBOOK.md),
[database architecture](DATABASE_ARCHITECTURE.md)

## Current Evidence

- App deploy target is declared as Vercel. Database client targets Neon; note
  storage uses Vercel Blob; optional cache uses Upstash.
- No repository-defined backup schedule, restore script, RPO/RTO, database
  export automation, Blob inventory/restore procedure, secret escrow, or tested
  rollback is documented.
- Runtime migrations and potential NAV table rebuild make database
  backup/restore validation especially important.

## Recovery Scenarios Requiring Human Procedure

| Incident                             | Repository fallback                                                       | Missing recovery evidence                                         |
| ------------------------------------ | ------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Neon outage/data loss                | Some handlers use cache/default data; DB-backed auth/notes/PPF/admin fail | Backup frequency, PITR, restore owner, integrity checks           |
| Upstash outage                       | Process-local cache fallback                                              | Cross-instance degraded behavior and recovery monitoring          |
| Blob outage                          | Note paths can use DB content/fallback in some operations                 | Exact completeness, orphan reconciliation, restore test           |
| AMFI/World Bank/IMF/NSE/Yahoo outage | Stored/default/fallback behavior varies by dataset                        | Last-known-good guarantee and user disclosure SLO                 |
| Vercel deployment failure            | Platform rollback may exist                                               | Release-specific rollback steps and DB compatibility              |
| Secret compromise                    | No rotation procedure in repo                                             | Provider owner, rotation order, incident logs/notification duties |
| Gemini/Razorpay/Shiprocket outage    | Some paths return controlled errors; admin workflows degrade              | Manual fallback, reconciliation and notification process          |

RPO, RTO, backup retention, restore test cadence and incident commander: UNKNOWN
/ REQUIRES HUMAN CONFIRMATION.
