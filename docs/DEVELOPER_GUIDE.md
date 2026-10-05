# Developer Guide

Status: Source-backed onboarding notes Source: `package.json`, `AGENTS.md`,
`src/`, `db/`, `scripts/` Last Verified: 2026-10-05 Confidence: HIGH for
commands/layout; Node version policy UNKNOWN Owner: UNKNOWN Related Documents:
[System design](SYSTEM_DESIGN.md),
[AI-agent onboarding](AI_AGENT_ONBOARDING.md),
[Definition of done](DEFINITION_OF_DONE.md)

## Prerequisites and Local Setup

- Node version is not pinned by `.nvmrc`, `.node-version`, or `engines`; use a
  version compatible with the installed Next 16/React 19/TypeScript 6
  dependencies and confirm with the maintainer.
- Package manager is npm based on `package-lock.json` and scripts.
- Install: `npm ci`.
- Configure required secrets in local environment through a secure channel; see
  `ENVIRONMENT_VARIABLES.md`. Never use values from ignored secret material in
  docs/issues.
- Start: `npm run dev`.
- Storybook: `npm run storybook`.

## Validation Commands

- `npm test`
- `npm run lint`
- `npm run build`
- `npm run build-storybook`

No mandatory CI pipeline was found, so run appropriate checks locally and record
outcomes. Database-dependent tests may skip when `DATABASE_URL` is absent;
inspect each test.

## Where to Work

- Routes: `src/app/`
- UI/views: `src/views/`, reusable UI: `src/components/`
- Server actions: `src/actions/`
- Data/domain utilities: `src/utilities/`, `src/lib/`
- Database/migrations: `src/lib/db/`, `db/`
- Global style tokens: `src/styles/`
- Existing docs: `docs/`; use `DOCUMENTATION_INDEX.md`.

Do not change financial formulas, data providers, auth boundaries, schema, or
payment behavior without explicit authorization, independent verification and
tests.
