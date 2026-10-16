---
name: testing-verification
description: >-
  Guide for test selection, regression verification, governance gates, and
  definition-of-done compliance in Happy Finance.
---

# Testing & Verification Workflow

Use this skill when running tests, diagnosing test suite failures, or executing
final verification.

---

## 1. Progressive Testing Protocol

To optimize time and context:

1. **Targeted Unit Test First**: Run only the test file relevant to your change:
   ```bash
   pnpm test path/to/targeted.test.ts
   ```
2. **Focused Static Analysis**:
   - SCSS / tokens: `pnpm tokens:check`
   - TypeScript: `pnpm type-check`
3. **Full Suite at Completion**: Execute all four gates prior to concluding:
   ```bash
   pnpm type-check          # tsc --noEmit
   pnpm lint                # tokens:check + eslint --max-warnings 0
   pnpm test                # full Jest test suite (70 suites)
   pnpm governance:validate # native controls, a11y, spacing/radius tokens
   ```

---

## 2. Responsive UI Verification

- For UI changes, verify at:
  - Phone: **390px**
  - Desktop: **≥1280px**
- Test with seeded demo account (`prisma/seed-users.ts`) on `localhost` only.
- Never claim browser verification was conducted unless actually observed.

---

## 3. Reporting Standards

- State exact commands run and actual numerical outcomes (e.g.
  `Test Suites: 70 passed, 70 total`).
- Distinguish passed, failed, or unverified checks honestly. Never bypass checks
  with `--no-verify`.
