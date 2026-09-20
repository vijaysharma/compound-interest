import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runStrategy } from '../engine';
import { baseConfig, navBook, navRows } from './fixtures';
test('the initial investment buys units at the actual NAV on the investment date', () => {
  // ₹70,00,000 at the ₹100 NAV published on 2018-01-01 => 70,000 units.
  const result = runStrategy(baseConfig(), navBook());
  assert.equal(result.totals.column1Units, 70000);
  assert.equal(result.transactions[0].nav, 100);
  assert.equal(result.transactions[0].navDate, '2018-01-01');
});
test('a withdrawal sells units at the actual NAV on the withdrawal date', () => {
  // 70,000 units held; ₹1,10,000 withdrawn at the ₹110 NAV => 1,000 units sold.
  const config = baseConfig();
  config.column1.withdrawals = [
    {
      id: 'wd1',
      startDate: '2019-01-01',
      endDate: '2019-01-01',
      frequency: 'yearly',
      amount: 110000,
      toColumn2: 0,
      annualStepUpPct: 0,
    },
  ];
  const result = runStrategy(config, navBook());
  const withdrawal = result.transactions.find((row) => row.kind === 'c1-withdraw');
  assert.ok(withdrawal);
  assert.equal(withdrawal.nav, 110);
  assert.equal(withdrawal.units, -1000);
  assert.equal(result.totals.column1Units, 69000);
  assert.equal(result.totals.personalFromColumn1, 110000);
  // Closing value is the remaining units at the actual final NAV (₹150).
  assert.equal(result.totals.column1Value, 69000 * 150);
});
test('values come from the NAV series, not from an assumed rate', () => {
  const config = baseConfig();
  const doubledFinalNav = navRows([
    ['2018-01-01', 100],
    ['2021-01-01', 300],
  ]);
  const base = runStrategy(config, navBook());
  const doubled = runStrategy(config, navBook({ [config.column1.fund!.schemeCode]: doubledFinalNav }));
  assert.equal(base.totals.column1Value, 70000 * 150);
  assert.equal(doubled.totals.column1Value, 70000 * 300);
});
test('a withdrawal larger than the holding is clamped and reported', () => {
  const config = baseConfig();
  config.column1.amount = 110000;
  config.column1.withdrawals = [
    {
      id: 'wd1',
      startDate: '2019-01-01',
      endDate: '2020-01-01',
      frequency: 'yearly',
      amount: 500000,
      toColumn2: 0,
      annualStepUpPct: 0,
    },
  ];
  const result = runStrategy(config, navBook());
  // 1,100 units at ₹110 is only ₹1,21,000 of the ₹5,00,000 asked for.
  assert.equal(result.totals.withdrawnFromColumn1, 121000);
  assert.equal(result.totals.column1Units, 0);
  assert.ok(result.warnings.some((message) => message.includes('partial withdrawal')));
  assert.ok(result.warnings.some((message) => message.includes('no units left')));
});
test('a transaction with no published NAV is skipped and surfaced, never priced', () => {
  const config = baseConfig({ asOfDate: '2021-01-01' });
  config.column1.investmentDate = '2017-01-01';
  const result = runStrategy(config, navBook());
  assert.equal(result.transactions.length, 0);
  assert.equal(result.totals.column1Value, 0);
  assert.ok(result.warnings[0].includes('No NAV published'));
});
test('the timeline re-values the holding on every published NAV date', () => {
  const config = baseConfig();
  const result = runStrategy(config, navBook());
  assert.deepEqual(
    result.snapshots.map((snapshot) => snapshot.date),
    ['2018-01-01', '2019-01-01', '2019-06-03', '2020-01-01', '2020-07-01', '2021-01-01']
  );
  assert.deepEqual(
    result.snapshots.map((snapshot) => snapshot.column1Value),
    [7000000, 7700000, 8050000, 8400000, 8750000, 10500000]
  );
  assert.equal(result.snapshots.at(-1)?.totalValue, result.totals.totalValue);
});
test('the timeline steps down on the withdrawal date', () => {
  const config = baseConfig();
  config.column1.withdrawals = [
    {
      id: 'wd1',
      startDate: '2019-01-01',
      endDate: '2019-01-01',
      frequency: 'yearly',
      amount: 110000,
      toColumn2: 0,
      annualStepUpPct: 0,
    },
  ];
  const result = runStrategy(config, navBook());
  const onWithdrawal = result.snapshots.find((snapshot) => snapshot.date === '2019-01-01');
  assert.equal(onWithdrawal?.column1Value, 69000 * 110);
});
