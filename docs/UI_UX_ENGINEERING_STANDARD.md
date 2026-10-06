# UI/UX ENGINEERING STANDARD

## Mobile-First Responsive, Accessible & Legible Interface Standard

**Status:** Engineering Standard  
**Applies to:** Entire application  
**Priority:** Mandatory  
**Primary objective:** Excellent usability on mobile devices first, then
progressively enhanced for tablets and desktops.

---

# 1. PURPOSE

This application is a financial calculation and financial-analysis platform.

Users must be able to:

- read financial values comfortably
- enter financial information without zooming
- understand labels and instructions
- operate forms using touch
- read results and tables
- use calculators comfortably on small screens
- navigate with one hand where practical
- use the application with keyboard and screen reader
- understand errors and validation messages
- distinguish primary and secondary actions

The interface must prioritize:

> **Legibility → Usability → Accessibility → Consistency → Density**

Do not optimize for maximum information density at the expense of readability.

---

# 2. CORE PRINCIPLES

Every UI implementation must follow these principles:

1. Mobile-first.
2. Content-first.
3. Accessible by default.
4. Touch-friendly.
5. Keyboard-friendly.
6. No unnecessary zooming.
7. No horizontal scrolling for normal page content.
8. No text smaller than the defined minimum.
9. No excessively narrow form controls.
10. No tiny buttons or links.
11. No interaction that depends exclusively on hover.
12. No information communicated by color alone.
13. No unnecessary decorative UI.
14. Maintain consistent spacing.
15. Maintain consistent control heights.
16. Preserve readable line lengths.
17. Preserve clear visual hierarchy.
18. Financial numbers must remain easy to scan.
19. Responsive behavior must be deterministic.
20. Components must adapt rather than merely shrink.

---

# 3. RESPONSIVE DESIGN STRATEGY

Use a **mobile-first CSS strategy**.

Start with the smallest supported viewport and progressively enhance.

Do NOT design desktop first and then attempt to squeeze the interface onto
mobile.

Use:

```text
Mobile
  ↓
Large Mobile
  ↓
Tablet
  ↓
Desktop
  ↓
Large Desktop
```

---

# 4. STANDARD BREAKPOINTS

Use the following breakpoint system unless a component has a documented reason
to deviate.

| Name |       Width | Purpose                     |
| ---- | ----------: | --------------------------- |
| XS   |     0–359px | Very small devices          |
| SM   |   360–639px | Standard mobile             |
| MD   |   640–767px | Large mobile / small tablet |
| LG   |  768–1023px | Tablet                      |
| XL   | 1024–1279px | Desktop                     |
| 2XL  | 1280–1535px | Large desktop               |
| 3XL  |     1536px+ | Wide desktop                |

Recommended CSS breakpoints:

```scss
$breakpoint-sm: 360px;
$breakpoint-md: 640px;
$breakpoint-lg: 768px;
$breakpoint-xl: 1024px;
$breakpoint-2xl: 1280px;
$breakpoint-3xl: 1536px;
```

Prefer **content-driven responsive behavior** over device-specific assumptions.

Do not create breakpoints merely for individual devices such as:

- iPhone
- Samsung
- Pixel
- iPad
- MacBook

Use layout requirements instead.

---

# 5. PRIMARY DESIGN TARGETS

The minimum primary testing widths are:

```text
320px
360px
375px
390px
414px
480px
640px
768px
1024px
1280px
1440px
1536px
```

The application must remain usable at:

- 320px
- 360px
- 375px
- 390px
- 414px

without requiring users to zoom.

---

# 6. MOBILE VIEWPORT REQUIREMENTS

At mobile widths:

- no unintended horizontal page scrolling
- no clipped text
- no overlapping controls
- no controls extending outside the viewport
- no fixed-width desktop containers
- no tiny typography
- no microscopic icons
- no inaccessible dropdowns
- no side-by-side fields unless genuinely appropriate
- no tables that make the entire page horizontally scroll unnecessarily

Use:

```css
width: 100%;
max-width: 100%;
```

where appropriate.

Avoid:

```css
width: 600px;
min-width: 500px;
```

inside normal mobile layouts.

---

# 7. CONTAINER WIDTH

Use a centered responsive content container.

Recommended:

```text
Mobile:
100% width
16px horizontal padding

Tablet:
24px horizontal padding

Desktop:
32px horizontal padding

Large desktop:
32–48px horizontal padding
```

