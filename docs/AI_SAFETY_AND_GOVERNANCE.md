# AI Safety and Governance

Status: Initial risk review, not a model evaluation Source:
`src/actions/taxAi.ts`, `src/actions/tax-ai/geminiPrompt.ts`,
`src/actions/admin/ai.ts`, privacy/disclaimer views Last Verified: 2026-10-05
Confidence: HIGH for prompt/request behavior; LOW for provider-side handling
Owner: UNKNOWN Related Documents: [AI architecture](AI_ARCHITECTURE.md),
[financial audit](FINANCIAL_CALCULATION_AUDIT.md),
[security findings](SECURITY_FINDINGS.md)

## Existing Safeguards

- Requires a local user session and admin or active Tax Pro subscription before
  generating advice.
- Admin can disable AI; missing key returns a controlled error.
- API key is sent in `x-goog-api-key`, not in the URL, in current Gemini call.
- Request timeout is 25 seconds and output token budget is 1500.
- A financial disclaimer exists at `/disclaimer`, but whether it is shown
  adjacent to every AI result is NOT VERIFIED.

## Gaps and Risks

| Area                     | Current evidence                                                                                                    | Status                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Financial advice         | Prompt requests actionable tax optimization and says to speak as an Indian Chartered Accountant                     | HIGH legal/financial advice risk; requires legal/compliance review |
| Data passed              | Client-supplied financial summary and question are sent to Gemini without field allowlist/redaction                 | VERIFIED; sensitive-data minimization not established              |
| Prompt injection         | User question and summary are inserted in prompt; no isolation or untrusted-input delimiters beyond text formatting | POTENTIAL RISK; prompt injection evaluation NOT FOUND              |
| Hallucination control    | No source citations, deterministic verification, structured response or tax-engine reconciliation found             | NOT IMPLEMENTED in inspected flow                                  |
| Outdated context         | Prompt tax-year string lags the calculation type/default                                                            | VERIFIED drift; tax reviewer needed                                |
| Provider/model selection | Stored provider is configurable but code calls Gemini                                                               | IMPLEMENTATION LIMITATION                                          |
| Privacy/retention        | Gemini data handling terms/settings not in repo; no retention configuration found                                   | UNKNOWN; HUMAN CONFIRMATION                                        |
| Monitoring/cost          | No token/cost meter, AI-specific rate limit, retry budget or output quality telemetry found                         | DOCUMENTATION/CONTROL GAP                                          |
| Disclosure               | Prompt explicitly asks model not to mention AI/models/bots                                                          | VERIFIED; review transparency expectations                         |

## Governance Requirements (Recommendations, Not Implemented)

- Obtain legal and tax-professional review of output claims and user
  disclosures.
- Define fields allowed to leave the system, user notice/consent, provider
  retention, and deletion process.
- Treat all user-provided text as untrusted; test direct and indirect prompt
  injection.
- Display AI output as unverified assistance, cite authoritative legal sources,
  and avoid presenting it as a CA-authored opinion.
- Validate model statements against deterministic calculations where possible
  and reject unsupported numerical claims.
- Establish quotas, budget alerts, logging redaction, provider/model approval,
  and prompt version governance.
- Preserve UNKNOWN where provider-console controls cannot be verified.
