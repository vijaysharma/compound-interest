import type { ValuePickerProps } from './types';
/**
 * The `React.memo` comparator for `ValuePicker`.
 *
 * It used to be a hand-written list of every prop to compare, which meant any
 * prop added to `ValuePickerProps` and forgotten here would silently stop
 * triggering re-renders. This walks the props instead, with two deliberate
 * exceptions:
 *
 * 1. **Callbacks are ignored.** Calculators pass fresh closures every render,
 *    so comparing them would defeat the memo entirely. A memoised instance
 *    therefore keeps the handlers from the render it last committed — never
 *    close over a value the picker's own props don't include; read it from a
 *    ref instead.
 * 2. **Arrays compare by content, one level into their entries.** Step lists,
 *    tab strips and option lists are nearly always inline literals, so identity
 *    would change on every render.
 *
 * Everything else — including React nodes in `sourceSlot` / `targetSlot` /
 * `endAdornment` — compares by identity, so an inline node re-renders.
 */
export function arePropsEqual(prev: ValuePickerProps, next: ValuePickerProps): boolean {
  const a = prev as Record<string, unknown>;
  const b = next as Record<string, unknown>;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (!valuesEqual(a[key], b[key])) return false;
  }
  return true;
}
function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a === 'function' && typeof b === 'function') return true;
  if (Array.isArray(a) && Array.isArray(b)) return entriesEqual(a, b);
  return false;
}
function entriesEqual(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((entry, i) => {
    const other = b[i];
    if (entry === other) return true;
    // `stepRows` nests one level deeper than `stepData` and `tabs`.
    if (Array.isArray(entry) && Array.isArray(other)) return entriesEqual(entry, other);
    if (isPlainObject(entry) && isPlainObject(other)) {
      const keys = new Set([...Object.keys(entry), ...Object.keys(other)]);
      return [...keys].every((key) => entry[key] === other[key]);
    }
    return false;
  });
}
/** Narrows to a data object, so React elements keep comparing by identity. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !('$$typeof' in value)
  );
}
