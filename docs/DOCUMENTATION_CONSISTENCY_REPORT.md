# Documentation Consistency Report

Status: Initial cross-document consistency check Source: Generated docs and
repository source/config Last Verified: 2026-10-05 Confidence: MEDIUM; docs-only
static check, not a full semantic proof Owner: UNKNOWN Related Documents:
[Drift register](DOCUMENTATION_VS_IMPLEMENTATION_DRIFT.md),
[gap analysis](DOCUMENTATION_GAP_ANALYSIS.md), [index](DOCUMENTATION_INDEX.md)

## Checked Consistency Points

- App Router/version and package versions are consistent across system design,
  developer guide and package manifest.
- Route count is stated as 48 page files and 7 API route files; those are
  source-file counts, not production reachability.
- System design, API catalog, and product matrix distinguish the mock
  `/api/leaderboard` route from server-action scoring.
- Privacy, security findings and risk register consistently mark data-policy
  mismatch as critical and require legal review.
- PPF schema history is documented as version 17 then 18; the earlier
  missing-bump suspicion is explicitly marked disproved.
- `db/schema.sql` is labeled incomplete relative to runtime migrations.
- AI architecture and safety docs consistently describe one Gemini tax-advice
  flow and client-provided summary/question.
- Two cron schedules are declared; `sync-daily-nav` route is present but not
  scheduled in `vercel.json`.
- Financial docs distinguish deterministic historical NAV replay from assumed
  future scenarios.

## Remaining Consistency Work

- All 12 JSON inventories parse; all 48 route entries match source page files
  and derived paths.
- Maintained documentation has 0 broken local links; the legacy Shiprocket note
  retains 8 non-portable absolute `file:///` links.
- Route metadata count is 39/48 page files; dynamic and static sitemap sources
  each contain 22 entries. Route metadata/SEO policy alignment still requires
  review.
- Existing root docs require more exhaustive statement-by-statement
  reconciliation; the drift register identifies high-impact claims only.
- Live deployment/config, law/provider facts and data freshness cannot be
  consistency-checked from source alone.
