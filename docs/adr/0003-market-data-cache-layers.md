# ADR-0003: Persisted Market Data with Cache Layers

Status: RETROSPECTIVE ADR Date: UNKNOWN Confidence: HIGH for current design;
MEDIUM for intended tradeoffs Owner: UNKNOWN Supersedes: UNKNOWN Superseded by:
None identified

## Context

Mutual-fund NAV, exchange-rate, PPP/IMF, Shiprocket and other data are
repeatedly fetched or queried by interactive server actions and cron workers.

## Decision (Observed)

The implementation uses PostgreSQL for durable application data, Upstash Redis
REST where configured, and process-local maps as fallback/hot caches. AMFI/NAV
helpers add single-flight gates, freshness checks, cooldowns, bounded
concurrency and background refresh behavior.

## Alternatives

UNKNOWN historically. No queue, dedicated data service, or persistent Redis
client is found in current source.

## Rationale / Consequences

The code comments cite serverless connection constraints and
latency/redundant-fetch concerns. Upstash is cross-instance when available;
memory fallback is per process and cannot guarantee distributed locks,
freshness, or rate limiting. Cache freshness and stale disclosure differ by
dataset.

## Evidence

- `src/lib/redis.ts`, `src/lib/redis/upstashClient.ts`,
  `src/lib/redis/memoryStore.ts`
- `src/actions/data/constants.ts`, `src/actions/data/navSync.ts`
- `src/lib/amfi/`
- `src/lib/shiprocketCache.ts`