Recommended maximum content widths:

```text
Reading content:
720–800px

Forms/calculators:
720–960px

Dashboard/content:
1200–1280px

Wide analytical layouts:
1440px maximum
```

Do not allow normal text paragraphs to span extremely wide screens.

---

# 8. SAFE AREA

Support mobile safe-area insets where appropriate.

For fixed bottom navigation or controls:

```css
padding-bottom: env(safe-area-inset-bottom);
```

Do not allow fixed UI to cover:

- form fields
- submit buttons
- error messages
- important financial results
- navigation

---

# 9. TYPOGRAPHY

Typography must prioritize readability.

Use a highly legible system or approved web font.

Recommended fallback:

```text
system-ui,
-apple-system,
BlinkMacSystemFont,
"Segoe UI",
Roboto,
Arial,
sans-serif
```

Avoid decorative fonts for application UI.

---

# 10. BASE FONT SIZE

Minimum application body text:

```text
16px
```

Do NOT use:

```text
12px
13px
14px
```

for normal body content.

14px may be used only for:

- secondary metadata
- helper text
- timestamps
- compact supporting information

and only where contrast remains strong.

Never use tiny typography to solve layout problems.

---

# 11. TYPE SCALE

Recommended base scale:

| Purpose    |    Size |
| ---------- | ------: |
| Display    | 32–40px |
| H1         | 28–32px |
| H2         | 24–28px |
| H3         | 20–24px |
| H4         | 18–20px |
| Body Large |    18px |
| Body       |    16px |
| Body Small |    14px |
| Caption    | 13–14px |

Mobile headings may be reduced slightly, but body text should remain
approximately 16px.

---

# 12. LINE HEIGHT

Recommended:

```text
Body:
1.5–1.6

Headings:
1.15–1.3

Buttons:
1.2–1.4

Form labels:
1.3–1.5

Helper/error text:
1.4–1.5
```

Avoid tightly packed paragraphs.

---

# 13. TEXT WIDTH

Readable text should generally remain within:

```text
45–80 characters per line
```

Ideal long-form reading width:

```text
60–75 characters
```

Do not allow financial explanations to stretch across a 1440px screen.

---

# 14. FONT WEIGHTS

Recommended:

```text
400 — normal text
500 — labels / secondary emphasis
600 — headings / important labels
700 — major headings / strong emphasis
```

Avoid excessive use of 700/800 weight.

Do not make entire interfaces visually bold.

---

# 15. FINANCIAL NUMBERS

Financial values require special treatment.

Use:

- strong visual hierarchy
- clear currency symbols
- consistent decimal precision
- readable digit spacing
- adequate contrast
- tabular numerals where available

For important financial figures:

```css
font-variant-numeric: tabular-nums;
```

Use tabular numbers for:

- SIP values
- corpus
- investment amount
- returns
- interest
- percentages
- currency conversion
- withdrawal amounts
- projections

This makes columns and result cards easier to scan.

---

# 16. NUMBER FORMATTING

Never force users to visually parse unnecessarily long raw numbers.

Prefer:

```text
₹12,50,000
```

over:

```text
1250000
```

Where the context requires precision, show the exact value separately.

Do not hide precision merely for visual simplicity.

---

# 17. FORM DESIGN

Forms are a critical part of this application.

Every form must have:

```text
Label
Input
Optional helper text
Validation
Error message
```

Example structure:

```text
Investment Amount
[ ₹ 1,00,000             ]

Enter the amount you want to invest.

```

Do not rely exclusively on placeholder text as a label.

---

# 18. FORM LABELS

Every input must have a persistent visible label.

Do NOT use:

```text
[ Enter investment amount ]
```

as the only label.

Prefer:

```text
Investment Amount
[ ₹ 1,00,000 ]
```

Labels must remain visible after the user starts typing.

---

# 19. INPUT HEIGHT

Standard input height:

```text
48px minimum
```

Preferred:

```text
48–52px
```

For high-touch mobile interfaces:

```text
52–56px
```

Avoid 32px or 36px controls on mobile.

---

# 20. TOUCH TARGET SIZE

Interactive elements should generally provide a minimum target of:

```text
44 × 44px
```

Preferred:

```text
48 × 48px
```

This applies to:

- buttons
- icon buttons
- checkboxes
- radio buttons
- select controls
- navigation items
- close buttons
- menu items
- pagination controls

