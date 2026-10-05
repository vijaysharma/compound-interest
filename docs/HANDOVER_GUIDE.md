# Handover Guide

Status: Source-backed onboarding map; production operations require owner
confirmation Source: Repository architecture and current documentation set Last
Verified: 2026-10-05 Confidence: MEDIUM Owner: UNKNOWN Related Documents:
[Project master map](PROJECT_MASTER_MAP.md),
[Developer guide](DEVELOPER_GUIDE.md),
[Documentation index](DOCUMENTATION_INDEX.md)

## First Day

1. Read `AGENTS.md`, this index, system design, current status and security
   findings.
2. Install dependencies with `npm ci`; use the commands in `DEVELOPER_GUIDE.md`.
3. Obtain environment configuration from the authorized secret manager/owner. Do
   not inspect or copy ignored secret files into tickets or docs.
4. Identify whether the task is financial, data, AI, admin, game, or platform
   work before editing.
5. Run baseline tests/lint/build and record failures before making changes.

## How the System Works

Next App Router routes load React views; client shell provides
auth/sidebar/navigation. Server actions and API routes own persistence, external
calls, admin sync and score submission. Neon is primary persistence, Upstash is
optional cache, Blob is used for notes, and upstream providers supply NAV,
macro, index, identity, AI, payment and logistics data.

## Critical Domains

- Financial formulas: `FINANCIAL_CALCULATION_CATALOG.md`; any change requires
  independent expected values and domain review.
- Market data: `DATA_SOURCES_AND_PROVENANCE.md`; verify dates, source, freshness
  and fallback before interpreting results.
- Security/privacy: review `SECURITY_FINDINGS.md`; current privacy notice
  conflicts with actual data flows.
- Database: inspect current production schema/version; `db/schema.sql` is
  incomplete and migration ordering requires care.
- AI: only tax-advice Gemini flow found; client financial summary is sent
  externally.
- Admin: every mutation needs server-side authorization review;
  `/api/admin/sync-nav` is flagged.
- Games: client gameplay plus server session/time/score checks;
  `/api/leaderboard` is a mock API.

## Production Takeover Questions

Before taking operational ownership, obtain named contacts and verified
access/rotation procedures for Vercel, Neon, Upstash, Blob, Google, Gemini,
Razorpay, Shiprocket and data providers. Confirm backups, restores, cron
execution, alerts, deployed environment variables, release approvals, tax/legal
reviewers and privacy obligations. All are REQUIRES HUMAN CONFIRMATION.

## What Not to Change Casually

Do not alter tax/PPF/NPS formulas, NAV migration or table shape, auth/session
tokens, payment verification, admin routes, data providers, Redis consistency
semantics, or AI prompt/data fields without review, tests and explicit
authorization.
