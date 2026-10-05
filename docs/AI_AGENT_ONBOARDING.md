# AI Agent Onboarding

Status: Repository-specific change rules Source: `AGENTS.md`, current code and
documentation audit Last Verified: 2026-10-05 Confidence: HIGH for repository
constraints Owner: UNKNOWN Related Documents:
[Change management](CHANGE_MANAGEMENT.md),
[Definition of done](DEFINITION_OF_DONE.md),
[Documentation index](DOCUMENTATION_INDEX.md)

## Repository Rules

- Inspect current source, nearby tests, configuration and docs before editing.
  The repo uses Next 16 conventions; `AGENTS.md` requires consulting installed
  Next docs before writing application code.
- Preserve existing ownership boundaries and public APIs. Do not convert
  assumptions into facts.
- Do not modify production behavior during documentation-only work.
- Never expose secrets. Do not read/copy secret values into generated
  documentation; `.env*` and `README_SECRETS.md` are ignored local material.

## Financial Rules

- Never alter financial calculations without explicit authorization,
  source-backed formula notes, independent expected-value calculation, boundary
  tests and qualified review for tax/PFRDA/PPF law.
- Record units, rate basis, compounding, cash-flow timing, timezone/date basis,
  rounding, and fallback behavior.
- Distinguish historical observed NAV from assumed forward scenarios and from AI
  interpretation.

## Data, Security, and AI Rules

- Preserve provider/source provenance and freshness; never claim official
  approval without evidence.
- Treat user text and API responses as untrusted; never add secrets to
  URLs/logs.
- Trace server-side authorization; a hidden/client-gated page is not an
  authorization boundary.
- For AI, document model/provider, prompt version, fields sent, validation,
  privacy and failure behavior. Do not claim AI output is authoritative.

## Verification and Definition of Done

Use `npm test`, `npm run lint`, and `npm run build` as relevant. Update
docs/inventories when routes, actions, schema, env vars, formulas, providers, AI
data flows, deployment, or permissions change. Add or update focused tests.
Report checks not run and classify unresolved facts UNKNOWN/NOT VERIFIED.

## Forbidden Without Explicit Authorization

No dependency upgrades, schema/API behavior changes, formula changes, security
control changes, source-provider changes, UI redesign, secret rotation,
deployment or production operations. Document recommendations instead of
implementing them.
