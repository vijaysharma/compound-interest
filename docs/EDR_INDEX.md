# Engineering Decision Records Index

Status: Retrospective evidence index; historical intent generally UNKNOWN
Source: Current source/config and Git history where inspected Last Verified:
2026-10-05 Confidence: MEDIUM Owner: UNKNOWN Related Documents:
[ADR index](adr/README.md), [system design](SYSTEM_DESIGN.md)

| EDR     | Decision/constraint                                                                      | Evidence                                                                    | Status                                                              |
| ------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| EDR-001 | Financial feature logic is split between pure utilities and view-local calculation hooks | `src/utilities/**`, `src/views/**`                                          | Retrospective; rationale UNKNOWN                                    |
| EDR-002 | External market data uses a mix of PostgreSQL persistence, Redis REST and process cache  | `src/actions/data/**`, `src/lib/redis.ts`, `src/lib/amfi/**`                | Retrospective; rationale partly documented in comments              |
| EDR-003 | Authentication token is passed to server actions and browser storage                     | `src/actions/auth/**`, `src/utilities/clientSession.ts`                     | Current implementation; security tradeoffs undocumented             |
| EDR-004 | PPF/government tax rules are represented as constants in application code                | `src/data/ppfRates.ts`, `src/utilities/income-tax/**`, `npsCalculations.ts` | Current implementation; legal source governance gap                 |
| EDR-005 | Selected controls use app-specific SCSS modules and shared Sass tokens/mixins            | `src/styles/**`, `*.module.scss`                                            | Current implementation                                              |
| EDR-006 | Games use separate server session and score-validation path                              | `src/actions/gameLeaderboard.ts`, `src/lib/games/submissionRules.ts`        | Current implementation                                              |
| EDR-007 | Runtime schema changes are split into TypeScript migration modules and version gate      | `src/lib/db/migrations.ts`, `*Migrations.ts`                                | Current implementation; migration transaction/version ordering risk |

Record new engineering decisions when they materially change security, financial
correctness, persistence, provider dependencies, performance, or operation. Do
not invent decision dates or owners.
