# Operations Runbook

Status: Initial source-derived procedures; production contacts and dashboards
UNKNOWN Source: `vercel.json`, `src/app/api/cron/**`,
`src/lib/db/migrations.ts`, `src/lib/redis.ts` Last Verified: 2026-10-05
Confidence: MEDIUM Owner: UNKNOWN Related Documents:
[Admin operations](ADMIN_OPERATIONS_GUIDE.md),
[observability](OBSERVABILITY_GUIDE.md),
[disaster recovery](DISASTER_RECOVERY.md)

## Routine Checks

- Confirm deployed app health and route smoke tests after releases; no health
  endpoint beyond `/api/nav` status data is established.
- Check `/api/nav` watermark and scheme counts after NAV sync; the route can
  return zero counts if DB queries fail.
- Check Vercel cron logs for `/api/cron/sync-nav` and `/api/cron/sync-fii-dii`;
  schedules are declarations, not proof of execution.
- Check nested `results` from FII/DII sync for partial provider failures even
  when top-level status is 200.
- Confirm Redis configured/degraded status from platform configuration;
  process-memory fallback does not coordinate instances.

## Incident First Response

1. Record timestamp, route, request ID/deployment ID if available, and
   non-sensitive error summary.
2. Do not capture tokens, session IDs, API keys, customer addresses, UTR values
   or AI prompts in tickets.
3. Separate app, DB, cache, and upstream-provider failures; consult
   source-specific fallback behavior in `DATA_FRESHNESS.md`.
4. For auth/payment/security incidents, preserve relevant provider/deployment
   logs and notify the responsible security/operations owner (currently
   UNKNOWN).
5. For database migration errors, stop repeated deploy retries until live
   `schema_meta` and table shape are checked against `DATABASE_ARCHITECTURE.md`.
6. Roll back application only after assessing schema compatibility; restore
   procedure is UNKNOWN and requires database owner.

## Manual Admin Sync

Use only an authorized admin UI/action or cron invocation. `/api/admin/sync-nav`
is currently unauthenticated in source and should not be used as an operational
shortcut until the security issue is addressed. Do not place `CRON_SECRET` in
URLs.

No escalation contacts, alert thresholds, SLOs, or incident severity policy were
found. HUMAN CONFIRMATION required.
