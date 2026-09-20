import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseStoredConfig } from '../storage';
import { getTodayISO } from '../../../utilities/dateGuards';
import { createDefaultConfig } from '../defaults';
const TODAY = getTodayISO();
test('a saved config round-trips through JSON', () => {
  const original = createDefaultConfig('2026-09-18');
  original.column1.fund = { schemeCode: '122639', schemeName: 'PPFC', color: '#6d0b74' };
  const restored = parseStoredConfig(JSON.parse(JSON.stringify(original)));
  assert.ok(restored);
  assert.deepEqual(restored.column1.fund, original.column1.fund);
  assert.equal(restored.column1.amount, 7000000);
  assert.equal(restored.column1.investmentDate, '2018-01-01');
  assert.equal(restored.column1.withdrawals.length, 2);
  assert.deepEqual(restored.column1.withdrawals[0], original.column1.withdrawals[0]);
});
test('the as-of date is always today, never the stored one', () => {
  const stored = createDefaultConfig('2019-05-05');
  const restored = parseStoredConfig(JSON.parse(JSON.stringify(stored)));
  assert.equal(restored?.asOfDate, TODAY);
});
test('an unusable blob falls back to the caller defaults', () => {
  assert.equal(parseStoredConfig(null), null);
  assert.equal(parseStoredConfig('not an object'), null);
  assert.equal(parseStoredConfig([1, 2, 3]), null);
  assert.equal(parseStoredConfig({}), null);
  assert.equal(parseStoredConfig({ column1: 'broken' }), null);
});
test('malformed numbers and dates are replaced, not passed to the engine', () => {
  const restored = parseStoredConfig({
    column1: {
      fund: { schemeCode: '100' },
      amount: 'not-a-number',
      investmentDate: '18/09/2026',
      withdrawals: [
        { id: 'w1', startDate: 'yesterday', endDate: '', frequency: 'fortnightly', amount: NaN, toColumn2: 5000 },
      ],
    },
    column2: 'nope',
    column3: { frequency: 'hourly', mode: 'wat', amount: -50 },
  });
  assert.ok(restored);
  assert.equal(restored.column1.amount, 0);
  assert.equal(restored.column1.investmentDate, TODAY);
  const [period] = restored.column1.withdrawals;
  assert.equal(period.startDate, TODAY);
  assert.equal(period.frequency, 'yearly');
  assert.equal(period.amount, 0);
  // toColumn2 is clamped to the (zeroed) amount, keeping the split invariant.
  assert.equal(period.toColumn2, 0);
  assert.deepEqual(restored.column2, []);
  assert.equal(restored.column3.frequency, 'monthly');
  assert.equal(restored.column3.mode, 'sweep');
  assert.equal(restored.column3.amount, 0);
});
test('entries without a usable fund are dropped', () => {
  const restored = parseStoredConfig({
    column1: { fund: { schemeName: 'no code' }, amount: 100, withdrawals: [null, 7] },
    column2: [{ id: 'a', fund: { schemeCode: '201' } }, { id: 'b' }, 'junk', { fund: {} }],
  });
  assert.ok(restored);
  assert.equal(restored.column1.fund, null);
  assert.deepEqual(restored.column1.withdrawals, []);
  assert.equal(restored.column2.length, 1);
  assert.equal(restored.column2[0].fund.schemeCode, '201');
  // A missing name falls back to the code, and a colour is always assigned.
  assert.equal(restored.column2[0].fund.schemeName, '201');
  assert.ok(restored.column2[0].fund.color.length > 0);
});
test('stored funds beyond the supported count are discarded', () => {
  const restored = parseStoredConfig({
    column1: { fund: { schemeCode: '100' }, amount: 1, withdrawals: [] },
    column2: Array.from({ length: 12 }, (_, index) => ({
      id: `c-${index}`,
      fund: { schemeCode: String(200 + index) },
      allocationPct: 500,
    })),
  });
  assert.equal(restored?.column2.length, 8);
  // Percentages are clamped into range.
  assert.equal(restored?.column2[0].allocationPct, 100);
});
test('an SWP split cannot exceed its own withdrawal after a restore', () => {
  const restored = parseStoredConfig({
    column1: { fund: { schemeCode: '100' }, amount: 1, withdrawals: [] },
    column2: [
      {
        id: 'a',
        fund: { schemeCode: '201' },
        swp: { enabled: true, amount: 20000, toColumn3: 999999, frequency: 'quarterly' },
      },
    ],
  });
  const swp = restored?.column2[0].swp;
  assert.equal(swp?.amount, 20000);
  assert.equal(swp?.toColumn3, 20000);
  assert.equal(swp?.frequency, 'quarterly');
  assert.equal(swp?.enabled, true);
});
test('ids are reserved so a new item cannot reuse a restored id', () => {
  const restored = parseStoredConfig({
    column1: {
      fund: { schemeCode: '100' },
      amount: 1,
      withdrawals: [{ id: 'wd-7', amount: 100 }],
    },
    column2: [{ id: 'c2-9', fund: { schemeCode: '201' } }],
  });
  assert.ok(restored);
  // createDefaultConfig mints fresh ids from the same counter; they must not
  // collide with wd-7 or c2-9.
  const fresh = createDefaultConfig('2026-09-18');
  const freshIds = fresh.column1.withdrawals.map((period) => period.id);
  assert.ok(!freshIds.includes('wd-7'), `collision: ${freshIds.join()}`);
  for (const id of freshIds) {
    assert.ok(Number(id.split('-').pop()) > 9);
  }
});
