---
name: financial-calculations
description: >-
  Guide for modifying calculations, portfolio metrics, returns (XIRR/CAGR), or
  banking aggregates in Happy Finance. Use when touching valuation logic,
  decimal precision, or statement parsers.
---

# Financial Calculations & Data Workflow

Use this skill when implementing or modifying financial math, aggregation, or
parsing.

---

## 1. Core Principles

- **Zero Guessing**: Never invent formulas, compounding assumptions, or rounding
  rules.
- **Precision Invariant**: Use minor units (paise) for currency and explicit
  Decimal math (`src/packages/shared-utils/financial/decimal.ts`). Prevent
  floating-point truncation.
- **Tenant Scoping**: All financial metrics strictly scoped to server-side
  `session.userId`.

---

## 2. Domain Locations & Primitives

- **Financial Primitives**: `src/packages/shared-utils/financial/` and
  `src/shared/finance/` (`formatRupees`, `formatSignedRupees`,
  `formatSignedPercent`, `toneOf`).
- **Portfolio & Returns Engine**: `src/packages/shared-utils/portfolio/`
  (valuation, holding periods, cash flow models).
- **Banking Ledger**: Aggregated in integer minor units
  (`totalCreditsMinorUnits`, `totalDebitsMinorUnits`, `netFlowMinorUnits`).
- **NAV Data Source**: AMFI (`NAVAll.txt` and NAV history) via `src/lib/nav/`.
  Never query `mfapi.in`.

---

## 3. Implementation Guardrails

1. **Precision & Rounding**:
   - Currency: Store/aggregate in integer minor units.
   - MF Units: Preserve precision up to 3 or 4 decimal places per AMFI/CAS
     specifications.
2. **FY Conventions**:
   - Indian Financial Year runs April 1 to March 31 (e.g. FY 2024-25). Use
     centralized helpers (`src/features/stocks/hooks/useFYFilter.ts`).
3. **Cash Flows & Returns**:
   - Strictly distinguish XIRR (irregular cash flows), CAGR (multi-year
     point-to-point), and absolute return. Ensure cash flow dates are ascending
     and validated.

---

## 4. Verification

```bash
pnpm test src/packages/shared-utils/financial/
pnpm test src/packages/shared-utils/portfolio/
pnpm test src/features/banks/__tests__/bu5-analytics.test.ts
pnpm test
```
