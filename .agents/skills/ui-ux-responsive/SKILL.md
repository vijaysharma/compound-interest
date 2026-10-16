---
name: ui-ux-responsive
description: >-
  Guide for building consistent, accessible, token-compliant UI across phone and
  desktop widths in Happy Finance. Use when editing UI components, SCSS modules,
  layouts, or page views.
---

# UI/UX & Responsive Implementation Workflow

Use this skill when implementing or modifying user interfaces.

---

## 1. Hard Constraints (Enforced by Tooling)

1. **Colors** (`pnpm tokens:check`):
   - Palette colors live exclusively in `src/styles/tokens/palette.json` (brand
     primary **wine-700 `#580025`**). Run `pnpm tokens:build` after editing.
     Never edit `_palette.generated.scss` directly.
   - Use semantic CSS tokens (`var(--color-primary)`, `var(--color-surface)`).
   - Forbidden: Hex codes, numeric `rgb()/rgba()/hsl()`, named colors, undefined
     tokens, and hard-coded fallbacks (`var(--x, #fff)`).
2. **Typography & Spacing**:
   - `font-size`: `var(--font-size-{3xs..5xl})`.
   - `font-weight`: `var(--font-weight-{regular,medium,semibold,bold})`.
   - `spacing`: `var(--space-*)`, `var(--radius-*)`.
3. **Components** (`pnpm governance:validate`):
   - Use `@happy-finance/ui` primitives (`Button`, `Input`, `Select`,
     `Checkbox`, `RadioGroup`, `Modal`, `Tooltip`, `Spinner`, `Table`, `Card`,
     `Typography`, `Disclosure`, `Image`, `Label`).
   - Native HTML controls (`<button>`, `<input>`, `<select>`, `<label>`,
     `<img>`) are strictly forbidden.
4. **Inline Styles**:
   - `style={{ ... }}` is permitted **only** for CSS custom properties carrying
     dynamic runtime values (`style={{ "--fill-w": `${pct}%` }}`). All static
     styling belongs in SCSS modules.
5. **Layout Structure**:
   - Page header: Start pages with `PageHeader` (`src/shared/page-header`).
   - Body container: Wrap inside `DashboardContainer` (full width, no max-width
     cap).
   - Tables: `<th>` must `@include mx.table-header-cell;` (dark wine bar,
     single-line uppercase).
   - Desktop table pages have **no page-level scroll**: Container takes
     remaining viewport (`flex: 1 1 0; min-height: 0; overflow: auto`) with
     sticky header/footer.

---

## 2. Mobile-First Responsive Protocol

- Mobile-first base styles (390px minimum touch target).
- Scale up with mixins: `@include mx.tablet-up` and `@include mx.desktop-up`.
  Never write desktop-first overrides.
- Single component tree per page: Never duplicate data-fetching or logic for
  mobile vs desktop. Render cards on mobile and tables on desktop conditionally
  via SCSS.
- Touch targets ≥ 44px on mobile viewports.

---

## 3. Verification

```bash
pnpm tokens:check
pnpm governance:validate
pnpm lint
```

- Verify at phone width (**390px**) and desktop (**≥1280px**).
- Test on `localhost` with seeded demo user (`prisma/seed-users.ts`).
