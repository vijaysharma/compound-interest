# Design System

Status: Source-backed visual inventory; no design-team specification found
Source: `src/styles/_theme.scss`, `_variables.scss`, `_mixins.scss`,
`_base.scss`, `src/index.scss`, component SCSS modules Last Verified: 2026-10-05
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

## Components and Patterns

CSS Modules with Sass are the primary style architecture; tokens/mixins are
shared through `src/styles/index.scss`. Common patterns include value pickers,
paired controls, selectors, charts, navigation, dialogs, game HUDs,
loading/skeletons, and result cards. `react-icons` supplies iconography. Some
components use plain inline styles, component-specific tokens, or duplicated
local styles, so global consistency is not guaranteed.

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
