---
name: refactoring
description: >-
  Systematic, verifiable refactoring guide for Happy Finance. Use when
  restructuring routes, migrating styles to SCSS modules, extracting
  components/utilities, reorganizing modules, or executing
  targeted/repository-wide pattern migrations.
---

# Refactoring Workflow

Use this skill when restructuring code without altering existing business logic,
public API contracts, or financial calculations.

> **Behavior Preservation Invariant**: Refactoring must preserve existing
> functionality, error handling, authorization, and precision unless behavioral
> changes are explicitly requested.

---

## 1. Safety Guardrails

- **Zero Speculative Abstractions**: Do not introduce wrapper layers, utility
  files, or helper functions without demonstrated need.
- **Strict Typing**: Maintain strict TypeScript; never bypass with `any`,
  `@ts-ignore`, or unsafe casts.
- **Design System Tokens**: Static styles belong in SCSS modules consuming CSS
  tokens (`src/styles/`). `style={{ ... }}` is permitted only for dynamic
  runtime CSS variables.
- **Clean Slices**: Do not mix unrelated feature work, bug fixes, or stylistic
  changes into a refactoring diff.

---

## 2. Refactoring Protocol

1. **Define Target State**: Distinguish pure structural refactoring from changes
   affecting user-visible behavior.
2. **Establish Baseline**: Confirm a clean working tree (`git status`) and
   verify existing tests pass (`pnpm test`). Note any pre-existing failures.
3. **Incremental Migration**: Execute bottom-up: types/schemas →
   utilities/services → components → routes.
4. **Preserve Telemetry & Errors**: Ensure `serverLogger` statements and error
   boundaries remain functional.
5. **Verify Completeness**: Re-run searches (`git grep`) to confirm old patterns
   are completely eliminated and zero dead code remains.

---

## 3. Specialized Scenarios

### Scenario A: Route & Directory Restructuring (App Router)

- Moving folders alters URLs unless wrapped in route groups `(groupName)`.
- If moving protected pages under `app/(protected)`, register route prefixes in
  `PROTECTED_ROUTE_PREFIXES` in `src/lib/auth/route-access.ts` and update
  `route-access.test.ts`.
- Update centralized route constants in `src/config/routes.ts` (`AppRoutes`) and
  navigation in `navigation.contract.tsx`.
- Never leak server modules (`@happy-finance/database`, `server-only`) into
  client components.

### Scenario B: Removing Inline Styles & SCSS Module Migration

- Move static styles to `*.module.scss` using design tokens from
  `src/styles/tokens/palette.json`.
- Retain `style={{ "--fill-w": `${pct}%` }}` only for continuous runtime CSS
  variables.
- Run `pnpm tokens:check` and `pnpm governance:validate` to ensure zero token
  violations.

### Scenario C: Component Extraction & Placement

- Placement hierarchy:
  - Feature-specific: `src/features/<feature>/components/`
  - Cross-feature shared layout/finance: `src/shared/<category>/`
  - Design system primitives: `@happy-finance/ui` (`src/packages/ui/`)
  - Financial domain helpers: `src/packages/shared-utils/financial/`
- Interactive elements must use `@happy-finance/ui` primitives (never native
  HTML controls).
- Verify responsive rendering at 390px (mobile) and ≥1280px (desktop).

### Scenario D: Module Boundaries & Circular Imports

- Dependency rule: Features may import packages, shared components, and core
  libraries. Features must **not** import private internal modules from other
  features.
- Avoid circular references across services, actions, and UI slices.

### Scenario E: Repository-Wide Pattern Migration

- Exclude `node_modules/`, `.git/`, `.next/`, and generated files
  (`_palette.generated.scss`).
- Migrate in verified batches (packages → lib → features → app). Validate each
  batch with `pnpm type-check`.

---

## 4. Verification & Reporting

Verify all Definition of Done gates:

```bash
pnpm type-check
pnpm lint
pnpm test
pnpm governance:validate
```

### Report Checklist

- **Scope & Refactored Target**: Boundaries affected.
- **Preserved Invariants**: Confirmation that behavior, contracts, and tests
  remained unchanged.
- **Verification Outcomes**: Exact results for type-check, lint, test suites,
  and governance validation.
