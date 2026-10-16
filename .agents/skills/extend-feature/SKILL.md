---
name: extend-feature
description: >-
  Systematic guide for adding functionality to an existing feature or expanding
  an established workflow in Happy Finance without rewrites. Use when adding
  table filters, sorting, pagination, form fields, metrics, API parameters, or
  mobile views while preserving existing behaviors and contracts.
---

# Extend Feature Workflow

Use this skill when extending or expanding an existing feature or user workflow.

**Core Principle**: Understand the existing implementation, define the extension
boundary, implement only the necessary additions, and preserve all unrelated
behavior, contracts, and tests.

> **Boundary Rule**: For entirely new standalone modules with no existing slice,
> use [`feature-implementation`](../feature-implementation/SKILL.md). For defect
> diagnosis and repair, use
> [`bug-investigation`](../bug-investigation/SKILL.md). For structural cleanup
> without feature additions, use [`refactoring`](../refactoring/SKILL.md).

---

## 1. Safety & Architecture Guardrails

Adhere strictly to [`AGENTS.md`](../../AGENTS.md):

1. **Boundary Discipline**: Scope modifications strictly to the targeted slice
   under `src/features/<feature>/`. Do not rebuild working code or create
   parallel implementations.
2. **Architecture Compliance**: Single Next.js 15 App Router app; single-level
   navigation via in-page `SectionTabs`; all uploads routed through `/uploads`.
3. **Design System**: Use `@happy-finance/ui` primitives (never native HTML
   controls); design tokens from `src/styles/tokens/palette.json`; inline styles
   limited strictly to dynamic CSS variables.
4. **Data Isolation**: All operations scoped strictly to server-side
   `session.userId`.
5. **Precision Invariant**: Maintain minor units (paise) or Decimal math
   (`src/packages/shared-utils/financial/decimal.ts`).

---

## 2. Investigation Protocol (Inspect Before Implementing)

Never assume behavior matches documentation; live code and tests are ground
truth.

1. **Locate Feature Assets**:
   - Feature slice: `src/features/<feature>/` (components, services, actions).
   - API routes: `src/app/api/v1/<feature>/`.
   - Schemas & Types: `src/packages/schemas/` and `src/packages/types/`.
   - Persistence: `prisma/schema.prisma`.
2. **Trace Contracts & Data Flow**:
   - Trace existing input parameters, query strings, and response shapes.
   - Trace state management, hooks, and data-fetching triggers.
   - Run existing feature tests (`pnpm test src/features/<feature>/`).
3. **Establish Invariants & Acceptance Criteria**:
   - Identify existing behavior that must remain completely untouched.
   - Define concrete, testable criteria for the new capability.
   - If material ambiguity exists, ask a focused clarification; otherwise
     proceed using established repository patterns.

---

## 3. Domain & UI Extension Rules

### 3.1 Financial Domain Invariants

- Consult [`financial-calculations`](../financial-calculations/SKILL.md) when
  altering math or aggregations.
- Preserve formulas, rounding, and units. Never substitute metrics (e.g.
  absolute return vs XIRR vs CAGR).
- Ensure filtering, sorting, or pagination does not corrupt underlying financial
  metrics (e.g. page subtotal vs dataset total).

### 3.2 Data Integrity & Security

- Consult [`api-database-schema`](../api-database-schema/SKILL.md) for schema or
  migration changes.
- Consult [`security-sensitive-changes`](../security-sensitive-changes/SKILL.md)
  when touching sensitive flows.
- Preserve backward compatibility for existing records and API callers.
- Ensure sensitive fields (PAN, account numbers) remain encrypted at rest and
  masked in UI.

### 3.3 UI/UX & Responsive Parity

- Consult [`ui-ux-responsive`](../ui-ux-responsive/SKILL.md).
- Preserve existing information hierarchy; avoid visual clutter.
- Verify parity: dense scrollable table with sticky header/footer on desktop
  (≥1280px) and responsive stacked card layout on mobile (390px).
- Provide complete UI states: loading, empty, error banners, and disabled
  buttons.

---

## 4. Incremental Implementation Flow

Implement through existing layers in order:

1. **Schemas & Types**: Extend Zod schemas and TypeScript types with optional or
   backward-compatible properties.
2. **Persistence & Migrations**: Update `prisma/schema.prisma` and generate
   migrations if schema changes are required.
3. **Service & Queries**: Extend query builders/services to support new
   parameters while preserving default query paths.
4. **API Route Handlers**: Update route handlers under
   `src/app/api/v1/<feature>/` with parameter validation.
5. **UI Integration**: Extend existing components rather than cloning parallel
   trees. Connect filters, pagination, or form inputs to queries.

---

## 5. Verification & Completion

1. **Targeted Tests**: Run and extend feature tests
   (`pnpm test src/features/<feature>/`). Verify pre-existing tests continue to
   pass.
2. **Repository Gates**: Run `pnpm type-check`, `pnpm lint`, `pnpm test`, and
   `pnpm governance:validate`.
3. **Documentation**: Update `CHANGELOG.md` under `[Unreleased]` and governance
   logs when contracts change.

### Completion Report Schema

Provide a concise summary:

- **Feature Extended**: Target component/route.
- **Capability Added**: Terse description of additions.
- **Contracts Preserved**: Existing behaviors confirmed green.
- **Verification Outcomes**: Exact results for type-check, lint, test, and
  governance validation.
