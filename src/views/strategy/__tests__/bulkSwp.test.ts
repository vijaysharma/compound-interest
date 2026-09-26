import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cascadeDate,
  isFundOverridden,
  withBulkSwp,
  withDisabledSwp,
  withPatchedSwp,
} from '../configMutators';
import { planTransactions } from '../transactions';
import { baseConfig, column2Entry } from './fixtures';
import type { BulkSwpConfig } from '../types';
test('cascadeDate properly offsets dates based on months', () => {
  assert.equal(cascadeDate('2023-01-01', 0), '2023-01-01');
  assert.equal(cascadeDate('2023-01-01', 1), '2023-02-01');
  assert.equal(cascadeDate('2023-01-01', 3), '2023-04-01');
  assert.equal(cascadeDate('2023-01-01', 6), '2023-07-01');
  assert.equal(cascadeDate('2023-01-01', 12), '2024-01-01');
  assert.equal(cascadeDate('2023-01-01', 24), '2025-01-01');
  // Month-end clamping
  assert.equal(cascadeDate('2023-01-31', 1), '2023-02-28');
  assert.equal(cascadeDate('2024-01-31', 1), '2024-02-29'); // Leap year
});
test('withBulkSwp propagates cascaded dates and amounts across all growth funds', () => {
  const config = baseConfig({ asOfDate: '2026-01-01' });
  config.column2 = [
    column2Entry('c2-1', '101', 25, '2020-01-01'),
    column2Entry('c2-2', '102', 25, '2020-01-01'),
    column2Entry('c2-3', '103', 25, '2020-01-01'),
    column2Entry('c2-4', '104', 25, '2020-01-01'),
  ];
  const params: BulkSwpConfig = {
    swpAmount: 30000,
    reinvestmentAmount: 30000,
    frequency: 'monthly',
    startDate: '2022-01-01',
    endDate: '2024-01-01',
    cascadeInterval: '1 Quarter', // 3 months offset per fund
  };
  const updated = withBulkSwp(config, params);
  assert.equal(updated.column2.length, 4);
  // Fund 1: offset 0 (i = 1)
  assert.equal(updated.column2[0].swp.enabled, true);
  assert.equal(updated.column2[0].swp.amount, 30000);
  assert.equal(updated.column2[0].swp.toColumn3, 30000);
  assert.equal(updated.column2[0].swp.frequency, 'monthly');
  assert.equal(updated.column2[0].swp.startDate, '2022-01-01');
  assert.equal(updated.column2[0].swp.endDate, '2024-01-01');
  // Fund 2: offset 3 months (i = 2)
  assert.equal(updated.column2[1].swp.enabled, true);
  assert.equal(updated.column2[1].swp.amount, 30000);
  assert.equal(updated.column2[1].swp.toColumn3, 30000);
  assert.equal(updated.column2[1].swp.startDate, '2022-04-01');
  assert.equal(updated.column2[1].swp.endDate, '2024-04-01');
  // Fund 3: offset 6 months (i = 3)
  assert.equal(updated.column2[2].swp.enabled, true);
  assert.equal(updated.column2[2].swp.startDate, '2022-07-01');
  assert.equal(updated.column2[2].swp.endDate, '2024-07-01');
  // Fund 4: offset 9 months (i = 4)
  assert.equal(updated.column2[3].swp.enabled, true);
  assert.equal(updated.column2[3].swp.startDate, '2022-10-01');
  assert.equal(updated.column2[3].swp.endDate, '2024-10-01');
});
test('withBulkSwp supports 1 Month, 6 Months, and 1 Year intervals', () => {
  const config = baseConfig();
  config.column2 = [
    column2Entry('c2-1', '101', 50, '2020-01-01'),
    column2Entry('c2-2', '102', 50, '2020-01-01'),
  ];
  // 1 Month
  const m1 = withBulkSwp(config, {
    swpAmount: 20000,
    reinvestmentAmount: 10000,
    frequency: 'monthly',
    startDate: '2021-01-01',
    endDate: '2022-01-01',
    cascadeInterval: '1 Month',
  });
  assert.equal(m1.column2[1].swp.startDate, '2021-02-01');
  assert.equal(m1.column2[1].swp.endDate, '2022-02-01');
  assert.equal(m1.column2[1].swp.toColumn3, 10000);
  // 6 Months
  const m6 = withBulkSwp(config, {
    swpAmount: 20000,
    reinvestmentAmount: 20000,
    frequency: 'quarterly',
    startDate: '2021-01-01',
    endDate: '2022-01-01',
    cascadeInterval: '6 Months',
  });
  assert.equal(m6.column2[1].swp.startDate, '2021-07-01');
  assert.equal(m6.column2[1].swp.endDate, '2022-07-01');
  assert.equal(m6.column2[1].swp.frequency, 'quarterly');
  // 1 Year
  const y1 = withBulkSwp(config, {
    swpAmount: 20000,
    reinvestmentAmount: 20000,
    frequency: 'yearly',
    startDate: '2021-01-01',
    endDate: '2022-01-01',
    cascadeInterval: '1 Year',
  });
  assert.equal(y1.column2[1].swp.startDate, '2022-01-01');
  assert.equal(y1.column2[1].swp.endDate, '2023-01-01');
  assert.equal(y1.column2[1].swp.frequency, 'yearly');
});
test('individual fund overrides are preserved when editing a fund card', () => {
  const config = baseConfig({ asOfDate: '2026-01-01' });
  config.column2 = [
    column2Entry('c2-1', '101', 50, '2020-01-01'),
    column2Entry('c2-2', '102', 50, '2020-01-01'),
  ];
  const params: BulkSwpConfig = {
    swpAmount: 20000,
    reinvestmentAmount: 20000,
    frequency: 'monthly',
    startDate: '2022-01-01',
    endDate: '2024-01-01',
    cascadeInterval: '1 Quarter',
  };
  const bulkApplied = withBulkSwp(config, params);
  // User customizes fund 2's SWP amount to 45000 and toColumn3 to 15000
  const overridden = withPatchedSwp(bulkApplied, 'c2-2', {
    amount: 45000,
    toColumn3: 15000,
  });
  assert.equal(overridden.column2[0].swp.amount, 20000);
  assert.equal(overridden.column2[1].swp.amount, 45000);
  assert.equal(overridden.column2[1].swp.toColumn3, 15000);
  // Cascaded dates are still intact
  assert.equal(overridden.column2[1].swp.startDate, '2022-04-01');
  // isFundOverridden detects the override
  assert.equal(isFundOverridden(overridden.column2[0], 0, params), false);
  assert.equal(isFundOverridden(overridden.column2[1], 1, params), true);
});
test('withDisabledSwp turns off SWP across all column 2 funds', () => {
  const config = baseConfig();
  config.column2 = [
    column2Entry('c2-1', '101', 50, '2020-01-01'),
    column2Entry('c2-2', '102', 50, '2020-01-01'),
  ];
  const withSwp = withBulkSwp(config, {
    swpAmount: 20000,
    reinvestmentAmount: 20000,
    frequency: 'monthly',
    startDate: '2021-01-01',
    endDate: '2022-01-01',
    cascadeInterval: '1 Month',
  });
  assert.equal(withSwp.column2[0].swp.enabled, true);
  assert.equal(withSwp.column2[1].swp.enabled, true);
  const disabled = withDisabledSwp(withSwp);
  assert.equal(disabled.column2[0].swp.enabled, false);
  assert.equal(disabled.column2[1].swp.enabled, false);
});
test('cascaded SWP plans transactions on respective cascaded dates', () => {
  const config = baseConfig({ asOfDate: '2023-12-31' });
  config.column1.investmentDate = '2020-01-01';
  config.column1.amount = 5000000;
  config.column1.withdrawals = [
    {
      id: 'wd1',
      startDate: '2020-01-01',
      endDate: '2023-12-31',
      frequency: 'yearly',
      amount: 1000000,
      toColumn2: 1000000,
      annualStepUpPct: 0,
    },
  ];
  config.column2 = [
    column2Entry('c2-1', '101', 50, '2020-01-01'),
    column2Entry('c2-2', '102', 50, '2020-01-01'),
  ];
  const withSwp = withBulkSwp(config, {
    swpAmount: 25000,
    reinvestmentAmount: 25000,
    frequency: 'monthly',
    startDate: '2021-01-01',
    endDate: '2021-03-01',
    cascadeInterval: '1 Month',
  });
  const txs = planTransactions(withSwp);
  const swpTxs = txs.filter((t) => t.kind === 'c2-swp');
  // Fund 1: 2021-01-01 to 2021-03-01 (Jan, Feb, Mar = 3 instalments)
  const fund1Swps = swpTxs.filter((t) => t.schemeCode === '101');
  assert.deepEqual(
    fund1Swps.map((t) => t.date),
    ['2021-01-01', '2021-02-01', '2021-03-01']
  );
  // Fund 2: 2021-02-01 to 2021-04-01 (+1 Month cascade)
  const fund2Swps = swpTxs.filter((t) => t.schemeCode === '102');
  assert.deepEqual(
    fund2Swps.map((t) => t.date),
    ['2021-02-01', '2021-03-01', '2021-04-01']
  );
});
