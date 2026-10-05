# AI Architecture

Status: Source-backed for one Gemini tax-advice flow Source:
`src/actions/taxAi.ts`, `src/actions/tax-ai/geminiPrompt.ts`,
`src/actions/admin/ai.ts`, `src/actions/tax-ai/defaultSettings.ts`,
`src/lib/db/dataMigrations.ts` Last Verified: 2026-10-05 Confidence: HIGH for
implementation; production provider/model/key state UNKNOWN Owner: UNKNOWN
Related Documents: [AI safety](AI_SAFETY_AND_GOVERNANCE.md),
[privacy governance](DATA_PRIVACY_AND_GOVERNANCE.md),
[environment variables](ENVIRONMENT_VARIABLES.md)

## Implemented Capability

The repository contains one generative AI feature: personalized Indian
tax-strategy advice. No other LLM/model integrations were found in the reviewed
source.

### Request Flow

```mermaid
sequenceDiagram
  participant UI as Tax strategy UI
  participant SA as generateTaxAIAdviceAction
  participant DB as Neon (user + ai_settings)
  participant G as Google Gemini API
  UI->>SA: financialSummary + userQuestion + session token
  SA->>DB: ensure schema; resolve user/session; read settings
  SA->>SA: Require admin or active Tax Pro plan
  SA->>SA: Build prompt from DB system prompt + JSON summary + question
  SA->>G: POST generateContent; API key in x-goog-api-key
  G-->>SA: Candidate text
  SA-->>UI: advice string/model or error
```

### Provider and Configuration

- Provider setting defaults to `gemini`; model defaults to `gemini-2.5-flash`
  (`src/actions/tax-ai/defaultSettings.ts`, `dataMigrations.ts`).
- API key precedence: `ai_settings.api_key`, then `GEMINI_API_KEY`, then
  `GOOGLE_API_KEY`.
- Admin AI settings are persisted in `ai_settings` (`provider`, `model`,
  `api_key`, `system_prompt`, `enabled`). The key is stored as plaintext in the
  database schema/action path; no encryption layer is visible in these files.
- Although provider is configurable in DB, the generation implementation calls
  `callGeminiApi` unconditionally. Alternate-provider execution is NOT
  IMPLEMENTED in the inspected path.

### Prompt/Input/Output

- `financialSummary` is an arbitrary `Record<string, unknown>` and is serialized
  with `JSON.stringify`; `userQuestion` is interpolated into prompt text.
- Prompt includes a hardcoded tax-year header mentioning FY 2024-25 / FY 2025-26
  and instructions about regimes, deductions, and capital gains.
- Request uses temperature 0.3, max 1500 output tokens, 25-second timeout.
- The first candidate text part is returned as `advice`; absent text yields a
  canned message. No structured JSON schema, source citations, factuality check,
  or reconciliation with deterministic tax calculations is visible.
- Provider error response text is logged with status in `console.error`; this
  requires log-data review.

## Privacy and Observability

The summary/question are sent to Google Gemini. The source does not show
prompt/output retention controls, consent capture, redaction, per-user AI audit
records, rate limiting, token accounting, cost limits, retries, or fallback
provider. Production logging/Google account configuration is UNKNOWN. Do not
describe generated advice as a verified tax result.
