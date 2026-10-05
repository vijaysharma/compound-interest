# Documentation Governance

Status: Proposed maintenance policy Source: Documentation audit and
source-of-truth hierarchy in project brief Last Verified: 2026-10-05 Confidence:
HIGH Owner: UNKNOWN Related Documents:
[Documentation index](DOCUMENTATION_INDEX.md),
[Change management](CHANGE_MANAGEMENT.md)

## Ownership and Review

- Every major doc requires a named owner; until assigned, use `OWNER: UNKNOWN`.
- Update docs in the same change as source behavior, schema, route, env,
  financial formula, provider, AI prompt, or deployment changes.
- Review financial/legal and security/privacy docs with qualified human
  reviewers; engineering authorship alone is not approval.
- Review operational docs at each deployment/platform change and at least on a
  cadence established by a future named owner.

## Evidence and Source of Truth

Priority: executable source/tests, DB migrations/schema, API implementations,
config, infrastructure, automated tests, existing docs, manifests/env names,
comments, history, human assumptions. Conflicts go into
`DOCUMENTATION_VS_IMPLEMENTATION_DRIFT.md`; implementation behavior wins, but
external law/provider facts require authoritative verification.

## ADR/EDR Policy

Create an ADR for significant architecture choices and an EDR for material
engineering tradeoffs. Use `Date: UNKNOWN` when not known; label retrospective
records. Record context, alternatives, decision, consequences, evidence,
confidence, owner and supersession. Never fabricate historical intent.

## Specialized Governance

- Formula docs include units, timing, rounding, date policy, assumptions, edge
  cases, tests and independent expected results.
- Data-source docs include endpoint/dataset, transformations,
  retrieval/effective date, cache/fallback and provider limits where verified.
- AI docs include model/provider, prompt version, inputs sent, output
  validation, privacy, disclosure, safety, error/cost behavior.
- Secrets never appear in docs or inventories; use variable names only.
- Machine-readable inventories should be deterministic and checked against
  source during change review.
