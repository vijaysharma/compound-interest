# Deployment Guide

Status: Configuration-backed; deployment procedure partially documented Source:
`package.json`, `next.config.ts`, `vercel.json`, `src/lib/db/migrations.ts` Last
Verified: 2026-10-05 Confidence: MEDIUM; production account state UNKNOWN Owner:
UNKNOWN Related Documents: [DevOps guide](DEVOPS_GUIDE.md),
[operations runbook](OPERATIONS_RUNBOOK.md),
[disaster recovery](DISASTER_RECOVERY.md)

## Repository-Declared Deployment

Vercel is declared as the Next.js framework platform. `npm run build` runs
`next build`; `npm run start` runs `next start`. Function max duration is 30
seconds. Redirects, rewrites, headers, cache policy and two cron schedules are
in `vercel.json`.

## Release Checklist (Documentation Recommendation)

1. Review the exact source diff and test output.
2. Confirm required preview/production environment variables without revealing
   values.
3. For DB-affecting changes, snapshot/branch the database and test the runtime
   migration path.
4. Run `npm ci`, `npm test`, `npm run lint`, and `npm run build`.
5. Deploy through the repository’s authorized Vercel project workflow; exact
   approval/branch protections are UNKNOWN.
6. Verify public routes, authenticated/admin actions, external data, cron auth
   and generated metadata after deploy.
7. Observe logs and provider outcomes; retain deployment ID and rollback
   reference.

## Rollback

A Vercel rollback capability is a platform feature, but repository-specific
release rollback steps, DB rollback scripts, and responsible operators are NOT
FOUND. Treat application rollback and schema rollback separately; an app
rollback does not reverse database changes. Confirm a tested restore path before
a schema-impacting production release.
