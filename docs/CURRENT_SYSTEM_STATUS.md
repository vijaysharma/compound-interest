# Current System Status

Status: Repository snapshot; deployment state NOT VERIFIED Source: Current
repository as of 2026-10-05 Last Verified: 2026-10-05 Confidence: HIGH for
source facts; MEDIUM for completeness Owner: UNKNOWN Related Documents:
[Documentation index](DOCUMENTATION_INDEX.md),
[risk register](RISK_REGISTER.md), [gap analysis](DOCUMENTATION_GAP_ANALYSIS.md)

## Application and Architecture

- **VERIFIED:** Next.js 16 App Router, React 19, strict TypeScript, SCSS
  modules/shared Sass tokens, server actions, route handlers.
- **PARTIALLY VERIFIED:** Vercel deployment configuration exists; project
  linkage, live secrets, job execution and production build state are unknown.
- **VERIFIED:** Neon, optional Upstash Redis, Vercel Blob and multiple external
  providers are referenced by source.

## Feature and Calculation Status

- **VERIFIED:** Financial calculators, NAV-backed mutual-fund tools, FII/DII
  tracker, PPF/NPS/tax utilities, general tools, admin, notes and seven puzzle
  games exist in source.
- **PARTIALLY VERIFIED:** Formula behavior cataloged; legal/statistical
  correctness is not independently certified.
- **NOT FOUND:** Dedicated FIRE-number/Coast FIRE engine.

## Data and AI

- **VERIFIED:** AMFI, World Bank, IMF, Open ER, NSE, Yahoo Finance,
  Shiprocket, Google, Gemini, Razorpay, India Post, Vercel Blob integrations
  appear in code.
- **PARTIALLY VERIFIED:** Freshness and fallback behavior are documented;
  production data freshness/provider access is not measured.
- **VERIFIED:** One Gemini tax advice flow forwards user-provided financial
  summary/question after plan checks.

## Security, Privacy, and Testing

- **TECHNICAL RISK:** `POST /api/admin/sync-nav` has no route auth check in
  source.
- **TECHNICAL RISK:** Payment verify does not bind client-selected plan to a
  server-recorded order.
- **DOCUMENTATION/LEGAL GAP:** Privacy policy conflicts with persisted and
  externally processed data.
- **VERIFIED:** 41 source test files; `npm test` passed 287 tests across 15
  suites with zero failures on 2026-10-05. See `TEST_EXECUTION_RECORD.md`.
- **NOT VERIFIED:** No CI workflow, manual accessibility review, restore drill,
  or performance benchmark found.

## Operations

Two Vercel cron schedules are declared. `sync-daily-nav` route exists but is not
scheduled in `vercel.json`. Backup, restore, alerting, RPO/RTO, operator
ownership and staging workflows are UNKNOWN.

## Critical Risks / Human Verification

See `SECURITY_FINDINGS.md`, `FINANCIAL_CALCULATION_AUDIT.md`,
`RISK_REGISTER.md`, and `DOCUMENTATION_GAP_ANALYSIS.md`. Human review is
required for current Indian tax/PFRDA/PPF rules, privacy disclosures, production
secrets, migration state, payment order binding and deployment access.
