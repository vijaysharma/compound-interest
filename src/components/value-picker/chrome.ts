/**
 * The presentation props every picker shell shares, and the one helper that
 * turns them into a root class list.
 *
 * `GenericValuePicker`, `PairedPicker` and `DateRangePicker` are three different
 * insides behind the same card, so they each need the same outer knobs. They
 * used to declare and resolve them separately, which is how `compact`,
 * `condensed` and `layout` drifted into three names for what reads like one
 * idea. They are collapsed here into two:
 *
 * - `scale` — mutually exclusive, so it is an enum rather than a boolean set.
 *   `auto` sizes off the viewport, `container` off the picker's own box, and
 *   `mobile` / `desktop` pin a fixed scale for preview frames.
 * - `compact` / `embedded` — independent of scale and of each other: one trims
 *   the outer margins, the other drops the border and radius.
 */
/** How the picker decides its control sizes. See `PickerChromeProps.scale`. */
export type PickerScale = 'auto' | 'container' | 'mobile' | 'desktop';
export interface PickerChromeProps {
  /** Heading text above (or merged into) the card. */
  title?: string;
  /**
   * What the control sizes itself against.
   *
   * - `auto` (default) — the viewport, via the shared `tablet-up` breakpoint.
   * - `container` — the picker's own box, via container queries. Reach for this
   *   wherever the picker sits in a narrow column on a wide screen; `auto`
   *   would otherwise render the full 44px/46px/20px web scale and crowd it.
   * - `mobile` / `desktop` — a fixed scale regardless of either, for preview
   *   frames that imitate a viewport they are not actually in.
   */
  scale?: PickerScale;
  /** Trims the outer vertical margins. Independent of `scale`. */
  compact?: boolean;
  /** Sheds the border and radius, for nesting inside an already-bordered slot. */
  embedded?: boolean;
  disabled?: boolean;
  className?: string;
}
/** `scale` values other than `auto` each map to one SCSS-module class. */
const SCALE_CLASS: Record<Exclude<PickerScale, 'auto'>, string> = {
  container: 'condensed',
  mobile: 'layoutMobile',
  desktop: 'layoutDesktop',
};
/**
 * Builds the root class list for a picker shell. `extra` takes classes a single
 * variant adds on its own (`tabSize-*`, for instance); falsy entries drop out,
 * so callers can pass `cond && styles.foo` inline.
 */
export function pickerRootClass(
  styles: Record<string, string | undefined>,
  { scale = 'auto', compact, embedded, className }: PickerChromeProps,
  ...extra: Array<string | false | null | undefined>
): string {
  return [
    styles.container,
    scale !== 'auto' && styles[SCALE_CLASS[scale]],
    compact && styles.compact,
    embedded && styles.embedded,
    ...extra,
    className,
  ]
    .filter(Boolean)
    .join(' ');
}
