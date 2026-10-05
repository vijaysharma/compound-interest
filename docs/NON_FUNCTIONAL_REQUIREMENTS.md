# Non-Functional Requirements (Observed and Gaps)

Status: Reverse-engineered constraints; not approved service-level requirements
Source: `next.config.ts`, `vercel.json`, `src/styles/`, test/config files Last
Verified: 2026-10-05 Confidence: MEDIUM Owner: UNKNOWN Related Documents:
[Performance architecture](PERFORMANCE_ARCHITECTURE.md),
[security architecture](SECURITY_ARCHITECTURE.md),
[accessibility audit](ACCESSIBILITY_AUDIT.md)

| ID      | Concern           | Observed evidence                                                          | Status / gap                                               |
| ------- | ----------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------- |
| NFR-001 | Runtime framework | Next.js App Router, React 19, TypeScript strict                            | Implemented; Node version policy missing                   |
| NFR-002 | Availability      | External data and cache fallbacks; Vercel cron declarations                | Partial; no SLO, alert or restore proof                    |
| NFR-003 | Performance       | compression, package import optimization, bounded NAV concurrency/timeouts | Declared; no current benchmark/Core Web Vitals             |
| NFR-004 | Security          | security headers/CSP, password hashing, some timing-safe checks            | Partial; findings in `SECURITY_FINDINGS.md`                |
| NFR-005 | Privacy           | privacy route exists                                                       | Policy/source conflict; requires legal review              |
| NFR-006 | Accessibility     | ARIA/focus helpers and native controls in source                           | Partially implemented; no conformance audit/testing        |
| NFR-007 | Mobile            | viewport breakpoints, container queries, mobile input sizing               | Source patterns exist; visual behavior not certified       |
| NFR-008 | Data integrity    | PostgreSQL constraints and upserts; game one-time sessions                 | Partial; migration ordering and payment binding risks      |
| NFR-009 | Maintainability   | feature directories, tests, shared utilities, docs                         | Partial; no CI workflow/ownership matrix; docs being added |
| NFR-010 | Observability     | console logs and JSON cron result payloads                                 | No metrics/tracing/alerts found                            |
| NFR-011 | Portability       | Next/Vercel-specific config, Neon/Blob/Upstash SDKs                        | Provider-specific; alternate deployments not verified      |
| NFR-012 | Recovery          | Vercel/Neon/Blob provider services referenced                              | Backup/restore objectives and procedures UNKNOWN           |

No numerical latency, availability, RPO/RTO, uptime, accessibility level, or
supported-browser target was found. Do not invent one.