The visible icon can be smaller.

The **interactive hit area must not be unnecessarily small**.

---

# 21. FORM INPUT FONT SIZE

All mobile form inputs must use:

```text
16px minimum
```

This is especially important for iOS Safari.

Do NOT use 14px or smaller text inside editable inputs.

Primary rule:

> **Never require browser zoom merely to enter form data.**

---

# 22. MOBILE INPUT ZOOM PREVENTION

Editable controls on mobile must use at least:

```css
font-size: 16px;
```

Do not solve mobile input zoom by disabling user scaling through viewport
configuration.

Do NOT use:

```html
user-scalable=no maximum-scale=1
```

to compensate for undersized controls.

The correct solution is properly sized controls and typography.

---

# 23. INPUT WIDTH

Inputs should generally occupy the available container width.

Preferred:

```text
width: 100%;
```

Avoid unnecessarily narrow fields.

For related short fields, horizontal grouping may be used only when:

- each field remains comfortably usable
- labels remain readable
- touch targets remain adequate
- the layout does not become cramped

---

# 24. MOBILE FORM LAYOUT

Default mobile form layout:

```text
Label
Input
Helper/Error
↓
Spacing
↓
Label
Input
Helper/Error
```

Do not force multi-column forms onto mobile.

Desktop may use:

```text
Field A        Field B
Field C        Field D
```

Mobile should generally become:

```text
Field A

Field B

Field C

Field D
```

---

# 25. FORM SPACING

Recommended:

```text
Label → Input:
6–8px

Input → Helper text:
6–8px

Field → Field:
20–24px

Section → Section:
32–40px
```

Do not compress forms merely to fit more fields above the fold.

---

# 26. FORM FIELD GROUPING

Related fields should be grouped.

Example:

```text
Investment Details

Investment Amount
Monthly SIP
Expected Return
Investment Duration
```

Use clear section headings.

Avoid presenting a long unstructured list of inputs.

---

# 27. PLACEHOLDERS

Placeholders are hints, not labels.

Good:

```text
Investment Amount
[ ₹ 1,00,000 ]
```

Optional placeholder:

```text
e.g. ₹1,00,000
```

Bad:

```text
[ Investment Amount ]
```

where no persistent label exists.

---

# 28. INPUT TYPES

Use the correct semantic input type.

Examples:

```html
type="number" type="email" type="date" type="tel"
```

However, ensure financial inputs behave correctly across mobile browsers.

For numeric financial inputs, consider:

```text
inputmode="decimal"
```

or an appropriate numeric input mode.

---

# 29. FINANCIAL INPUTS

Financial fields should:

- clearly identify currency
- accept appropriate decimal values
- reject invalid characters where appropriate
- provide understandable validation
- preserve user-entered values when validation fails
- avoid surprising auto-formatting
- avoid cursor-jumping
- avoid destructive formatting while typing

Formatting can be applied carefully on blur or in display contexts.

---

# 30. PERCENTAGE INPUTS

Clearly distinguish:

```text
12
```

from:

```text
12%
```

The UI should make the expected input obvious.

Preferred:

```text
Expected Return
[ 12.0                 ] %
```

Avoid requiring users to type `%` unless there is a strong reason.

---

# 31. CURRENCY INPUTS

Clearly display currency.

Preferred:

```text
Investment Amount
[ ₹ 1,00,000 ]
```

or:

```text
₹
[ 1,00,000 ]
```

Do not make currency context ambiguous.

---

# 32. SELECT / DROPDOWN

Select controls must have:

- visible label
- sufficient height
- clear selected state
- accessible keyboard behavior
- adequate touch target

Mobile dropdowns should use the native mobile interaction when appropriate
rather than unnecessarily replacing it with a tiny custom control.

---

# 33. CHECKBOXES

Checkboxes should have:

- adequate hit area
- visible label
- clear selected/unselected state
- keyboard support

The entire label should preferably be clickable.

---

# 34. RADIO BUTTONS

Radio groups must:

- have a visible group label
- clearly indicate selected option
- support keyboard navigation
- provide adequate touch targets

Do not use radio buttons for large lists.

---

# 35. BUTTON STANDARD

Primary buttons:

```text
Minimum height: 48px
Preferred height: 48–52px
```

Mobile:

```text
Full width when appropriate
```

Desktop:

```text
Content-width or defined width
```

Buttons must have clear:

