# Design System

Status: Source-backed visual inventory; no design-team specification found
Source: `src/styles/_theme.scss`, `_variables.scss`, `_mixins.scss`,
`_base.scss`, `src/index.scss`, component SCSS modules Last Verified: 2026-10-08
Confidence: HIGH for global tokens; MEDIUM for full component consistency Owner:
UNKNOWN Related Documents: [Mobile-first guide](MOBILE_FIRST_DESIGN_GUIDE.md),
[accessibility guide](ACCESSIBILITY_GUIDE.md)

## Global Theme

- Root theme is `fantasy` and `color-scheme: light` in `src/app/layout.tsx` and
  `src/styles/_theme.scss`.
- Primary is purple (`#6d0b74`), secondary/accent purple (`#9c27b0`/`#7b1fa2`),
  with white and slate neutral surfaces, semantic success/warning/error/info
  colors, and eight chart series tokens.
- A `[data-theme="dark"]` token set exists, but no theme selector/activation
  path was found in the inspected components. Dark theme availability is
  therefore PARTIALLY VERIFIED; user-selectable dark mode is NOT FOUND.
- Main global font stack is system UI / platform sans stack in `_base.scss`;
  local web-font files under `public/` were not found. Some components use
  monospace stacks for numeric/code displays.

## Geometry and Responsive Tokens

- Radii: xs 4px, sm 6px, md 8px, lg 12px, xl 16px, full pill; aliases for
  card/button/field are declared.
- Breakpoints: 360, 480, 576, 640, 768, 1024, 1280 px. Mixins emit both media
  and container queries for most breakpoint names, with dedicated
  viewport/container variants.
- Spacing tokens include 4/8/12/20px vertical gaps. Transition fast/normal are
  150/200ms.
- A condensed control tier is 32px, explicitly intended for dense desktop
  columns; regular input controls vary by component.

## Typography and Data Tables (2026-10-07)

Type scale tokens in `_variables.scss` are the same on phones and desktop:

| Token | Size | Use |
| --- | --- | --- |
| `$fs-caption` | 13px | badges, table headers, chart legends and ticks — the floor |
| `$fs-small` | 14px | helper text, metadata, secondary labels, compact buttons |
| `$fs-body` | 16px | body copy, table values, inputs |
| `$fs-body-lg` / `$fs-h4` / `$fs-h3` | 18 / 20 / 24px | emphasis and headings |

Two deliberate phone exceptions: the eyebrow badge above a page H1 uses
`@include page-badge-text` (11px below 640px, 13px above), and page H1s use
`$fs-title-mobile` (20px) below 640px (`$fs-hero-mobile`, 28px, for the
landing hero). Body line-height is 1.45. Game-board cell text is excluded:
boards size it to the board and have their own text-size control.

Nothing may scroll horizontally on any device. Wide tables use
`@include stacked-table-container` on their wrapper and
`@include stacked-table($below)` as the last rule of the table block
(960px for 7+ columns, 800px for 5–6, 640px for up to 4): below that container
width every row becomes a card of `data-label` / value lines, so every `<td>`
needs `data-label`, and a full-width cell takes `data-full`. Chip rows wrap
instead of scrolling, and multi-column layouts decide by the space they
actually have (the sidebar takes 240px), not by viewport width alone.

Dialogs on phones (below 640px) size to the visual viewport, not the layout
viewport, because the on-screen keyboard only shrinks the former.
`VisualViewportVars` (mounted in `AppClientLayout`) publishes `--vv-height` /
`--vv-top`. Every overlay ends its block with `@include below-app-chrome` —
`(true)` for full-screen sheets (forms, lists, multi-tab dialogs) paired with
`dialog-sheet-panel`, or the default paired with `dialog-compact-panel` for
short confirmations. Dialog content scrolls inside the panel, never the page.

Dialog chrome on phones is styled once, globally, in `src/styles/_base.scss`
(below `$bp-tablet`). Mark a dialog's header with `data-dialog-header`, its
title with `data-dialog-title` and its footer with `data-dialog-footer`; the
global rules give them 4px vertical padding and gaps, a 1.15 line-height, an 8%
primary tint with an 18% primary border, and a 0.8rem title (`h1`–`h3` inside the
header too). This is the single deliberate `!important` override and the
requested exception to the 13px caption floor — do not restyle dialog headers
per module on phones; tag new dialogs instead.

## Components and Patterns

CSS Modules with Sass are the primary style architecture; tokens/mixins are
shared through `src/styles/index.scss`. Common patterns include value pickers,
paired controls, selectors, charts, navigation, dialogs, game HUDs,
loading/skeletons, and result cards. `react-icons` supplies iconography
(e.g. the chart zoom toolbar's Reset button uses `RxReset`). Some
components use plain inline styles, component-specific tokens, or duplicated
local styles, so global consistency is not guaranteed.

### Fund statistic cards

Mutual fund (`FundStatsCard`), SIP (`SipStatCard`) and SWP (`SwpStatCard`)
result cards share one layout, styled by the `mfCard*` / `swp*` classes in
`src/views/MutualFundAnalytics.module.scss`:

- Header: fund colour dot, cleaned scheme name (full name kept in `title`) and
  a decorative chevron.
- Tag pills from `parseFundSchemeDetails` (`src/utilities/mutual-fund/mfCardDetails.ts`):
  category (tinted with the fund colour via `color-mix`), plan
  (Direct/Regular) and option (Growth/IDCW). The parser also strips
  "(erstwhile …)" and the "- Direct Plan / - Growth / - IDCW" suffixes from the
  displayed name.
- Mutual fund card: Current Value with signed profit/loss and absolute %,
  CAGR (C) / Absolute (A) metrics, then NAV start → end with a small up/down
  trend SVG.
- SIP/SWP cards: CAGR (XIRR) and Absolute Return on top, NAV progression,
  Invested Amount / Current Value / Gain / Loss columns, and a footer row
  (SIP: Installments, Units, Avg. Buy Price; SWP: Instalments, Units Left,
  Avg. Buy Price).
- Gains use `textSuccess`, losses `textError`; the skeleton shows until both
  start and end NAV are known.

On the FII/DII tracker the Index Benchmarks card (Nifty 50 / Sensex closing and
period change, CPI/PPP footer) is the first summary card, ahead of the FII and
DII flow cards.

## Feedback and Accessibility Patterns

Focus ring and button-reset/pressable mixins exist. Global CSS suppresses tap
highlight and uses `touch-action`; controls have `aria-label`, live regions,
semantic sections and dialog roles in multiple subsystems. Several modules set
`outline: none`; keyboard focus behavior must be checked per control. See
accessibility audit.

## Governance Gap

No authoritative design-token source outside SCSS, component usage standards,
approved contrast report, icon rules, or design-system owner is recorded. Owner:
UNKNOWN.
