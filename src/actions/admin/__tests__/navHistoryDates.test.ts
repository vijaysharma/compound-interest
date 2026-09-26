import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays,
  daysBetween,
  calculateNext90DayWindow,
  calculateShiftedWindow,
  validate90DayInterval,
  getAmfiDateLabel,
} from '../navHistoryDates';
test('addDays advances and rewinds dates accurately across month boundaries', () => {
  assert.equal(addDays('2026-01-01', 31), '2026-02-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(addDays('2026-09-24', -89), '2026-06-27');
});
test('daysBetween measures inclusive interval length', () => {
  assert.equal(daysBetween('2026-06-27', '2026-09-24'), 90);
  assert.equal(daysBetween('2026-01-01', '2026-01-01'), 1);
});
test('validate90DayInterval approves valid 90-day ranges and rejects invalid ones', () => {
  const valid = validate90DayInterval('2026-06-27', '2026-09-24');
  assert.equal(valid.isValid, true);
  assert.equal(valid.days, 90);
  const exceeded = validate90DayInterval('2026-01-01', '2026-06-01');
  assert.equal(exceeded.isValid, false);
  assert.ok(exceeded.error?.includes('90 days'));
  const inverted = validate90DayInterval('2026-09-24', '2026-06-27');
  assert.equal(inverted.isValid, false);
  assert.ok(inverted.error?.includes('before or equal'));
});
test('calculateNext90DayWindow creates non-overlapping adjacent 90-day prior block', () => {
  const currentFrom = '2026-06-27';
  const { nextFrom, nextTo } = calculateNext90DayWindow(currentFrom);
  assert.equal(nextTo, '2026-06-26');
  assert.equal(daysBetween(nextFrom, nextTo), 90);
  assert.equal(nextFrom, '2026-03-29');
});
test('calculateShiftedWindow translates date intervals forward and backward', () => {
  const shifted = calculateShiftedWindow('2026-06-27', '2026-09-24', -90);
  assert.equal(shifted.toDate, '2026-06-26');
  assert.equal(daysBetween(shifted.fromDate, shifted.toDate), 90);
});
test('getAmfiDateLabel converts ISO date to AMFI DD-MMM-YYYY format', () => {
  assert.equal(getAmfiDateLabel('2026-09-24'), '24-Sep-2026');
  assert.equal(getAmfiDateLabel('2026-01-05'), '05-Jan-2026');
});