- label
- hierarchy
- state
- feedback

---

# 36. BUTTON LABELS

Prefer explicit actions:

```text
Calculate SIP
Calculate SWP
Compare Plans
Analyze Portfolio
Reset Calculator
Save Calculation
```

Avoid ambiguous:

```text
Submit
Go
OK
Click Here
```

---

# 37. BUTTON HIERARCHY

Use a clear hierarchy:

### Primary

Main action.

Example:

```text
Calculate
```

### Secondary

Alternative action.

Example:

```text
Reset
```

### Tertiary

Low-emphasis action.

Example:

```text
View assumptions
```

Do not make every button visually primary.

---

# 38. BUTTON WIDTH

Do not make every desktop button full width.

On mobile, full-width primary actions are often appropriate.

For forms:

```text
[ Calculate Returns ]
```

is preferred over an unnecessarily tiny button.

---

# 39. BUTTON STATES

Every interactive button should account for:

```text
Default
Hover
Focus
Active
Disabled
Loading
Success
Error
```

Do not rely exclusively on color differences.

Loading state must prevent accidental duplicate submissions.

---

# 40. LINKS

Links must look and behave like links.

Do not make ordinary links indistinguishable from body text.

Links must have:

- visible distinction
- keyboard focus
- sufficient contrast
- adequate hit area

Avoid using underlines only where they create visual clutter, but maintain an
unmistakable distinction in body content.

---

# 41. ICON-ONLY CONTROLS

Icon-only buttons require:

- accessible name
- tooltip where useful
- minimum touch target
- clear iconography
- visible focus state

Never assume users understand an icon without context.

---

# 42. FOCUS STATES

Every interactive control must have a visible focus state.

Never use:

```css
outline: none;
```

without providing an equivalent accessible focus indicator.

Focus indicators should be:

- clearly visible
- high contrast
- not clipped
- not dependent solely on color

---

# 43. ERROR MESSAGES

Errors must appear close to the affected field.

Example:

```text
Investment Amount
[ -5000 ]

Investment amount must be greater than zero.
```

Do not rely solely on:

- red borders
- icons
- toast notifications

Error text must explain how to fix the problem where practical.

---

# 44. SUCCESS / FEEDBACK

Important actions should provide clear feedback.

Examples:

```text
Calculation complete
Portfolio saved
Data updated
```

Avoid excessive toast notifications.

Critical information should remain visible in the page context.

---

# 45. FINANCIAL RESULT PRESENTATION

Calculator results should be visually prioritized.

Preferred structure:

```text
Investment Summary

Invested Amount
₹12,00,000

Estimated Value
₹19,50,000

Estimated Returns
₹7,50,000

Annualized Return
12.4%
```

Use whitespace and hierarchy.

Do not create visually dense walls of numbers.

---

# 46. RESULT CARDS ON MOBILE

On mobile:

Prefer:

```text
Result
₹19,50,000
```

rather than forcing several columns.

Example:

```text
Invested Amount
₹12,00,000

Estimated Value
₹19,50,000

Returns
₹7,50,000
```

Use horizontal layouts only when values remain comfortably readable.

---

# 47. TABLES

Financial tables require special handling.

On mobile:

1. Prefer card/list transformation where appropriate.
2. If a true table is necessary, allow controlled horizontal scrolling within
   the table container.
3. Do not make the entire page horizontally scroll.
4. Keep headers understandable.
5. Preserve numeric alignment.
6. Use sticky headers only where it genuinely improves usability.

Never shrink table text to unreadable sizes merely to force the entire table
onto mobile.

---

# 48. CHARTS

Charts must remain usable on mobile.

Requirements:

- responsive width
- readable labels
- touch-friendly interaction
- meaningful tooltips
- no microscopic legends
- accessible summary where possible

Do not depend exclusively on color to distinguish datasets.

---

# 49. NAVIGATION

Mobile navigation should prioritize the most important destinations.

Avoid:

- overcrowded bottom navigation
- tiny menu items
- deeply nested navigation
- hidden essential actions

Navigation controls must meet touch-target requirements.

---

# 50. MODALS / DIALOGS

On mobile:

Prefer:

- full-width or near-full-width dialogs
- sufficient internal padding
- scrollable content
- accessible close control
- focus management

Avoid tiny centered desktop-style dialogs containing large forms.

---

# 51. DRAWERS / SHEETS

