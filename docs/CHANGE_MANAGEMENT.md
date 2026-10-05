# Change Management

Status: Recommended repository-specific process; not an existing approved policy
Source: Domain boundaries and risks in this repository Last Verified: 2026-10-05
Confidence: HIGH that the procedure addresses observed risk Owner: UNKNOWN
Related Documents: [Definition of done](DEFINITION_OF_DONE.md),
[ADR index](adr/README.md), [EDR index](EDR_INDEX.md)

## Required Sequence

1. State the user/business request and separate explicit constraints from
   assumptions.
2. Locate route, view, action, utility, schema, config and tests that own the
   behavior.
3. Read nearby repository instructions and relevant installed framework docs
   before framework changes.
4. Identify whether the change touches financial calculations, sourced data,
   personal data, auth/admin, AI, payment, schema, external services or
   deployment.
5. Write expected inputs/outputs, failure paths and evidence before
   implementation.
6. For financial work, independently calculate expected outputs and obtain
   qualified review for law-sensitive rules.
7. For data changes, document source URL, units, effective date, freshness,
   transformations, cache and fallback.
8. For security/AI/privacy work, threat-model authorization, input trust,
   disclosure and logging.
9. Make the smallest authorized change; do not silently modify adjacent
   behavior.
10. Add focused tests and run lint/build as appropriate; record
    unavailable/failed checks.
11. Update relevant docs/inventories, ADR/EDR and schema/data lineage.
12. Verify deployment, migration/rollback plan and operational signals before
    release.

## Change Control

Do not force-push, rewrite history, rotate production secrets, run destructive
migrations, or deploy without explicit owner authorization. Existing user
changes must be preserved. UNKNOWN items remain explicit.
