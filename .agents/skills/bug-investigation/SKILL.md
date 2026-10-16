---
name: bug-investigation
description: >-
  Guide for diagnosing defects, runtime exceptions, data anomalies, test
  failures, or UI glitches in Happy Finance and applying targeted fixes without
  guessing.
---

# Bug Investigation & Resolution Workflow

Use this skill when diagnosing defects, broken behaviors, or regression test
failures.

---

## 1. Core Principles

- **Root Cause First**: Diagnose the underlying mechanism before changing
  application code. Never patch symptoms.
- **Minimal Coherent Fix**: Keep fixes strictly bounded; do not
  opportunistically refactor surrounding code.
- **Preserve Truth**: Never suppress linter warnings or weaken test assertions
  without verified contract changes.

---

## 2. Investigation Protocol

1. **Reproduce the Defect**:
   - Create a failing unit or integration test case:
     `pnpm test path/to/failing.test.ts`.
2. **Trace Evidence**:
   - Check server logs: `src/lib/observability/server-logger.ts`.
   - Database / Prisma: Trace query generation in `prisma/schema.prisma`.
   - Redis: Check graceful degradation and cache key derivation in
     `src/lib/redis/`.
   - Bank/CAS/broker parsers: Trace pipelines against synthetic fixtures.
3. **Inspect History**:
   - Check file history: `git log -n 5 -p path/to/file`.
   - Check `.local/governance/decisions-log.md` to ensure the behavior was not
     an intentional contract change.

---

## 3. Fixing & Regression Protection

1. **Add Regression Test**: Confirm the test fails before applying the patch.
2. **Apply Minimal Fix**: Maintain strict TypeScript (no `any`, `@ts-ignore`, or
   unsafe casts).
3. **Confirm Test Passage**: Verify the regression test passes and no adjacent
   tests broke.

---

## 4. Verification

```bash
pnpm type-check
pnpm lint
pnpm test
pnpm governance:validate
```

Report: Root cause, files modified, regression tests added, and exact check
outcomes.
