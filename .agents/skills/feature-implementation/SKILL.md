---
name: feature-implementation
description: >-
  Guide for implementing a genuinely new feature or standalone subsystem from
  scratch in Happy Finance. Use when creating new pages, major domain slices, or
  net-new business flows.
---

# Feature Implementation Workflow

Use this skill when implementing a new standalone feature or greenfield
subsystem.

> **Boundary Rule**: For adding functionality, filters, columns, or metrics to
> an existing screen or feature, use
> [`extend-feature`](../extend-feature/SKILL.md).

---

## 1. Architecture Guardrails

Adhere strictly to [`AGENTS.md`](../../AGENTS.md):

- Single Next.js 15 App Router app (Neon Singapore `ap-southeast-1`, Vercel
  `sin1`).
- Navigation: Single-level in
  `src/shared/layouts/navigation/navigation.contract.tsx`; in-page sub-views use
  `SectionTabs`.
- Protected routes: Register new protected top-level sections in
  `PROTECTED_ROUTE_PREFIXES` in `src/lib/auth/route-access.ts`.
- File uploads: Route all file ingestion through `/uploads`.
- Design system: Use `@happy-finance/ui` primitives (never native HTML
  controls), strict tokens from `src/styles/tokens/palette.json`, and
  dynamic-only inline styles.

---

## 2. Investigation Protocol

1. **Inspect Comparable Implementations**:
   - Feature slices: `src/features/<feature>/` (e.g. `portfolio`, `stocks`,
     `banks`, `expenses`).
   - Shared layout and finance primitives: `src/shared/` and
     `@happy-finance/ui`.
2. **Trace Contracts & Types**:
   - Locate shared types in `src/packages/types/` and Zod schemas in
     `src/packages/schemas/`.
   - Route paths must come from `src/config/routes.ts` (`AppRoutes`). Never
     hard-code URLs.
3. **Data Scoping**:
   - Scoped strictly to server-side `session.userId`. Never trust
     caller-supplied `userId` or `personId`.

---

## 3. Implementation Order

1. **Schemas & Types**: Define Zod validation schemas (`src/packages/schemas/`)
   and TypeScript interfaces.
2. **Database & Persistence**: Update `prisma/schema.prisma` and generate
   migrations via `api-database-schema`.
3. **Service Layer**: Implement domain logic in
   `src/features/<feature>/services/` or `src/lib/`.
4. **API Route Handlers**: Create endpoints under `src/app/api/v1/<feature>/`.
5. **UI Implementation**:
   - Start pages with `PageHeader` (`src/shared/page-header`) and wrap in
     `DashboardContainer`.
   - Implement mobile-first (390px phone base, desktop ≥1280px via media
     mixins).
   - Use `@happy-finance/ui` components exclusively.

---

## 4. Verification & Documentation

1. **Verify DoD**:
   `pnpm type-check && pnpm lint && pnpm test && pnpm governance:validate`.
2. **Update Docs**: Add entry to `CHANGELOG.md` under `[Unreleased]` and update
   API docs in `docs/api/`.
