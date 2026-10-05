# Testing and QA

Status: Test inventory and suite execution recorded Source: `package.json`,
`scripts/ts-test-hooks.mjs`, 41 `*.test.ts` files under `src/` Last Verified:
2026-10-05 Confidence: HIGH for inventory; coverage percentages UNKNOWN Owner:
UNKNOWN Related Documents: [Financial test matrix](FINANCIAL_TEST_MATRIX.md),
[Developer guide](DEVELOPER_GUIDE.md),
[Test execution record](TEST_EXECUTION_RECORD.md)

## Test Types Found

- Node test-runner unit tests, executed with
  `node --import ./scripts/ts-test-hooks.mjs --test "src/**/*.test.ts"` via
  `npm test`.
- Domains: chart series/downsample, admin NAV dates, game submission rules,
  Shiprocket cache, AMFI parsing/daily NAV, NAV retry/calendar/slicing, PPF
  calculations/comparison, strategy merge/engine/projection/scheduling/storage,
  and game engines/generators.
- Storybook exists (`storybook`, `build-storybook`) with component stories for
  charts/value pickers/strategy controls/skeletons. Visual regression runner was
  not found.
- No Playwright, Cypress, axe, Testing Library, Jest, or Vitest dependency was
  found in `package.json`/source scan.
- No checked-in CI workflow was found in `.github` at inventory time.

## Test Commands

| Command                   | Purpose                       | Source                                      |
| ------------------------- | ----------------------------- | ------------------------------------------- |
| `npm test`                | Node test runner plus TS hook | `package.json`, `scripts/ts-test-hooks.mjs` |
| `npm run lint`            | ESLint over repository        | `package.json`, `eslint.config.js`          |
| `npm run build`           | Next production build         | `package.json`                              |
| `npm run storybook`       | Storybook dev                 | `package.json`                              |
| `npm run build-storybook` | Static Storybook build        | `package.json`                              |

See [TEST_EXECUTION_RECORD.md](TEST_EXECUTION_RECORD.md): `npm test` passed 287
tests; `npm run lint` failed with 493 errors and 8 warnings; build and Storybook
build were not run.

## Coverage Gaps

No coverage threshold/report configuration was found. High-priority financial
gaps are listed in `FINANCIAL_TEST_MATRIX.md`. Route auth, payment plan binding,
public NAV sync abuse, migration failure recovery, AI prompt injection, privacy
data flows, mobile viewport and accessibility are not covered by discovered
automated tests.
