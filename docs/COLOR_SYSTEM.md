# Financial Analysis — Single-Source Color System

**Brand primary:** `#6D0B74`  
**Styling:** SCSS Modules + Dart Sass (`@use "sass:color"`) + generated CSS custom properties  
**Token architecture:** primitive → semantic → component → runtime CSS variables  
**Implementation:** `src/styles/_color-tokens.scss` (canonical token definitions) & `src/styles/_theme.scss` (runtime CSS emission)

---

## 1. Single source of truth

The authoritative source of truth for the entire application palette is:

[src/styles/_color-tokens.scss](file:///Users/vijay.sharma06/personal/projects/0.%20hosted/compound-interest/src/styles/_color-tokens.scss)

```scss
$brand-primary: #6d0b74 !default;
```

All brand scales, neutrals, semantic status families (success, danger, warning, info), financial gain/loss surfaces, chart palettes, and component tokens are deterministically derived from `$brand-primary` using pure Dart Sass functions.

Changing `$brand-primary` in this single location and rebuilding regenerates the full system without manually editing individual component files or hardcoding overrides.

---

## 2. Token Architecture

The token hierarchy is strictly layered:

1. **Primitive Tokens (`src/styles/_color-tokens.scss`):**
   - Brand scale: `$brand-50` through `$brand-950`
   - Brand-tinted neutrals: `$neutral-0` through `$neutral-950`
   - Semantic scales: `$success-50..900`, `$danger-50..900`, `$warning-50..900`, `$info-50..900`
2. **Semantic Tokens (`src/styles/_color-tokens.scss`):**
   - Text roles: `$color-text-primary`, `$color-text-secondary`, `$color-text-brand`, `$color-text-link`, etc.
   - Surface roles: `$color-page`, `$color-surface`, `$color-surface-subtle`, `$color-surface-brand`, etc.
   - Border roles: `$color-border`, `$color-border-subtle`, `$color-border-brand`, etc.
   - Action roles: `$color-action-primary-bg`, `$color-action-secondary-bg`, `$color-action-danger-bg`, etc.
   - Form roles: `$color-input-bg`, `$color-input-border`, `$color-input-border-focus`, etc.
   - Financial roles: `$color-profit-text`, `$color-loss-text`, `$color-profit-surface`, `$color-loss-surface`, etc.
   - Chart roles: `$chart-1` through `$chart-8` categorical palette plus chrome tokens.
3. **Component Tokens & Aliases:**
   - Card, Modal, Tooltip, Table, Skeleton, and Badge tokens.
4. **Runtime Custom Properties (`src/styles/_theme.scss`):**
   - Pure token definitions are decoupled from CSS emission.
   - `_theme.scss` imports `_color-tokens.scss` and emits runtime custom properties for `:root, [data-theme="fantasy"]` and `[data-theme="dark"]`.
   - Loaded once globally via `src/styles/index.scss` -> `src/index.scss`.
   - Backward-compatible variable contracts (`--color-primary`, `--color-bg`, `--color-error`, `--chart-series-*`) are fully preserved.

---

## 3. Derivation Strategy & Functions

Derivation relies on Dart Sass modules (`sass:color`, `sass:math`):

- **Tint & Shade:**
  ```scss
  @function tint($source, $amount) {
    @return color.mix(#ffffff, $source, _clamp-percent($amount));
  }
  @function shade($source, $amount) {
    @return color.mix(#000000, $source, _clamp-percent($amount));
  }
  ```
- **Hue Shift & Semantic Families:**
  Anchor hue for `#6D0B74` is ~296°. Status base colors are derived via controlled rotational shifts:
  - Success (+180° offset): ~116°–140° (vibrant accessible emerald green)
  - Danger (+60° offset): ~356°–0° (accessible ruby red)
  - Warning (+100° offset): ~36°–40° (accessible amber)
  - Info (-60° offset): ~236° (accessible slate blue)
- **Categorical Chart Series:**
  Multi-series data visualization (8 series) derives series 1 from `$brand-primary`, and remaining series 2–8 from high-saturation, contrast-controlled hue distributions across the spectrum to ensure perceptual separability across complex financial overlays.

---

## 4. Consuming Tokens

### In SCSS Modules
```scss
@use "@/styles/color-tokens" as tokens;

.card {
  background-color: tokens.$color-card-bg;
  border: 1px solid tokens.$color-card-border;
  color: tokens.$color-text-primary;
}

.profitBox {
  background-color: tokens.$color-profit-surface;
  color: tokens.$color-profit-text;
}
```

### In Runtime CSS
```scss
.card {
  background-color: var(--color-card-bg);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
}

.profitBox {
  background-color: var(--color-profit-surface);
  color: var(--color-profit-text);
}
```

---

## 5. Accessibility Verification & Validation Gate

All color pairings are tested and enforced against **WCAG 2.2 AA**:
- **Normal Text:** Contrast ratio ≥ 4.5:1
- **Large Text / Graphical UI Boundaries:** Contrast ratio ≥ 3.0:1
- **Focus Rings:** Non-text focus boundary ratio ≥ 3.0:1

### Automated Contrast Verification Script
Run the automated contrast test suite:
```bash
node scripts/validate-color-contrast.cjs
```

The script compiles `_theme.scss` on the fly, computes relative luminance, and asserts contrast ratios for both light and dark themes across primary actions, typography, inputs, financial gain/loss surfaces, focus rings, and navigation chrome.
