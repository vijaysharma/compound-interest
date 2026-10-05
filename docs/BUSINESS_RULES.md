# Business Rules

Status: Code-derived rules; legal/business approval not implied Source:
`src/lib/db/userUtils.ts`, `src/actions/**`, `src/utilities/**`, calculator
views, game submission rules Last Verified: 2026-10-05 Confidence: HIGH for code
behavior; legal applicability varies Owner: UNKNOWN Related Documents:
[Product inventory](PRODUCT_AND_FEATURE_INVENTORY.md),
[financial audit](FINANCIAL_CALCULATION_AUDIT.md),
[admin guide](ADMIN_OPERATIONS_GUIDE.md)

| Rule ID | Observed rule                                                                                                                  | Evidence                                                     | Confidence/status                                                                                      |
| ------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| BR-001  | `FREE_USAGE_LIMIT` defaults to 15; trial duration is 48 hours; admin bypasses blocking                                         | `src/lib/db/types.ts`, `userUtils.ts`, session usage handler | HIGH code fact                                                                                         |
| BR-002  | User session lasts 30 days                                                                                                     | `src/actions/auth/authHelpers.ts`                            | HIGH code fact                                                                                         |
| BR-003  | Admin email list may promote users to admin                                                                                    | `src/lib/db/userUtils.ts`, auth handlers                     | HIGH code fact; owner/allowlist values require human confirmation                                      |
| BR-004  | Admin actions may accept DB admin session or `ADMIN_SYNC_TOKEN`                                                                | `isAuthorizedUser`                                           | HIGH code fact; per-action application varies                                                          |
| BR-005  | PPF contribution records require positive finite amount <= ₹10,000,000, date string with year 1968-2100; notes truncate to 255 | `src/actions/ppfHistory.ts`                                  | HIGH code fact; date calendar validation is not complete                                               |
| BR-006  | PPF annual accepted deposit cap is ₹150,000; excess is excluded from interest/balance                                          | `src/utilities/ppfCalculations.ts`, `ppfRates.ts`            | HIGH implementation; official legal basis not linked                                                   |
| BR-007  | PPF monthly interest eligibility depends on deposit on/before day 5; annual interest is credited/rounded                       | PPF calculator                                               | HIGH implementation; legal rule requires current official source verification                          |
| BR-008  | Income tax comparison selects regime with lower computed total tax; calculations follow hardcoded slabs/deductions             | `incomeTaxCalculations.ts`                                   | HIGH code fact; not tax advice; legal review required                                                  |
| BR-009  | NPS annuity minimum and small-corpus thresholds are hardcoded based on retirement age                                          | `npsCalculations.ts`                                         | HIGH code fact; current PFRDA rule unverified                                                          |
| BR-010  | Strategy historical transactions use NAV on or before transaction date; unavailable NAV creates warnings/skips event           | `strategy/navLookup.ts`, `executor.ts`                       | HIGH code fact                                                                                         |
| BR-011  | Game score submissions require a valid one-use game session and bounded game/difficulty/time fields                            | `gameLeaderboard.ts`, `submissionRules.ts`                   | HIGH code fact                                                                                         |
| BR-012  | UPI manual submissions reject duplicate pending/approved UTR values by query; admin approval maps amount thresholds to plan    | `manualSubmissions.ts`                                       | HIGH code fact; concurrency/plan thresholds require operational review                                 |
| BR-013  | Shiprocket customer dedup uses normalized name/pincode and links distinct order/account IDs                                    | `shiprocketCustomerManager.ts`                               | HIGH code fact; PII/source rules also detailed in existing Shiprocket doc, live behavior NOT rechecked |
| BR-014  | Privacy page says account deletion can be requested by contacting the site; matching full deletion workflow was not found      | `src/views/privacy.tsx`, actions reviewed                    | POLICY CLAIM; implementation NOT FOUND                                                                 |

These are observed behavior, not statements of applicable law or approved
product intent.
