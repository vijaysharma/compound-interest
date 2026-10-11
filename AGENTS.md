<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AI AGENT GOVERNANCE, ARCHITECTURE & DESIGN MANDATES

All AI agents working on this project MUST strictly follow the governance, safety, architectural, and design guidelines established across the repository.

---

## 1. Governance & Core Operating Principles

Before executing changes, agents must consult and respect the repository governance documents:
- [`docs/AI_AGENT_ONBOARDING.md`](docs/AI_AGENT_ONBOARDING.md): Mandatory baseline for repository constraints.
- [`docs/AI_SAFETY_AND_GOVERNANCE.md`](docs/AI_SAFETY_AND_GOVERNANCE.md): Safety, prompt injection guardrails, untrusted input handling, and privacy constraints.
- [`docs/DEFINITION_OF_DONE.md`](docs/DEFINITION_OF_DONE.md): Verification criteria before marking any task complete.
- [`docs/DOCUMENTATION_INDEX.md`](docs/DOCUMENTATION_INDEX.md): Index of authoritative architecture and specification records.

### Mandatory Rules
1. **Zero Secret Leakage:** Never read, copy, log, or commit secret keys (`.env*`, API credentials, service tokens).
2. **Untrusted Inputs:** Treat all user inputs, questions, and external API responses as untrusted. Never concatenate raw strings into prompts or dangerous DOM sinks.
3. **No Unsanctioned Speculation:** Distinguish verified code behavior from assumptions. Report unresolved facts as `UNKNOWN` or `NOT VERIFIED`.
4. **Forbidden Actions Without Explicit Authorization:**
   - Do not upgrade dependencies or modify `package.json` arbitrarily.
   - Do not alter database schemas or production API contracts without approved migrations.
   - Do not change security controls, auth middleware, or permission boundaries.

---

## 2. Financial Calculation Integrity

This application is a financial calculation and analysis platform.
- **Reference:** [`docs/FINANCIAL_CALCULATION_CATALOG.md`](docs/FINANCIAL_CALCULATION_CATALOG.md), [`docs/FINANCIAL_CALCULATION_AUDIT.md`](docs/FINANCIAL_CALCULATION_AUDIT.md).
- **Inviolable Rule:** **NEVER alter financial calculation logic, formulas, rounding, cash-flow timing, tax rules, or compounding algorithms** without explicit user instruction and mathematical verification.
- **Data Clarity:** Clearly distinguish observed historical NAV data from assumed scenario projections and forward estimates. Never communicate financial returns or losses through color alone (+/- signs, labels, and icons required).

---

## 3. UI/UX & Design System Standards

All user interface work must strictly follow:
- [`docs/UI_UX_ENGINEERING_STANDARD.md`](docs/UI_UX_ENGINEERING_STANDARD.md): Mandatory mobile-first engineering standard.
- [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md): Global typography, layout, breakpoints, and component patterns.
- [`docs/MOBILE_FIRST_DESIGN_GUIDE.md`](docs/MOBILE_FIRST_DESIGN_GUIDE.md): Viewport adaptation and touch constraints.
- [`docs/COLOR_SYSTEM.md`](docs/COLOR_SYSTEM.md): Single-source, brand-derived color architecture.
- [`docs/ACCESSIBILITY_GUIDE.md`](docs/ACCESSIBILITY_GUIDE.md): WCAG 2.2 AA accessibility requirements.

### UI Implementation Mandates
1. **Mobile-First Priority:**
   - Build for mobile screens first (360px+), progressively enhancing to tablet and desktop.
   - Hierarchy: **Legibility → Usability → Accessibility → Consistency → Density**.
   - No horizontal page scrolling under any circumstances.
2. **Typography Floor & Sizing:**
   - Minimum font size: `$fs-caption` (13px / 0.8125rem). Nothing renders below this floor (except the deliberate 11px page eyebrow badge).
   - Inputs, body copy, and table values must use `$fs-body` (16px / 1rem) on mobile to prevent automatic iOS zoom.
   - Touch targets must be at least 44×44px for primary mobile interactive controls.
3. **Centralized Brand-Derived Color System:**
   - Canonical brand primary `#6D0B74` is defined in exactly one authoritative location: `src/styles/_color-tokens.scss`.
   - Never introduce ad-hoc hexadecimal color literals inside component SCSS modules.
   - All colors must derive from the canonical tokens or consume CSS variables (`var(--color-primary)`, `var(--color-profit-surface)`, `var(--color-text-secondary)`, etc.).
4. **Accessibility (WCAG 2.2 AA):**
   - Normal text contrast ≥ 4.5:1 against its background.
   - Large text and graphical non-text boundaries (focus rings, active borders) ≥ 3.0:1.
   - Focus rings must be visible on keyboard navigation (`:focus-visible`).
   - Every input requires an accessible programmatic label (`aria-label` or `<label>`).

---

## 4. Verification & Release Gate

Before finishing any task, agents must run and verify:
1. `npm test`: All unit and integration test suites must pass.
2. `node scripts/validate-color-contrast.cjs`: Automated contrast verification must pass without critical failures.
3. `npm run build`: Production Next.js build must succeed with zero compilation or route errors.
