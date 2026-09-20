import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stepUpFactor } from '../schedule';
import { runStrategy } from '../engine';
import { FLAT_TEN, baseConfig, column2Entry, navBook, navRows } from './fixtures';
test('the step-up factor advances on completed years, per frequency', () => {
  // Monthly: twelve instalments at the same amount, then a step.
  assert.equal(stepUpFactor(0, 'monthly', 10), 1);
  assert.equal(stepUpFactor(11, 'monthly', 10), 1);
  assert.equal(stepUpFactor(12, 'monthly', 10), 1.1);
  assert.equal(stepUpFactor(24, 'monthly', 10), 1.1 ** 2);
  // Quarterly: four instalments per year.
  assert.equal(stepUpFactor(3, 'quarterly', 10), 1);
  assert.equal(stepUpFactor(4, 'quarterly', 10), 1.1);
  // Yearly: every instalment is a new year.
  assert.equal(stepUpFactor(1, 'yearly', 10), 1.1);
  assert.equal(stepUpFactor(2, 'yearly', 10), 1.1 ** 2);
  // Zero means no escalation at all.
  assert.equal(stepUpFactor(50, 'monthly', 0), 1);
});
const stepUpConfig = (annualStepUpPct: number) => {
  const config = baseConfig();
  config.column1.withdrawals = [
    {
      id: 'wd1',
      startDate: '2018-01-01',
      endDate: '2021-01-01',
      frequency: 'yearly',
      amount: 100000,
      toColumn2: 0,
      annualStepUpPct,
    },
  ];
  return config;
};
test('a yearly step-up escalates each withdrawal by the chosen percentage', () => {
  const result = runStrategy(stepUpConfig(10), navBook());
  const withdrawals = result.transactions.filter((row) => row.kind === 'c1-withdraw');
  assert.deepEqual(
    withdrawals.map((row) => row.settledAmount),
    [100000, 110000, 121000, 133100]
  );
  assert.equal(result.totals.withdrawnFromColumn1, 464100);
  assert.equal(result.totals.personalFromColumn1, 464100);
});
test('units sold still come from actual NAV, not from the step-up', () => {
  const result = runStrategy(stepUpConfig(10), navBook());
  const withdrawals = result.transactions.filter((row) => row.kind === 'c1-withdraw');
  // NAVs on those dates are 100, 110, 120 and 150 in the fixture.
  assert.deepEqual(withdrawals.map((row) => row.nav), [100, 110, 120, 150]);
  for (const row of withdrawals) {
    assert.equal(row.units, -(row.settledAmount / row.nav));
  }
});
test('zero step-up leaves every instalment identical', () => {
  const result = runStrategy(stepUpConfig(0), navBook());
  const amounts = result.transactions
    .filter((row) => row.kind === 'c1-withdraw')
    .map((row) => row.settledAmount);
  assert.deepEqual(amounts, [100000, 100000, 100000, 100000]);
});
test('the Column 2 share escalates with the withdrawal that funds it', () => {
  const config = baseConfig();
  config.column1.withdrawals = [
    {
      id: 'wd1',
      startDate: '2019-01-01',
      endDate: '2021-01-01',
      frequency: 'yearly',
      amount: 450000,
      toColumn2: 400000,
      annualStepUpPct: 10,
    },
  ];
  config.column2 = [column2Entry('a', '201', 100, '2019-01-01')];
  const result = runStrategy(config, navBook({ 201: FLAT_TEN }));
  const withdrawals = result.transactions.filter((row) => row.kind === 'c1-withdraw');
  const sips = result.transactions.filter((row) => row.kind === 'c2-sip');
  assert.deepEqual(withdrawals.map((row) => row.settledAmount), [450000, 495000, 544500]);
  assert.deepEqual(sips.map((row) => row.settledAmount), [400000, 440000, 484000]);
  // The personal share keeps the same proportion the user configured.
  assert.deepEqual(
    withdrawals.map((row) => row.settledAmount - row.routedOnward),
    [50000, 55000, 60500]
  );
  // Nothing is invented or lost on the way through Column 2.
  assert.equal(result.totals.routedToColumn2, 1324000);
  assert.equal(result.totals.investedInColumn2, 1324000);
  assert.equal(result.totals.unallocatedColumn2Cash, 0);
  assert.equal(
    result.totals.personalFromColumn1 + result.totals.routedToColumn2,
    result.totals.withdrawnFromColumn1
  );
});
test('an escalating withdrawal that outruns the holding is clamped, not faked', () => {
  const config = stepUpConfig(20);
  config.column1.amount = 250000;
  const result = runStrategy(config, navBook({ 100: navRows([['2018-01-01', 100], ['2019-01-01', 100], ['2020-01-01', 100]]) }));
  const total = result.transactions
    .filter((row) => row.kind === 'c1-withdraw')
    .reduce((sum, row) => sum + row.settledAmount, 0);
  assert.ok(total <= 250000, `withdrew ${total} from a 250000 holding`);
  assert.equal(result.totals.column1Units, 0);
  assert.ok(result.warnings.length > 0);
});
