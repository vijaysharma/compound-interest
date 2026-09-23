import { test } from 'node:test';
import assert from 'node:assert/strict';
const { selectChartDates, MAX_CHART_POINTS } = await import('../downsample');
const dates = (n: number) =>
  Array.from({ length: n }, (_, i) => `2020-01-${String((i % 28) + 1).padStart(2, '0')}-${i}`);
const flat = (ds: string[], value = 100) => new Map(ds.map((d) => [d, value]));
test('a window already within budget is returned untouched', () => {
  const ds = dates(120);
  const out = selectChartDates(ds, [flat(ds)]);
  assert.equal(out, ds, 'the same array reference, so short windows pay nothing');
});
test('a long window is reduced to the budget', () => {
  const ds = dates(2500);
  const out = selectChartDates(ds, [flat(ds)]);
  assert.ok(out.length <= MAX_CHART_POINTS, `${out.length} <= ${MAX_CHART_POINTS}`);
  assert.ok(out.length > MAX_CHART_POINTS / 3, 'but not over-thinned');
});
test('order, first and last are preserved', () => {
  const ds = dates(2000);
  const out = selectChartDates(ds, [flat(ds)]);
  assert.equal(out[0], ds[0]);
  assert.equal(out[out.length - 1], ds[ds.length - 1]);
  const positions = out.map((d) => ds.indexOf(d));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b), 'strictly increasing');
});
test('a one-day spike survives thinning', () => {
  // The reason for min/max decimation over a uniform stride: a lone extreme
  // that falls between samples is exactly what a NAV chart is read to find.
  const ds = dates(2000);
  const values = flat(ds);
  values.set(ds[977], 9999);
  values.set(ds[1233], 1);
  const out = selectChartDates(ds, [values]);
  assert.ok(out.includes(ds[977]), 'the maximum is kept');
  assert.ok(out.includes(ds[1233]), 'the minimum is kept');
});
test('extremes from every series are kept, not just the first', () => {
  const ds = dates(1500);
  const a = flat(ds, 100);
  const b = flat(ds, 100);
  a.set(ds[400], 5000);
  b.set(ds[900], 7000);
  const out = selectChartDates(ds, [a, b]);
  assert.ok(out.includes(ds[400]), 'series A extreme');
  assert.ok(out.includes(ds[900]), 'series B extreme');
});
test('dates missing from a series do not drop the date', () => {
  // A fund that did not exist yet, or a holiday for one scheme but not another.
  const ds = dates(1200);
  const sparse = new Map<string, number>();
  for (let i = 600; i < 1200; i++) sparse.set(ds[i], 100 + i);
  const out = selectChartDates(ds, [sparse]);
  assert.equal(out[0], ds[0], 'the empty leading stretch still anchors the axis');
  assert.ok(out.length <= MAX_CHART_POINTS);
  assert.ok(
    out.some((d) => ds.indexOf(d) < 600),
    'the gap is represented rather than closed up'
  );
});
test('no duplicate dates are emitted', () => {
  const ds = dates(3000);
  const out = selectChartDates(ds, [flat(ds)]);
  assert.equal(new Set(out).size, out.length);
});
test('degenerate budgets fall back to the full series', () => {
  const ds = dates(500);
  assert.equal(selectChartDates(ds, [flat(ds)], 2), ds);
});
test('a pinned date survives thinning', () => {
  // The "today" cross-line is positioned by category, so ag-charts silently
  // drops it when its date is not plotted. That is how the rule marking the end
  // of measured data vanished at a hundred-year horizon.
  const ds = dates(3000);
  const without = selectChartDates(ds, [flat(ds)]);
  // Pick a date the unpinned pass actually discards, rather than assuming one:
  // which indices survive depends on where the bucket extremes fall.
  const dropped = ds.find((d) => !without.includes(d));
  assert.ok(dropped, 'sanity: thinning discards something');
  const withPin = selectChartDates(ds, [flat(ds)], MAX_CHART_POINTS, [dropped]);
  assert.ok(withPin.includes(dropped!), 'the pinned date is kept');
  assert.ok(withPin.length <= MAX_CHART_POINTS + 1, 'budget still respected');
});
test('null and unknown pinned dates are ignored', () => {
  const ds = dates(2000);
  const out = selectChartDates(ds, [flat(ds)], MAX_CHART_POINTS, [null, undefined, 'nope']);
  assert.ok(out.length <= MAX_CHART_POINTS);
  assert.equal(out[0], ds[0]);
});
