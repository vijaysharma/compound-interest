# ADR-0002: Neon PostgreSQL with Runtime Migrations

Status: RETROSPECTIVE ADR Date: UNKNOWN Confidence: HIGH for current
implementation; LOW for original intent Owner: UNKNOWN Supersedes: UNKNOWN
Superseded by: None identified

## Context

User, payment, notes, market data, strategies, PPF history, games, Shiprocket
and FII/DII data persist through tagged SQL queries and table migrations.

## Decision (Observed)

The app uses Neon serverless PostgreSQL through `@neondatabase/serverless`;
`ensureTables()` applies idempotent DDL/migration modules on demand based on
`schema_meta.version`.

## Alternatives

UNKNOWN historically. No ORM migration tool or separate migration deployment
pipeline is found in the current manifest/source.

## Rationale / Consequences

Runtime migration execution reduces a separate setup step but couples first
request availability to schema state and migration completion. The migration
coordinator writes the schema version before later migration modules run, and a
table rebuild may drop a legacy NAV table shape. These are current operational
risks, not assumed design intent.

## Evidence

- `src/lib/db.ts`
- `src/lib/db/migrations.ts`
- `src/lib/db/coreMigrations.ts`
- `src/lib/db/trackedSchemesMigrations.ts`
- `db/schema.sql` (incomplete relative to runtime migrations)
