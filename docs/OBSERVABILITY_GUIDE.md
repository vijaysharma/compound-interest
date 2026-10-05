# Observability Guide

Status: Repository evidence inventory; production observability configuration
NOT FOUND Source: `src/**`, `vercel.json` Last Verified: 2026-10-05 Confidence:
MEDIUM Owner: UNKNOWN Related Documents:
[Operations runbook](OPERATIONS_RUNBOOK.md),
[performance architecture](PERFORMANCE_ARCHITECTURE.md)

## Observed

- Server-side failure paths use `console.warn` and `console.error` in data, DB,
  Blob, Google, Gemini, AMFI, and FII/DII modules.
- User interaction analytics helper emits GA4 custom calculator events only if
  `window.gtag` exists (`src/utilities/analytics.ts`). Production tag
  installation is UNKNOWN.
- Cron handlers return JSON counters/outcomes and elapsed milliseconds; NAV
  endpoint reports watermark and scheme counts.
- No general request correlation ID, structured logger, metrics exporter,
  distributed tracing, error-reporting SDK, health checks, alert rules, or audit
  log table was found in the inspected repository.

## Data Minimization

Logs may contain provider error bodies, URLs, or identifiers. Review redaction
before enabling centralized collection. Never log bearer tokens, secrets,
financial summaries, UTR references or Shiprocket customer PII. Logging
retention and access policy are UNKNOWN.

## Operational Gaps

Define service-level objectives, provider/cache/DB metrics, alert thresholds,
cron-missed detection, deployment correlation, sensitive-log retention and
incident owner. These are recommendations, not existing controls.
