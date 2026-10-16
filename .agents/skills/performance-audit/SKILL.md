---
name: performance-audit
description: >-
  Systematic, evidence-based performance audit and optimization guide for Happy
  Finance. Use when investigating slow pages, API/DB latencies, render overhead,
  bundle sizes, query bottlenecks, or memory leaks without compromising
  correctness.
---

# Performance Audit & Optimization Workflow

Use this skill when auditing, profiling, or optimizing performance across
frontend rendering, App Router boundaries, API route handlers, Prisma database
queries, or Redis caching.

> **Scope Note**: Governs performance _investigations, profiling, and
> evidence-backed optimizations_. Do not perform speculative refactoring without
> baseline measurements.

---

## 1. Core Principles & Guardrails

- **Evidence First**: Always capture a measurable baseline before altering code.
- **Precision Invariant**: Never compromise mathematical precision (minor units,
  mutual fund units, XIRR/CAGR) for speed.
- **Tenant Isolation Invariant**: Never optimize queries or caches by relaxing
  `session.userId` filters or sharing user-specific caches.
- **Freshness Invariant**: Do not introduce aggressive caching or stale TTLs
  where timely financial data is required (e.g. AMFI NAV updates, portfolio
  reconciliation).
- **Simplicity First**: Prioritize algorithmic complexity ($O(N^2) \to O(N)$),
  N+1 database queries, and network waterfalls before premature memoization
  (`useMemo`, `useCallback`).

---

## 2. Request Lifecycle Audit Checklist

Inspect the full lifecycle for bottlenecks:

1. **Frontend Rendering**:
   - Limit `"use client"` directives; push data fetching and transformations to
     Server Components.
   - Profile avoidable re-renders caused by unstable context values or
     unmemoized callback handlers in loops.
   - For large datasets (banking ledger, stock transactions), verify table
     virtualization (`@tanstack/react-virtual`).
   - Dynamically import heavy third-party bundles (`jspdf`, `xlsx`).
2. **Network & Fetching**:
   - Eliminate waterfalls: parallelize independent fetches using
     `Promise.all()`.
   - Prevent over-fetching: use explicit Prisma `select` blocks rather than
     querying entire records.
   - Enforce pagination on collection endpoints.
3. **Backend & Computation**:
   - Replace nested loops ($O(N^2)$) in parser and matching engines with indexed
     Map/Set structures.
   - Prevent event loop blocking during file parsing; stream or chunk large
     payloads.
4. **Database & Prisma**:
   - Detect N+1 queries executed in loops; batch queries using
     `where: { in: [...] }` or relation includes.
   - Verify index coverage in `prisma/schema.prisma` (`userId`, `date`,
     `checksum`, compound keys).
   - Keep interactive transactions (`prisma.$transaction`) brief to stay within
     Neon's 5s timeout.
5. **Caching & Memory**:
   - Centralize cache keys in `src/packages/cache/cache-keys.ts` with
     user-scoped keys and version tags.
   - Verify cache invalidation triggers on data mutation.
   - Confirm graceful degradation when Upstash Redis is unavailable.

---

## 3. Evidence-Based Optimization Protocol

1. **Establish Baseline**:
   - Profile the target journey locally (wall-clock time, query count, memory,
     or bundle size).
   - Check performance budgets: `pnpm perf:budgets`
     (`config/performance-budgets.json`).
2. **Formulate Hypothesis**: State target mechanism and expected reduction (e.g.
   "Batching folio queries reduces DB roundtrips from N to 1").
3. **Implement Minimal Fix**: Keep changes minimal, typed, and focused strictly
   on the bottleneck.
4. **Verify Correctness**: Run `pnpm test` to confirm zero regression in
   financial math or data integrity.
5. **Measure Outcome**: Re-run measurement under identical test conditions and
   document percentage improvement. Revert if complexity exceeds gain.

---

## 4. Verification & Reporting

Verify all Definition of Done gates:

```bash
pnpm type-check
pnpm lint
pnpm perf:budgets
pnpm test
pnpm governance:validate
```

### Report Format

Provide a concise summary:

- **Investigated Scope**: Subsystem, route, or API.
- **Baseline vs Post-Optimization Metrics**: Latency, query count, memory, or
  bundle size delta.
- **Root Cause & Fix**: Technical explanation of bottleneck and solution.
- **Regression Verification**: Confirmation of test suite passage and financial
  precision.