For mobile filters, settings, and secondary actions:

Use bottom sheets or full-height drawers where appropriate.

Ensure:

- keyboard accessibility
- focus management
- escape/close behavior
- sufficient touch targets
- content remains scrollable

---

# 52. SPACING SYSTEM

Use a consistent spacing scale.

Recommended base:

```text
4px
8px
12px
16px
20px
24px
32px
40px
48px
64px
```

Avoid arbitrary values unless necessary.

Prefer:

```text
16px
24px
32px
```

over many unrelated spacing values.

---

# 53. MOBILE PAGE PADDING

Recommended:

```text
320–639px:
16px

640–767px:
20–24px

768–1023px:
24px

1024px+:
32px
```

Never allow content to touch the viewport edge unless intentionally designed.

---

# 54. CARD DESIGN

Cards should be used to group related information.

Do not wrap every piece of information inside a card.

Cards should have:

- clear hierarchy
- sufficient padding
- adequate separation
- consistent radius
- predictable interaction

On mobile:

```text
Padding:
16px
```

is a good default.

---

# 55. RESPONSIVE BEHAVIOR

Components should follow this progression:

### Mobile

- single column
- full-width inputs
- stacked actions
- simplified navigation
- readable financial results

### Tablet

- controlled two-column layouts
- increased whitespace
- wider result groups

### Desktop

- multi-column layouts where useful
- larger content areas
- side-by-side comparisons
- dashboards

### Wide desktop

Do NOT simply stretch everything.

Maintain readable maximum widths.

---

# 56. DESKTOP DENSITY

Desktop provides more space but does not justify excessive density.

Avoid:

```text
tiny text
tiny controls
many unrelated cards
dense dashboards
```

Whitespace remains important.

---

# 57. HORIZONTAL SCROLL

Normal pages must never require horizontal scrolling.

Allowed exceptions:

- large financial tables
- code
- specialized data visualizations

Horizontal scrolling must be confined to the component.

Bad:

```text
Entire page → horizontal scroll
```

Good:

```text
Page
 └── Table container → horizontal scroll
```

---

# 58. MOBILE KEYBOARD

When the mobile keyboard opens:

- focused field must remain visible
- submit action must remain accessible
- validation messages must not be hidden
- dialogs must resize correctly
- sticky UI must not cover the input

Test forms with the keyboard open.

---

# 59. AUTOFILL

Use appropriate:

- autocomplete
- input types
- names
- labels

to support browser autofill.

Do not disable autofill without a legitimate security reason.

---

# 60. ACCESSIBILITY TARGET

Target:

> **WCAG 2.2 AA**

where applicable.

Minimum considerations:

- keyboard access
- focus visibility
- semantic HTML
- labels
- contrast
- touch targets
- screen reader compatibility
- error identification
- status messaging
- reduced motion

---

# 61. COLOR CONTRAST

Text and interactive elements must maintain accessible contrast.

Do not use:

- light gray body text
- low-contrast placeholders
- subtle disabled states that become unreadable
- color-only validation

Financial information must remain readable under varying brightness conditions.

---

# 62. DARK MODE

If dark mode exists, every component must be tested independently.

Do not assume that changing background and text colors is sufficient.

Check:

- inputs
- placeholders
- borders
- charts
- financial values
- error states
- success states
- disabled controls
- focus states

---

# 63. REDUCED MOTION

Respect:

```css
prefers-reduced-motion
```

Animations must not interfere with:

- form interaction
- financial results
- navigation
- accessibility

Avoid unnecessary animation.

---

# 64. MOBILE-FIRST IMPLEMENTATION STANDARD

CSS should generally follow:

```scss
.component {
  /* Mobile default */
}

@media (min-width: 640px) {
  /* Large mobile / small tablet */
}

@media (min-width: 768px) {
  /* Tablet */
}

@media (min-width: 1024px) {
  /* Desktop */
}

@media (min-width: 1280px) {
  /* Large desktop */
}
```

Do not build a desktop layout and then override dozens of properties downward.

---

# 65. CONTAINER QUERY PREFERENCE

Where component behavior depends on available component width rather than
viewport width, consider CSS container queries.

Use viewport breakpoints for:

- page navigation
- global layout
- page-level structure

Use container queries where appropriate for:

- reusable cards
- widgets
- calculator modules
- dashboard components

---

# 66. DO NOT USE DEVICE DETECTION

