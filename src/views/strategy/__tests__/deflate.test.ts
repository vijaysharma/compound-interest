import { test } from 'node:test';
import assert from 'node:assert/strict';
const { deflateSnapshots, DEFAULT_INFLATION_PCT } = await import('../projection');
const snap = (date: string, totalValue: number, column1Value = totalValue) => ({
  date,
  totalValue,
  column1Value,
});
const KEYS = ['totalValue', 'column1Value'] as const;
test('points at or before the base date are left alone', () => {
  // The measured history is in the rupees of its own time. Re-expressing it
  // would move the historical line, which the projection is built to keep
  // identical to the unprojected run.
  const rows = [snap('2020-01-01', 1_000_000), snap('2026-09-23', 2_000_000)];
  const out = deflateSnapshots(rows, KEYS, '2026-09-23', 6);
  assert.equal(out[0].totalValue, 1_000_000);
  assert.equal(out[1].totalValue, 2_000_000);
});
test('a point ten years out is deflated by ten years of inflation', () => {
  const rows = [snap('2036-09-23', 1_000_000)];
  const [out] = deflateSnapshots(rows, KEYS, '2026-09-23', 6);
  const expected = 1_000_000 / 1.06 ** 10;
  assert.ok(Math.abs(out.totalValue - expected) / expected < 0.002, `${out.totalValue} ≈ ${expected}`);
});
test('every listed key is deflated, others untouched', () => {
  const rows = [{ date: '2036-09-23', totalValue: 100, column1Value: 50, units: 7 }];
  const [out] = deflateSnapshots(rows, KEYS, '2026-09-23', 6);
  assert.ok(out.totalValue < 100);
  assert.ok(out.column1Value < 50);
  assert.equal(out.units, 7, 'not in the key list, so left as-is');
});
test('a zero or negative rate is a no-op, returning the same array', () => {
  // Why the view needs its own rate: the strategy's yearly withdrawal increase
  // defaults to 0, so deflating by it would silently do nothing at all.
  const rows = [snap('2036-09-23', 1_000_000)];
  assert.equal(deflateSnapshots(rows, KEYS, '2026-09-23', 0), rows);
  assert.equal(deflateSnapshots(rows, KEYS, '2026-09-23', -3), rows);
});
test('the default rate is a stated assumption, not zero', () => {
  assert.equal(DEFAULT_INFLATION_PCT, 6);
});
test('the 100-year case lands in a readable range', () => {
  // The reason this exists: nominal ₹15,42,413 cr at 18% over 100 years flattens
  // a linear axis so far that the measured history becomes the axis line.
  const nominal = 1_000_000 * 1.18 ** 100;
  const [out] = deflateSnapshots([snap('2126-09-23', nominal)], KEYS, '2026-09-23', 6);
  assert.ok(out.totalValue < nominal / 300, 'deflation is doing real work');
  assert.ok(out.totalValue > 0 && Number.isFinite(out.totalValue));
});
test('unparseable dates are passed through rather than dropped', () => {
  const rows = [{ date: 'not-a-date', totalValue: 100, column1Value: 100 }];
  const [out] = deflateSnapshots(rows, KEYS, '2026-09-23', 6);
  assert.equal(out.totalValue, 100);
});
test('an empty list is returned as-is', () => {
  const rows: Array<{ date: string; totalValue: number; column1Value: number }> = [];
  assert.equal(deflateSnapshots(rows, KEYS, '2026-09-23', 6), rows);
});
