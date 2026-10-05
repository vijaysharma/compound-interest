# Financial Test Matrix

Status: Source-derived test plan; not all cases currently implemented Source:
`src/utilities/**/__tests__`, financial calculation modules Last Verified:
2026-10-05 Confidence: HIGH for identified code/test locations; expected legal
outputs require independent oracle Owner: UNKNOWN Related Documents:
[Calculation catalog](FINANCIAL_CALCULATION_CATALOG.md),
[calculation audit](FINANCIAL_CALCULATION_AUDIT.md),
[testing and QA](TESTING_AND_QA.md)

| Domain                 | Existing tests found                                                                   | Required cases / expected oracle                                                                                                                                                                                    | Gap/status                                                             |
| ---------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| SIP/SWP/XIRR           | NAV/date/strategy tests; no focused XIRR test located in initial inventory             | One/zero cash flow; regular/irregular dates; leap day; no solution; multiple roots; -99.9%, near -100%, huge values; compare independent finance library                                                            | DOCUMENTATION GAP                                                      |
| EMI                    | No test named for `calculateBaseEmi`/`calculateAmortization` in current test inventory | zero-rate principal/tenure; negative/zero inputs; first-day/last-day dates; leap year; rate changes same-period; part payment on EMI date; payoff early; rounding residue                                           | HIGH priority; independent numeric oracle                              |
| FD/RD                  | No direct calculation tests found                                                      | monthly/quarterly/semiannual/annual compounding; payout modes; fractional tenure; zero rate; target mode; tax/TDS threshold boundaries; senior/non-senior                                                           | DOCUMENTATION GAP                                                      |
| PPF                    | `src/utilities/__tests__/ppfCalculations.test.ts`                                      | April/March FY boundary; days 5/6; Feb 28/29/invalid Feb 31; annual cap exact/over; empty/actual history; missing FY; extension; stop/continue; rate quarter transitions; maturity dates                            | Existing focused tests; statutory expected values need official source |
| PPF/MF compare         | `src/utilities/__tests__/ppfMutualFundComparison.test.ts`                              | NAV before inception/after latest; nearest NAV direction; duplicate dates; invalid/missing NAV; multiple records same day; XIRR no solution; PPF value zero                                                         | Existing tests; finance oracle/provenance required                     |
| NPS                    | No `npsCalculations` test found                                                        | Age 60 vs 59; corpus exactly/over threshold; annuity floor/cap; 0/negative ROI; employer contribution; pension arithmetic and rounding                                                                              | DOCUMENTATION GAP; current regulation review                           |
| Income tax             | No tax calculation unit tests identified                                               | Every FY/regime slab boundary; nil rebate edges; age categories; surcharge/marginal relief thresholds; HRA metro/nonmetro; standard deduction; 80C/80D/CCD caps; capital gains limits; negative/zero/missing inputs | CRITICAL/HIGH coverage gap for tax domain; CA-approved oracle required |
| Inflation/PPP/currency | No dedicated calculation unit tests identified                                         | Zero inflation; decreasing/negative inflation; missing years; source/target same; missing PPP country/year; stale fallback; currency base-rate consistency                                                          | DOCUMENTATION GAP                                                      |
| FII/DII adjustments    | No tests located in existing test inventory                                            | CPI base-date ratio, PPP unit conversion, missing macros/fallback, signed net flows, cumulative aggregation and timeframe                                                                                           | DOCUMENTATION GAP                                                      |
| Strategy projection    | Many tests under `src/views/strategy/__tests__/`                                       | Re-run existing suite; add oracle for profile rates, inflation deflation, depletion, one-time withdrawals, transaction dates around NAV holidays, scenario reproducibility                                          | Significant current coverage; empirical assumption provenance gap      |
| Property/income taxes  | No comprehensive legal oracle found                                                    | Tax law boundaries and year-by-year expected values approved by qualified reviewer                                                                                                                                  | NOT VERIFIED                                                           |

## Required Financial Verification Protocol

1. Freeze exact inputs, units, dates/timezone and contribution/withdrawal
   timing.
2. Independently calculate expected outputs using hand math or a separately
   maintained reference implementation.
3. Include zero, negative, minimum, maximum, fractional and extreme values.
4. Validate date edge cases (leap years, month ends, Indian FY boundary,
   holidays, missing NAV).
5. Compare raw full-precision values and displayed rounding separately.
6. For tax, PPF and NPS, have an appropriately qualified reviewer validate rules
   for each supported year.
7. Record fixtures, oracle source, version/date, tolerance, and reviewer in the
   test itself or linked audit.

This matrix is a plan, not a claim that tests have been executed.