Do not write logic such as:

```javascript
if (isMobile) {
   ...
}
```

for ordinary responsive layout.

Prefer CSS responsive behavior.

Use JavaScript device detection only when there is a genuine behavioral
requirement that CSS cannot solve.

---

# 67. NO MAGIC PIXELS

Avoid arbitrary fixed dimensions.

Bad:

```css
width: 347px;
height: 43px;
margin-left: 19px;
```

Prefer:

```css
width: 100%;
max-width: 480px;
min-height: 48px;
padding: 16px;
gap: 16px;
```

---

# 68. ACCESSIBLE TOUCH TARGET IMPLEMENTATION

If an icon itself is 20px:

Do not enlarge the icon unnecessarily.

Instead provide:

```text
20px icon
inside
44–48px interactive target
```

This preserves visual design while maintaining accessibility.

---

# 69. MOBILE VISUAL HIERARCHY

Every mobile screen should make the following obvious within seconds:

1. Where am I?
2. What can I do here?
3. What information do I need?
4. What is the primary action?
5. What result did I get?
6. What should I do next?

---

# 70. FINANCIAL CALCULATOR STANDARD

Every calculator should generally follow:

```text
Title
↓
Short explanation
↓
Input section
↓
Primary action
↓
Result
↓
Supporting explanation
↓
Assumptions
↓
Detailed breakdown
```

Do not force users to scroll through large explanations before reaching the
calculator.

---

# 71. INPUT → RESULT RELATIONSHIP

The user must be able to understand:

```text
What I entered
        ↓
What was calculated
        ↓
What assumptions were used
        ↓
What result I received
```

Do not hide assumptions.

---

# 72. FINANCIAL ASSUMPTIONS

Where calculations depend on assumptions, display them clearly.

Examples:

```text
Expected return: 12%
Inflation: 6%
Investment duration: 20 years
Withdrawal rate: 4%
```

Use a secondary section if necessary, but do not hide critical assumptions.

---

# 73. RESPONSIVE CALCULATOR LAYOUT

Desktop:

```text
┌───────────────────────┬───────────────────────┐
│ Inputs                │ Results               │
│                       │                       │
│ Amount                │ Corpus                │
│ Return                │ Returns               │
│ Duration              │ Chart                 │
│                       │                       │
│ [ Calculate ]         │                       │
└───────────────────────┴───────────────────────┘
```

Mobile:

```text
Inputs

Amount
[                 ]

Return
[                 ]

Duration
[                 ]

[ Calculate ]

Results

Corpus
₹...

Returns
₹...

Chart
```

---

# 74. FORM VALIDATION TIMING

Avoid aggressive validation while users are typing.

Prefer:

- validation on blur
- validation on submit
- immediate validation only where clearly helpful

Do not repeatedly interrupt the user with errors while entering a value.

---

# 75. ERROR PRESERVATION

When validation fails:

- preserve valid user input
- identify the problematic field
- explain the problem
- avoid resetting the entire form

---

# 76. LOADING STATES

For calculations and AI analysis:

Show meaningful progress.

Examples:

```text
Calculating...
Analyzing...
Fetching latest data...
```

Do not use indefinite spinners without context where a meaningful message can be
provided.

---

# 77. AI RESULTS

AI-generated financial analysis must visually distinguish:

```text
Calculated result
```

from:

```text
AI interpretation
```

The user must never confuse AI-generated commentary with authoritative
calculated data.

---

# 78. RESPONSIVE AI CHAT

AI interfaces must remain usable on mobile.

Requirements:

- 16px minimum input text
- large touch target
- keyboard-safe layout
- visible send action
- scrollable conversation
- no content hidden behind fixed composer
- long responses must wrap correctly
- financial numbers must remain readable

---

# 79. LINKS AND TEXT WRAPPING

Long URLs, identifiers, or financial terminology must not cause layout overflow.

Use:

```css
overflow-wrap: anywhere;
```

where appropriate.

Do not allow long text to break the mobile layout.

---

# 80. IMAGE AND ICON SIZING

Images must:

- remain within containers
- preserve aspect ratio
- avoid layout shift
- have meaningful alt text where required

Icons must not dominate the UI.

---

# 81. RESPONSIVE QA MATRIX

Every significant screen should be checked at:

```text
320 × 667
360 × 800
375 × 812
390 × 844
414 × 896
768 × 1024
1024 × 768
1280 × 800
1440 × 900
1536 × 864
```

