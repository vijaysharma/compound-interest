# Financial Calculation Audit

Status: Source-level risk audit; no independent legal/actuarial certification
Source: `src/utilities/`, `src/views/emi/`, `src/views/fd/`, `src/views/rd/`,
`src/views/strategy/`, `src/lib/fiiDii/` Last Verified: 2026-10-05 Confidence:
HIGH for implementation observations; MEDIUM/LOW for external correctness
conclusions Owner: UNKNOWN Related Documents:
[Calculation catalog](FINANCIAL_CALCULATION_CATALOG.md),
[financial test matrix](FINANCIAL_TEST_MATRIX.md)

## Findings

| ID     | Severity      | Finding                                                                                                                                                                                                                                       | Evidence                                                                                                                      | Recommended verification                                                                                                                                                       |
| ------ | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| FIN-01 | HIGH          | Tax rates/caps are hardcoded for selected financial years; no linked official legal source or update feed accompanies values. Default FY is 2026-27.                                                                                          | `src/utilities/income-tax/types.ts`, `taxSlabs.ts`, `deductions.ts`, `computeRegimeTax.ts`                                    | Chartered accountant/tax counsel should validate every slab, rebate, deduction, surcharge, cess, capital-gain rule and supported FY against primary legislation/notifications. |
| FIN-02 | HIGH          | Tax AI prompt text names FY 2024-25/FY 2025-26 while calculator can default to FY 2026-27; AI output is free text and not checked against engine output.                                                                                      | `src/actions/tax-ai/geminiPrompt.ts`, `src/utilities/income-tax/types.ts`, `src/actions/taxAi.ts`                             | Tax expert should review prompt context, current rules, and advice boundary; add independent scenario tests only in a future authorized change.                                |
| FIN-03 | HIGH          | Tax computation applies surcharge by threshold but no explicit marginal-relief calculation was found in `computeRegimeTax.ts`. Whether this is materially wrong depends on applicable FY/statute and input cases.                             | `taxSlabs.ts`, `computeRegimeTax.ts`                                                                                          | Independently compare boundary cases around every surcharge threshold with official tax calculators/CA-reviewed expected values.                                               |
| FIN-04 | HIGH          | NPS calculator implements simplified exit percentages/thresholds and calculates annuity payout as corpus × assumed rate divided by 12; this is not an insurer quote or actuarial annuity pricing model.                                       | `src/utilities/npsCalculations.ts`                                                                                            | PFRDA rule and tax treatment review; label assumptions clearly and validate edge cases.                                                                                        |
| FIN-05 | MEDIUM        | XIRR uses an unbracketed Newton iteration from 10%; multiple roots, poor derivatives, or difficult cash-flow sets may produce `undefined` or a root sensitive to initial guess.                                                               | `src/utilities/mutual-fund/xirrCalculation.ts`                                                                                | Compare against a trusted independent XIRR implementation for sign changes, irregular dates, multiple roots, and extreme cash flows.                                           |
| FIN-06 | MEDIUM        | Calculations use binary floating-point `number`; rounding policy is decentralized (rupees, 2 decimals, `toFixed`); exact reproducibility across presentation paths is not centrally governed.                                                 | `src/utilities/**`, `src/views/**`                                                                                            | Establish per-domain rounding/precision specifications and compare boundary values against decimal/reference calculations.                                                     |
| FIN-07 | MEDIUM        | PPF historical rate series and monthly overrides have no source URLs, notification IDs, or dataset verification date. Future rate uses a user/default projection.                                                                             | `src/data/ppfRates.ts`                                                                                                        | Verify each rate and the 5th-day/maturity assumptions against official Ministry of Finance notifications and current PPF rules.                                                |
| FIN-08 | MEDIUM        | FD/RD post-tax and TDS summaries use simplified assumptions and a supplied slab percentage; TDS threshold display is not equivalent to a final tax liability calculation.                                                                     | `src/views/fd/useFdCalculations.ts`, `src/views/rd/useRdCalculations.ts`                                                      | CA review and test treatment by payout/financial year, senior status, tax slab and tax regime.                                                                                 |
| FIN-09 | MEDIUM        | Home SIP, fixed-rate SIP, FD/RD, and NPS use different contribution timing/compounding conventions; user-visible descriptions should match exact exponents and period timing.                                                                 | `HomeWealthSimulator.tsx`, `fixed-rate-sip/useFixedRateSip.ts`, `utility.ts`, `rd/useRdCalculations.ts`, `npsCalculations.ts` | Add formula examples with hand-calculated expected results for first/last contribution and zero/negative rates.                                                                |
| FIN-10 | MEDIUM        | PPF `getFyAndMonth` checks day 1-31 but not actual month-specific calendar validity; invalid dates such as February 31 may be accepted as valid inputs.                                                                                       | `src/utilities/ppfCalculations.ts`                                                                                            | Verify date guard against real calendar dates, leap years, and ISO parsing; do not treat a regex as full date validation.                                                      |
| FIN-11 | MEDIUM        | In PPF-vs-MF comparison, every investment date before earliest available fund NAV uses the earliest NAV and marks a warning; value is a hypothetical proxy, not investable performance on the actual date.                                    | `src/utilities/ppfMutualFundComparison.ts`                                                                                    | Ensure warning is visible and validate old fund inception/date-boundary cases.                                                                                                 |
| FIN-12 | INFORMATIONAL | Strategy history uses observed NAVs and actual dated transactions; future scenarios use hardcoded 8.5%, 12%, 14.5% profiles and 6% default inflation, described in source as based on a 25-year Nifty 50 TRI average without a cited dataset. | `src/views/strategy/projectionProfiles.ts`, `projectionNav.ts`                                                                | Record statistical source/window and test sequence/order sensitivity; do not represent estimates as forecasts.                                                                 |
| FIN-13 | INFORMATIONAL | FII/DII real/PPP adjustment uses stored/current macro factors and fallback constants; cumulative values sum per-period adjusted flow values.                                                                                                  | `src/lib/fiiDii/fiiDiiCalculations.ts`                                                                                        | Verify the intended base-year, currency-unit interpretation, and missing-macro behavior with data owner.                                                                       |

## Numerical and Date Concerns

- JS `number` precision is finite; large values, tiny NAVs, repeated unit
  conversions, and long compounding horizons need explicit bounds and reference
  tests.
- XIRR dates use local `Date(year,month,day)` construction and 365.25-day
  annualization. Runtime timezone/DST behavior should be included in date tests.
- `calculateBaseMonthlyEmi` returns zero when rate, tenure, or principal is
  non-positive; a zero-interest EMI is mathematically principal/tenure, so
  zero-rate behavior requires explicit confirmation (the base helper currently
  returns 0 for `monthlyRate <= 0`). This is a POTENTIAL DEFECT for valid
  zero-rate loans.
- `calculateNPS` clamps displayed interest earned to nonnegative; negative
  expected return scenarios can therefore hide investment loss in that field.
  Input bounds and UI constraints require review.
- In fixed-rate SWP, yearly step-up logic is applied on configured month
  intervals; corpus can become negative in recurrence because no clamp is
  applied inside the loop. Verify whether inputs/UI prevent unsupported
  outcomes.

## Status

No formula was changed during this audit. Findings identify verification needs,
not silently corrected results. Current-law applicability requires human
tax/regulatory review.
