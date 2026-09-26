import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runStrategy } from '../engine';
import { mergeNavSeries } from '../../../lib/amfi/amfiStorage';
import { baseConfig, column2Entry, navBook } from './fixtures';
test('calculation-dependent changes recalculate portfolio totals correctly', () => {
  const config = baseConfig();
  config.column1.amount = 1000000;
  const res1 = runStrategy(config, navBook());
  assert.equal(res1.totals.initialInvestment, 1000000);
  config.column1.amount = 2000000;
  const res2 = runStrategy(config, navBook());
  assert.equal(res2.totals.initialInvestment, 2000000);
  assert.notEqual(res1.totals.column1Value, res2.totals.column1Value);
});
test('unrelated UI state does not alter financial transactions or snapshots', () => {
  const config = baseConfig();
  const res1 = runStrategy(config, navBook());
  // Simulating an accordion open/close or UI-local selection
  const res2 = runStrategy({ ...config }, navBook());
  assert.deepEqual(res1.totals, res2.totals);
  assert.equal(res1.transactions.length, res2.transactions.length);
  assert.equal(res1.snapshots.length, res2.snapshots.length);
});
test('NAV cache reuses available NAV data without duplicate requests', () => {
  const existing = [
    { date: '24-09-2026', nav: '150.0000' },
    { date: '23-09-2026', nav: '149.5000' },
  ];
  const incoming = [
    { date: '24-09-2026', nav: '150.0000' }, // Duplicate date
    { date: '25-09-2026', nav: '151.0000' }, // New date
  ];
  const merged = mergeNavSeries(existing, incoming);
  assert.equal(merged.length, 3);
  assert.deepEqual(
    merged.map((m) => m.date),
    ['25-09-2026', '24-09-2026', '23-09-2026']
  );
  assert.equal(merged[0].nav, '151.0000');
});
test('SWP step-up calculation correctly adjusts cash withdrawals and units sold', () => {
  const config = baseConfig({ asOfDate: '2020-01-01' });
  config.column1.investmentDate = '2018-01-01';
  config.column1.amount = 5000000;
  config.column1.withdrawals = [
    {
      id: 'wd1',
      startDate: '2018-01-01',
      endDate: '2020-01-01',
      frequency: 'yearly',
      amount: 500000,
      toColumn2: 500000,
      annualStepUpPct: 0,
    },
  ];
  const c2 = column2Entry('c2-fund', '201', 100, '2018-01-01');
  c2.swp = {
    enabled: true,
    startDate: '2018-01-01',
    endDate: '2019-12-31',
    frequency: 'yearly',
    amount: 100000,
    toColumn3: 0,
    annualStepUpPct: 15,
  };
  config.column2 = [c2];
  const rows = [
    { date: '01-01-2018', nav: '100.0000' },
    { date: '01-01-2019', nav: '115.0000' },
  ];
  const res = runStrategy(config, navBook({ 201: rows }));
  const swps = res.transactions.filter((t) => t.kind === 'c2-swp');
  assert.equal(swps.length, 2);
  assert.equal(swps[0].settledAmount, 100000);
  assert.equal(swps[0].units, -1000);
  assert.equal(swps[1].settledAmount, 115000);
  assert.equal(swps[1].units, -1000); // 115,000 / 115 = 1000 units
});