Check:

- layout
- text
- forms
- buttons
- navigation
- tables
- charts
- errors
- dialogs
- keyboard
- scrolling

---

# 82. MOBILE ACCEPTANCE CRITERIA

A screen is NOT considered mobile-ready if:

- user must zoom to read normal text
- user must zoom to interact with a form
- inputs use less than 16px text
- controls are difficult to tap
- content is clipped
- page has unintended horizontal scroll
- buttons overlap
- labels disappear
- error messages are hidden
- keyboard covers the active field
- financial numbers become unreadable
- charts become unusable
- navigation becomes ambiguous

---

# 83. DESKTOP ACCEPTANCE CRITERIA

A desktop screen is NOT considered complete if:

- content is unnecessarily stretched
- text lines become excessively long
- controls become too small
- large unused whitespace dominates
- information hierarchy is unclear
- forms become unnecessarily wide
- financial values lose visual hierarchy

---

# 84. COMPONENT STANDARD

Every reusable UI component should define:

```text
Purpose
Inputs
Outputs
Responsive behavior
Accessibility behavior
States
Error states
Loading states
Mobile behavior
Desktop behavior
```

---

# 85. DESIGN TOKEN STANDARD

Where a design-token system exists, centralize:

```text
colors
typography
spacing
radii
shadows
breakpoints
control heights
z-index
motion
```

Do not scatter repeated values across components.

---

# 86. DO NOT CREATE ONE-OFF UI RULES

If the same UI pattern appears multiple times:

> Create or reuse a standardized component/token/pattern.

Examples:

- FormField
- CurrencyInput
- PercentageInput
- NumberInput
- PrimaryButton
- SecondaryButton
- ResultCard
- SectionHeader
- ErrorMessage
- HelpText

Do not duplicate slightly different implementations.

---

# 87. COMPONENT CONSISTENCY

The same interaction should look and behave consistently throughout the
application.

For example:

Every currency field should have consistent:

- label
- currency display
- height
- spacing
- validation
- error presentation
- mobile behavior

---

# 88. DESIGN SYSTEM GOVERNANCE

Before introducing a new UI pattern, ask:

1. Does an existing component solve this?
2. Does an existing token solve this?
3. Can the existing component be extended?
4. Is the new behavior genuinely different?

Avoid design-system fragmentation.

---

# 89. MOBILE-FIRST DEFINITION OF DONE

A UI feature is complete only when:

- mobile layout works
- 320px works
- 360px works
- 390px works
- 414px works
- tablet works
- desktop works
- keyboard navigation works
- focus is visible
- inputs are ≥16px
- touch targets are ≥44px
- no unintended horizontal scroll exists
- text is readable
- forms are understandable
- validation works
- loading works
- error states work
- accessibility requirements are met

---

# 90. AGENT ENFORCEMENT RULES

Any AI coding agent working on this repository MUST:

1. Follow this standard before introducing UI changes.
2. Reuse existing design tokens.
3. Reuse existing components.
4. Preserve mobile-first behavior.
5. Never introduce a smaller-than-16px mobile input.
6. Never introduce touch targets smaller than 44px.
7. Never solve mobile overflow by shrinking typography below readable sizes.
8. Never disable browser zoom as a workaround.
9. Never introduce unnecessary horizontal scrolling.
10. Never hide labels to save space.
11. Never use placeholder text as the only label.
12. Never introduce device-specific breakpoints without justification.
13. Never create desktop-only UI without a mobile strategy.
14. Test affected screens at the defined viewport sizes.
15. Preserve accessibility.
16. Preserve financial-data readability.
17. Document intentional deviations from this standard.

---

# 91. DEVIATION PROCESS

A deviation is allowed only when there is a documented reason.

Document:

```text
Component:
Rule:
Deviation:
Reason:
Impact:
Alternative considered:
Accessibility impact:
Mobile impact:
Approved by:
```

If approval is unavailable:

```text
Approved by: UNKNOWN
Status: REQUIRES REVIEW
```

---

# 92. FINAL PRINCIPLE

The application should never make the user adapt to the interface.

The interface should adapt to the user's:

- device
- viewport
- input method
- accessibility needs
- reading conditions

The standard priority is:

> **Readable → Touch-friendly → Accessible → Responsive → Consistent → Dense**

Never reverse this order merely to fit more content on screen.
