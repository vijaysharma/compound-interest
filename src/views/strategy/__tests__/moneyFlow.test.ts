import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runStrategy } from '../engine';
import { FLAT_TEN, baseConfig, column2Entry, navBook, navRows } from './fixtures';
/** Column 1 routes ₹4,00,000 to Column 2, split 40/30/20/10 across four funds. */
const allocationConfig = () => {
  const config = baseConfig();
  config.column1.withdrawals = [
    {
      id: 'wd1',
      startDate: '2019-01-01',
      endDate: '2019-01-01',
      frequency: 'yearly',
      amount: 450000,
      toColumn2: 400000,
      annualStepUpPct: 0,
    },
  ];
  config.column2 = [
    column2Entry('a', '201', 40, '2019-01-01'),
    column2Entry('b', '202', 30, '2019-01-01'),
    column2Entry('c', '203', 20, '2019-01-01'),
    column2Entry('d', '204', 10, '2019-01-01'),
  ];
  return config;
};
const allocationNavBook = () =>
  navBook({ 201: FLAT_TEN, 202: FLAT_TEN, 203: FLAT_TEN, 204: FLAT_TEN });
test('the Column 1 withdrawal splits between personal use and Column 2', () => {
  const result = runStrategy(allocationConfig(), allocationNavBook());
  assert.equal(result.totals.withdrawnFromColumn1, 450000);
  assert.equal(result.totals.routedToColumn2, 400000);
  assert.equal(result.totals.personalFromColumn1, 50000);
});
test('Column 2 SIPs follow the allocation percentages and buy at actual NAV', () => {
  const result = runStrategy(allocationConfig(), allocationNavBook());
  const sips = result.transactions.filter((row) => row.kind === 'c2-sip');
  assert.deepEqual(
    sips.map((row) => row.settledAmount),
    [160000, 120000, 80000, 40000]
  );
  // Every fund is priced at ₹10 on 2019-01-01, so units are amount / 10.
  assert.deepEqual(sips.map((row) => row.units), [16000, 12000, 8000, 4000]);
  assert.equal(result.totals.investedInColumn2, 400000);
  assert.equal(result.totals.unallocatedColumn2Cash, 0);
  assert.equal(result.totals.column2Value, 400000);
});
test('a fund whose SIP starts later leaves the unspent share as Column 2 cash', () => {
  const config = allocationConfig();
  config.column2[3] = column2Entry('d', '204', 10, '2020-01-01');
  const result = runStrategy(config, allocationNavBook());
  assert.equal(result.totals.routedToColumn2, 400000);
  assert.equal(result.totals.investedInColumn2, 360000);
  assert.equal(result.totals.unallocatedColumn2Cash, 40000);
});
test('a Column 2 SWP reconciles exactly into personal use plus Column 3', () => {
  const config = allocationConfig();
  config.column2[0] = column2Entry('a', '201', 40, '2019-01-01', {
    swp: {
      enabled: true,
      startDate: '2020-01-01',
      endDate: '2020-03-01',
      amount: 50000,
      frequency: 'monthly',
      toColumn3: 30000,
    },
  });
  const result = runStrategy(config, allocationNavBook());
  const swps = result.transactions.filter((row) => row.kind === 'c2-swp');
  assert.equal(swps.length, 3);
  for (const swp of swps) {
    assert.equal(swp.settledAmount, 50000);
    assert.equal(swp.routedOnward, 30000);
    assert.equal(swp.settledAmount - swp.routedOnward, 20000);
  }
  assert.equal(result.totals.routedToColumn3, 90000);
  assert.equal(result.totals.personalFromColumn2, 60000);
  assert.equal(
    result.totals.personalFromColumn2 + result.totals.routedToColumn3,
    swps.reduce((total, swp) => total + swp.settledAmount, 0)
  );
});
test('Column 3 reinvests into the Column 1 fund at that date actual NAV', () => {
  const config = allocationConfig();
  config.column2[0] = column2Entry('a', '201', 40, '2019-01-01', {
    swp: {
      enabled: true,
      startDate: '2020-01-01',
      endDate: '2020-01-01',
      amount: 50000,
      frequency: 'monthly',
      toColumn3: 30000,
    },
  });
  config.column3 = { frequency: 'monthly', startDate: '2020-01-01', mode: 'sweep', amount: 0 };
  const result = runStrategy(config, allocationNavBook());
  const reinvestments = result.transactions.filter((row) => row.kind === 'c3-reinvest');
  assert.equal(reinvestments.length, 1);
  const [reinvestment] = reinvestments;
  // The Column 1 fund NAV on 2020-01-01 is ₹120, so ₹30,000 buys 250 units.
  assert.equal(reinvestment.schemeCode, config.column1.fund!.schemeCode);
  assert.equal(reinvestment.nav, 120);
  assert.equal(reinvestment.units, 250);
  assert.equal(result.totals.reinvestedIntoColumn1, 30000);
  assert.equal(result.totals.column3CashBalance, 0);
  // Those units join the Column 1 holding: 70,000 - sold + 250.
  const sold = -(result.transactions.find((row) => row.kind === 'c1-withdraw')?.units ?? 0);
  assert.equal(result.totals.column1Units, 70000 - sold + 250);
});
test('fixed-amount Column 3 instalments draw down the pool and leave the rest', () => {
  const config = allocationConfig();
  config.column2[0] = column2Entry('a', '201', 40, '2019-01-01', {
    swp: {
      enabled: true,
      startDate: '2020-01-01',
      endDate: '2020-01-01',
      amount: 50000,
      frequency: 'monthly',
      toColumn3: 30000,
    },
  });
  config.column3 = { frequency: 'yearly', startDate: '2020-01-01', mode: 'fixed', amount: 10000 };
  const result = runStrategy(config, allocationNavBook());
  const reinvestments = result.transactions.filter((row) => row.kind === 'c3-reinvest');
  // Yearly from 2020-01-01 to the 2021-01-01 as-of date is two instalments,
  // each priced at the Column 1 NAV published on its own date.
  assert.deepEqual(reinvestments.map((row) => row.nav), [120, 150]);
  assert.deepEqual(reinvestments.map((row) => row.settledAmount), [10000, 10000]);
  assert.equal(result.totals.reinvestedIntoColumn1, 20000);
  assert.equal(result.totals.column3CashBalance, 10000);
});
test('the chart series and the statistics card share one calculation', () => {
  const config = allocationConfig();
  const result = runStrategy(config, navBook({ 201: FLAT_TEN, 202: FLAT_TEN, 203: FLAT_TEN, 204: navRows([['2019-01-01', 10], ['2021-01-01', 25]]) }));
  const last = result.snapshots.at(-1);
  assert.equal(last?.column1Value, result.totals.column1Value);
  assert.equal(last?.column2Value, result.totals.column2Value);
  assert.equal(last?.totalValue, result.totals.totalValue);
});
