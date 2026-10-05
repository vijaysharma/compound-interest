# Performance Findings

Status: Initial source inspection; benchmark validation NOT PERFORMED Source:
`next.config.ts`, `src/actions/data/`, `src/lib/redis/`, `src/views/strategy/`,
`vercel.json` Last Verified: 2026-10-05 Confidence: MEDIUM for implementation
risks, LOW for measured user impact Owner: UNASSIGNED Related Documents:
[Performance architecture](PERFORMANCE_ARCHITECTURE.md),
[risk register](RISK_REGISTER.md)

| ID      | Priority | Finding                                                                                                                       | Evidence / recommended check                                                                                |
| ------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| PERF-01 | HIGH     | Production browser source maps are enabled                                                                                    | `next.config.ts`; verify whether maps are deployed/public and whether source disclosure is intended         |
| PERF-02 | MEDIUM   | In-memory Redis fallback is per process, capped/pruned locally, and does not provide cross-instance coherence                 | `src/lib/redis/memoryStore.ts`; distinguish cache from distributed lock/rate-limit semantics during outages |
| PERF-03 | MEDIUM   | Some server actions do bounded/concurrent data fetching, but other upstream calls have distinct timeout/revalidation behavior | Inventory every fetch before changing timeouts; tests cover only subsets                                    |
| PERF-04 | MEDIUM   | Tax AI request can take up to 25 seconds and route functions are capped at 30 seconds                                         | `src/actions/tax-ai/geminiPrompt.ts`, `vercel.json`; observe timeout/error rate and client UX               |
| PERF-05 | LOW      | Root shell mounts multiple global client components and wraps content in Suspense; client bundle impact has not been measured | Use actual production build analyzer/route timing before optimization                                       |
| PERF-06 | UNKNOWN  | Current Web Vitals, database sizes, cache hit rates and external latency                                                      | No telemetry data committed; obtain production dashboards/field data                                        |

No speculative optimization was applied.
