# Database Architecture

Status: Source-backed, live schema NOT VERIFIED Source: `src/lib/db.ts`,
`src/lib/db/migrations.ts`, `src/lib/db/*Migrations.ts`, `db/schema.sql` Last
Verified: 2026-10-05 Confidence: HIGH for migration source; MEDIUM for deployed
schema Owner: UNKNOWN Related Documents:
[Data dictionary](DATABASE_DATA_DICTIONARY.md), [ERD](DATABASE_ERD.md),
[system design](SYSTEM_DESIGN.md), [API catalog](API_CATALOG.md)

## Engine and Access

The application uses Neon PostgreSQL through `@neondatabase/serverless`.
`DATABASE_URL` is the connection entry point. `getDb()` constructs a Neon SQL
tagged-template client; `ensureTables()` applies runtime migrations. Query
interpolation is used throughout inspected actions. Exact production region,
pooling configuration, backup/PITR plan, retention, and access policy are
UNKNOWN.

## Migration Orchestration

`src/lib/db/migrations.ts` declares `SCHEMA_VERSION = 18`. On first use in a
process, `ensureTables()` reads `schema_meta`; if the version is already at
least 18, it returns without running migrations. Otherwise it runs, in order:
`applyCoreMigrations`, `applyDataMigrations`, `applyTrackedSchemesMigrations`,
`applyStateAndLeaderboardMigrations`, then `applyFiiDiiMigrations`.

Important behavior:

- `applyDataMigrations()` writes `schema_meta.version` before the remaining
  migration groups run. If a later group fails, a subsequent call can see
  version 18 and skip unfinished migrations. **Conditional migration integrity
  risk**; no migration transaction spans all groups in the source.
- `applyTrackedSchemesMigrations()` drops `mutual_fund_daily_nav` view/table. If
  `mutual_fund_nav` lacks a `date` column, it drops that table and recreates it
  with `(scheme_code,date)` rows. The migration source does not visibly copy
  JSON payload rows before dropping. **Potential data-loss risk for databases
  with legacy blob-shaped NAV rows**; live database shape and whether the
  migration has already run must be confirmed before any replay.
- PPF schema was introduced with schema version 17; schema advanced later to 18.
  The audit's initial missing-version-bump suspicion was disproved by Git
  history.
- Runtime migration DDL is not represented completely by `db/schema.sql`; the
  TypeScript migrations are the current source of truth for app-managed
  structures.

## Storage/Access Patterns

- Financial/account records: PostgreSQL.
- Mutual fund NAV: normalized daily rows in the tracked-scheme migration path;
  legacy code also creates a JSON payload shape before the tracked migration
  transforms/replaces the table. Confirm deployed shape before operational
  changes.
- Hot/cacheable payloads: Redis facade using Upstash REST plus process-local
  fallback; cache is not durable storage.
- Quick Notes: metadata and `content` column in `admin_notes`; note handlers
  also integrate private Vercel Blob. Do not assume Blob is the only body store.
- User strategies: one row per strategy with JSON config and tombstones
  (`deleted_at`) for merge behavior.
- PPF investments and preferences: user or guest identifiers; no FK exists for
  guest IDs.

## ERD Summary

See [DATABASE_ERD.md](DATABASE_ERD.md) for Mermaid. Foreign-key relationships
visible in migration source include session/payment rows to `users`, mutual NAV
to schemes in the initial payload schema, strategies to users, PPF user rows to
users, and cascade deletion in those declared relationships. Several operational
tables intentionally have no FK to users because owners can be guests or
identifiers are external.

## Operational Requirements and Gaps

- Back up/branch the database before migration changes; test migrations against
  a sanitized production-like copy.
- Record deployed `schema_meta.version` and `mutual_fund_nav` columns before
  assuming migration state.
- A version number is not proof every migration function completed because the
  version write occurs before later groups.
- No rollback migration framework, automated schema-diff gate, restore drill, or
  database ownership/runbook was found. These are DOCUMENTATION/OPERATIONS GAPS.
- `db/schema.sql` currently lists a small subset and is not a complete bootstrap
  snapshot.
