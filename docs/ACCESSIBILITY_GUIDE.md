# Accessibility Guide

Status: Source-backed implementation notes; not an accessibility conformance
claim Source: Shared components, `src/styles/_mixins.scss`, game/dialog views,
calculator views Last Verified: 2026-10-05 Confidence: MEDIUM Owner: UNKNOWN
Related Documents: [Accessibility audit](ACCESSIBILITY_AUDIT.md),
[design system](DESIGN_SYSTEM.md), [mobile guide](MOBILE_FIRST_DESIGN_GUIDE.md)

## Existing Patterns to Preserve

- Use native labels/inputs and retain descriptive `aria-label`s on icon-only
  controls.
- Use `:focus-visible` rings where available; shared `focus-ring` mixin is
  defined.
- Use semantic `role="dialog"`, `aria-modal`, labelled regions and live regions
  for status updates where present.
- Maintain page language `en`, heading hierarchy and labelled navigation areas.
- Respect touch behavior and the global 16px minimum input text below 768px.

## Change-Safe Checklist

1. Every input has a programmatic label and meaningful error text.
2. All actions are keyboard reachable with visible focus; Enter/Space behavior
   is explicit for non-native controls.
3. Dialog open/close, focus entry/return, Escape handling, scroll lock and focus
   containment are tested.
4. Live updates use concise status semantics and avoid announcing every
   chart/data update.
5. Color is not the sole signal; chart series include legend/labels and
   sufficient contrast.
6. Motion has reduced-motion support for any newly added animation.
7. Interactive target sizing and reading order are checked at mobile sizes.
8. Verify with keyboard-only and screen reader, not source inspection alone.

No formal WCAG level is claimed by this guide.
