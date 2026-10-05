# Architecture Decision Records

Status: Retrospective index Source: Current implementation/configuration and
limited Git history Last Verified: 2026-10-05 Confidence: MEDIUM; historical
motivations/dates are generally UNKNOWN Owner: UNKNOWN Related Documents:
[System design](../SYSTEM_DESIGN.md), [EDR index](../EDR_INDEX.md)

| ADR                                          | Title                                           | Status        | Date    | Evidence                                                 |
| -------------------------------------------- | ----------------------------------------------- | ------------- | ------- | -------------------------------------------------------- |
| [ADR-0001](0001-next-app-router.md)          | Next.js App Router as application shell         | Retrospective | UNKNOWN | `src/app/`, `next.config.ts`, package manifest           |
| [ADR-0002](0002-neon-runtime-migrations.md)  | Neon PostgreSQL with runtime schema migrations  | Retrospective | UNKNOWN | `src/lib/db.ts`, `src/lib/db/migrations.ts`              |
| [ADR-0003](0003-market-data-cache-layers.md) | Persisted market data with Redis/process caches | Retrospective | UNKNOWN | `src/actions/data/`, `src/lib/amfi/`, `src/lib/redis.ts` |

These ADRs record current architectural evidence, not author-confirmed
historical rationale. Alternatives/tradeoffs inferred from implementation are
explicitly labeled.
