# Mobile-First Design Guide

Status: Source-backed patterns; not a viewport-by-viewport visual certification
Source: `src/styles/_variables.scss`, `_mixins.scss`, `_base.scss`, responsive
component modules Last Verified: 2026-10-05 Confidence: MEDIUM; no manual device
matrix executed Owner: UNKNOWN Related Documents:
[Design system](DESIGN_SYSTEM.md), [accessibility audit](ACCESSIBILITY_AUDIT.md)

## Existing Responsive Conventions

- Breakpoints are mobile-first at 360/480/576/640/768/1024/1280px; shared mixins
  generally emit viewport and container queries.
- Under 768px, text inputs/selects/textareas are forced to 16px to prevent iOS
  Safari focus zoom.
- The body uses `min-height: 100dvh` and hides horizontal overflow. This
  improves viewport handling but can mask horizontal overflow defects if a child
  is clipped.
- App shell combines sticky top bar and sidebar; mobile drawer implementation is
  under `src/components/topbar/` and sidebar components.
- Charts, tables, calculator inputs, games, and admin surfaces each have local
  breakpoints; no single responsive component contract was found.
- Several newer game and history dialogs have explicit 44px touch target
  comments/styles, but this is not a platform-wide enforced rule.

## Validation Required Before UX Certification

No Playwright/browser viewport, orientation, zoom, touch, or screen-reader audit
was run during this documentation pass. Validate representative routes at
320/360/390/640/768/1024px, portrait/landscape, virtual keyboard visible, with
long labels/data, and with browser zoom. Pay special attention to:

- FII/DII chart axes and control wrapping;
- large financial values inside summary cards;
- admin tables and customer/order filters;
- PPF/notes dialogs and keyboard/scroll locking;
- game boards, tile sizing, control reachability and zoom;
- sidebar/drawer focus and route-loading feedback;
- errors and empty states with no horizontal scroll.

Responsive breakpoints are verified in source; usability at each size is NOT
VERIFIED.
