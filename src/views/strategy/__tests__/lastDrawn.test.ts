import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runStrategy } from '../engine';
import { C1_NAV, FLAT_TEN, baseConfig, column2Entry, navBook } from './fixtures';
test('the last drawn amount is the most recent instalment that paid the user', () => {
  const config = baseConfig();
  config.column1.withdrawals = [
    {
      id: 'wd1',
      startDate: '2019-01-01',
      endDate: '2021-01-01',
      frequency: 'yearly',
      amount: 110000,
      toColumn2: 0,
      annualStepUpPct: 0,
    },
  ];
  const last = runStrategy(config, navBook()).totals.lastPersonalWithdrawal;
  assert.ok(last);
  // Instalments fall on 2019, 2020 and 2021; the 2021 one is the latest.
  assert.equal(last.date, '2021-01-01');
  assert.equal(last.amount, 110000);
  assert.equal(last.source, 'core');
  assert.equal(last.fundName, 'Column One Fund');
});
test('the last drawn amount follows a step-up rather than the configured base', () => {
  const config = baseConfig();
  config.column1.withdrawals = [
    {
      id: 'wd1',
      startDate: '2019-01-01',
      endDate: '2021-01-01',
      frequency: 'yearly',
      amount: 100000,
      toColumn2: 0,
      annualStepUpPct: 10,
    },
  ];
  const last = runStrategy(config, navBook()).totals.lastPersonalWithdrawal;
  assert.ok(last);
  // Third instalment: two completed years of 10% => 1,00,000 * 1.21.
  assert.equal(last.date, '2021-01-01');
  assert.equal(last.amount, 121000);
});
test('the money routed onward is excluded from the last drawn amount', () => {
  const config = baseConfig();
  config.column1.withdrawals = [
    {
      id: 'wd1',
      startDate: '2019-01-01',
      endDate: '2019-01-01',
      frequency: 'yearly',
      amount: 110000,
      toColumn2: 100000,
      annualStepUpPct: 0,
    },
  ];
  config.column2 = [column2Entry('c2-1', '200', 100, '2019-01-01')];
  const last = runStrategy(config, navBook({ '200': FLAT_TEN })).totals.lastPersonalWithdrawal;
  assert.ok(last);
  assert.equal(last.amount, 10000);
});
test('an instalment routed entirely onward is not a personal withdrawal', () => {
  const config = baseConfig();
  config.column1.withdrawals = [
    {
      id: 'wd1',
      startDate: '2019-01-01',
      endDate: '2019-01-01',
      frequency: 'yearly',
      amount: 100000,
      toColumn2: 100000,
      annualStepUpPct: 0,
    },
  ];
  config.column2 = [column2Entry('c2-1', '200', 100, '2019-01-01')];
  const totals = runStrategy(config, navBook({ '200': FLAT_TEN })).totals;
  assert.equal(totals.totalPersonalWithdrawals, 0);
  assert.equal(totals.lastPersonalWithdrawal, null);
});
test('a growth-fund SWP is reported as the last drawn amount when it is the latest', () => {
  const config = baseConfig();
  config.column1.withdrawals = [
    {
      id: 'wd1',
      startDate: '2019-01-01',
      endDate: '2019-01-01',
      frequency: 'yearly',
      amount: 100000,
      toColumn2: 100000,
      annualStepUpPct: 0,
    },
  ];
  config.column2 = [
    column2Entry('c2-1', '200', 100, '2019-01-01', {
      swp: {
        enabled: true,
        startDate: '2020-01-01',
        endDate: '2020-01-01',
        amount: 5000,
        frequency: 'yearly',
        toColumn3: 0,
      },
    }),
  ];
  const last = runStrategy(config, navBook({ '200': FLAT_TEN })).totals.lastPersonalWithdrawal;
  assert.ok(last);
  assert.equal(last.source, 'growth');
  assert.equal(last.date, '2020-01-01');
  assert.equal(last.amount, 5000);
  assert.equal(last.fundName, 'Fund 200');
});
test('nothing withdrawn means nothing reported as last drawn', () => {
  assert.equal(runStrategy(baseConfig(), navBook()).totals.lastPersonalWithdrawal, null);
  assert.equal(C1_NAV.length, 6);
});
