# Test Execution Record

Status: Verified command output Source: `npm test` on repository worktree Last
Verified: 2026-10-05 Confidence: HIGH for this local run only Owner: UNKNOWN
Related Documents: [Testing and QA](TESTING_AND_QA.md),
[Financial test matrix](FINANCIAL_TEST_MATRIX.md)

## Run

- Command: `npm test`
- Result: PASS
- Tests: 287 passed, 0 failed, 0 skipped; 15 suites
- Duration reported by Node: approximately 3.14 seconds
- Scope: existing `src/**/*.test.ts` Node test runner, loaded by
  `scripts/ts-test-hooks.mjs`

Some tests intentionally exercise corrupt persisted storage and log an error
message while asserting recovery; the corresponding tests passed. This is not a
browser/E2E, accessibility, load, security, or provider integration test run.

`npm run lint` was run and failed with 493 errors and 8 warnings (501 findings)
across source files. Examples include `no-multiple-empty-lines` and
`react/jsx-newline` errors, plus `react-hooks/set-state-in-effect` warnings in
PPF views. No application source was changed during this documentation task.

`npm run build` and Storybook build were not run.
