import { test } from 'node:test';
import assert from 'node:assert/strict';
const { sliceNavHistory, sliceLowerBound, shiftISODays, SLICE_MARGIN_DAYS } = await import(
  '../navSlice'
);
/** Upstream shape: `dd-MM-yyyy`, newest first. */
const row = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return { date: `${d}-${m}-${y}`, nav: '100.0' };
};
const history = (...isos: string[]) => isos.map(row);
test('no start date returns the very same array', () => {
  // Full-history callers — the strategy engine among them — must pay nothing.
  const rows = history('2026-09-18', '2026-09-17');
  assert.equal(sliceNavHistory(rows), rows);
  assert.equal(sliceNavHistory(rows, null, '2026-09-18'), rows);
});
test('rows outside the window are dropped', () => {
  const rows = history('2026-09-18', '2026-06-01', '2025-01-15', '2020-03-03');
  const kept = sliceNavHistory(rows, '2026-05-01', '2026-09-18');
  assert.deepEqual(
    kept.map((r) => r.date),
    ['18-09-2026', '01-06-2026']
  );
});
test('the window reaches back past the start by the lookup margin', () => {
  // NAV lookups resolve to the nearest *preceding* published NAV, so a slice cut
  // exactly at the start date leaves them nothing to fall back to.
  assert.equal(SLICE_MARGIN_DAYS, 10);
  assert.equal(sliceLowerBound('2026-09-15'), '2026-09-05');
  const rows = history('2026-09-15', '2026-09-08', '2026-09-01');
  const kept = sliceNavHistory(rows, '2026-09-15', '2026-09-15');
  assert.deepEqual(
    kept.map((r) => r.date),
    ['15-09-2026', '08-09-2026'],
    '08-09 is before the start but inside the margin, so it survives'
  );
});
test('the end bound is inclusive and excludes anything later', () => {
  const rows = history('2026-09-18', '2026-09-10', '2026-09-01');
  const kept = sliceNavHistory(rows, '2026-09-01', '2026-09-10');
  assert.deepEqual(
    kept.map((r) => r.date),
    ['10-09-2026', '01-09-2026']
  );
});
test('a window with no rows in it falls back to the full history', () => {
  // A start date past the end of a scheme's history should render as its flat
  // tail, not as "no data available".
  const rows = history('2020-01-10', '2020-01-09');
  assert.equal(sliceNavHistory(rows, '2026-01-01', '2026-09-18'), rows);
});
test('unparseable rows are kept rather than silently discarded', () => {
  const rows = [...history('2026-09-18'), { date: 'not-a-date', nav: '1' }];
  const kept = sliceNavHistory(rows, '2026-09-01', '2026-09-18');
  assert.equal(kept.length, 2);
});
test('order is preserved', () => {
  const rows = history('2026-09-18', '2026-09-17', '2026-09-16');
  const kept = sliceNavHistory(rows, '2026-09-16', '2026-09-18');
  assert.deepEqual(
    kept.map((r) => r.date),
    ['18-09-2026', '17-09-2026', '16-09-2026']
  );
});
test('shiftISODays crosses month and year boundaries', () => {
  assert.equal(shiftISODays('2026-03-01', -1), '2026-02-28');
  assert.equal(shiftISODays('2026-01-01', -1), '2025-12-31');
  assert.equal(shiftISODays('2024-03-01', -1), '2024-02-29', 'leap year');
  assert.equal(shiftISODays('2026-09-18', 5), '2026-09-23');
});
test('an empty history is returned as-is', () => {
  const rows: Array<{ date?: string }> = [];
  assert.equal(sliceNavHistory(rows, '2026-01-01'), rows);
});
