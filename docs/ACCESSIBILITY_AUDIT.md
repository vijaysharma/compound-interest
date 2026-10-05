# Accessibility Audit

Status: Static source inspection only; manual audit NOT PERFORMED Source:
`src/styles/_mixins.scss`, component/view JSX and SCSS modules Last Verified:
2026-10-05 Confidence: LOW-to-MEDIUM; coverage sampling only Owner: UNKNOWN
Related Documents: [Accessibility guide](ACCESSIBILITY_GUIDE.md),
[risk register](RISK_REGISTER.md)

## Positives Observed

- Shared focus ring mixins and several explicit `:focus-visible` styles exist.
- ARIA labels are present for many icon buttons, navigation, chart controls,
  game cells, and controls.
- Status/live regions exist for toast, game progress, and some FII/DII updates.
- Dialog semantics are present in multiple game and admin/PPF modal components.
- Native semantic controls are used for many calculators.

## Findings / Gaps

| Area           | Observation                                                                                                                        | Classification                                             |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Keyboard focus | Multiple SCSS modules contain `outline: none`; each affected control must prove an equivalent focus state                          | Potential accessibility defect; route-level check required |
| Dialog focus   | Source includes dialog roles and close actions, but focus trap, initial focus, and focus restoration are not consistently verified | NOT VERIFIED                                               |
| Reduced motion | Found in some game styling; a global reduced-motion policy was not found                                                           | DOCUMENTATION GAP                                          |
| Contrast       | Tokens exist, but no contrast measurements or automated checks were found                                                          | NOT VERIFIED                                               |
| Charts         | Some chart controls/labels are accessible; screen-reader chart data alternatives are not established consistently                  | PARTIALLY VERIFIED                                         |
| Tables/forms   | Labels and ARIA exist in many areas; no automated axe/Playwright test dependency or CI job found                                   | DOCUMENTATION GAP                                          |
| Touch targets  | Some component-specific 44px sizing exists; no global enforcement                                                                  | PARTIALLY VERIFIED                                         |

No manual screen reader, keyboard, color contrast, zoom/reflow, or browser test
was performed. Do not claim WCAG AA conformance.
