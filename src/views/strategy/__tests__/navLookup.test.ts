import { test } from 'node:test';
import assert from 'node:assert/strict';
import { firstNavDate, lastNavDate, navDatesBetween, resolveNav } from '../navLookup';
import { C1_NAV, navRows } from './fixtures';
test('a published date resolves to its own NAV', () => {
  assert.deepEqual(resolveNav(C1_NAV, '2019-01-01'), { date: '2019-01-01', nav: 110 });
});
test('a weekend or holiday resolves to the most recent NAV on or before it', () => {
  // 2019-06-08 is a Saturday; the last published row is 2019-06-03.
  assert.deepEqual(resolveNav(C1_NAV, '2019-06-08'), { date: '2019-06-03', nav: 115 });
  assert.deepEqual(resolveNav(C1_NAV, '2020-12-31'), { date: '2020-07-01', nav: 125 });
});
test('a date before the first published NAV has no applicable NAV', () => {
  assert.equal(resolveNav(C1_NAV, '2017-12-31'), undefined);
});
test('no NAV data means no NAV, never a fabricated one', () => {
  assert.equal(resolveNav([], '2019-01-01'), undefined);
  assert.equal(resolveNav(navRows([['2019-01-01', 0]]), '2019-01-01'), undefined);
});
test('series bounds are reported from the data', () => {
  assert.equal(firstNavDate(C1_NAV), '2018-01-01');
  assert.equal(lastNavDate(C1_NAV), '2021-01-01');
  assert.equal(firstNavDate([]), null);
});
test('published dates inside a range come back in ascending order', () => {
  assert.deepEqual(navDatesBetween(C1_NAV, '2019-01-01', '2020-01-01'), [
    '2019-01-01',
    '2019-06-03',
    '2020-01-01',
  ]);
});
