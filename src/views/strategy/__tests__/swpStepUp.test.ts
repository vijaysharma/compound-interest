import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runStrategy } from '../engine';
import { baseConfig, column2Entry, navBook } from './fixtures';
test('Growth fund SWP supports annual step-up at actual NAVs', () => {
  const config = baseConfig({ asOfDate: '2021-12-31' });
  config.column1.investmentDate = '2018-01-01';
  config.column1.amount = 10000000;
  config.column1.withdrawals = [
    {
      id: 'wd1',
      startDate: '2018-01-01',
      endDate: '2022-01-01',
      frequency: 'yearly',
      amount: 1000000,
      toColumn2: 1000000,
      annualStepUpPct: 0,
    },
  ];
  const c2 = column2Entry('c2-fund1', '201', 100, '2018-01-01');
  c2.swp = {
    enabled: true,
    startDate: '2018-01-01',
    endDate: '2021-12-31',
    frequency: 'monthly',
    amount: 50000,
    toColumn3: 0,
    annualStepUpPct: 10,
  };
  config.column2 = [c2];
  // Synthetic daily/monthly NAV sequence for fund 201
  const rows: Array<{ date: string; nav: string }> = [];
  for (let y = 2018; y <= 2022; y++) {
    for (let m = 1; m <= 12; m++) {
      const monthStr = String(m).padStart(2, '0');
      rows.push({ date: `01-${monthStr}-${y}`, nav: '100.0000' });
    }
  }
  const result = runStrategy(config, navBook({ 201: rows }));
  const swpRows = result.transactions.filter((row) => row.kind === 'c2-swp');
  assert.equal(swpRows.length, 48); // 4 years * 12 months
  // Year 1 (months 0-11): 50,000
  for (let i = 0; i < 12; i++) {
    assert.equal(swpRows[i].settledAmount, 50000);
    assert.equal(swpRows[i].units, -500); // 50,000 / 100 = 500
  }
  // Year 2 (months 12-23): 55,000
  for (let i = 12; i < 24; i++) {
    assert.equal(swpRows[i].settledAmount, 55000);
    assert.equal(swpRows[i].units, -550); // 55,000 / 100 = 550
  }
  // Year 3 (months 24-35): 60,500
  for (let i = 24; i < 36; i++) {
    assert.equal(swpRows[i].settledAmount, 60500);
    assert.equal(swpRows[i].units, -605); // 60,500 / 100 = 605
  }
  // Year 4 (months 36-47): 66,550
  for (let i = 36; i < 48; i++) {
    assert.equal(swpRows[i].settledAmount, 66550);
    assert.equal(swpRows[i].units, -665.5); // 66,550 / 100 = 665.5
  }
});
test('SWP step-up split between personal use and Column 3', () => {
  const config = baseConfig();
  config.column1.investmentDate = '2018-01-01';
  config.column1.amount = 10000000;
  config.column1.withdrawals = [
    {
      id: 'wd1',
      startDate: '2018-01-01',
      endDate: '2020-01-01',
      frequency: 'yearly',
      amount: 1000000,
      toColumn2: 1000000,
      annualStepUpPct: 0,
    },
  ];
  const c2 = column2Entry('c2-fund1', '201', 100, '2018-01-01');
  c2.swp = {
    enabled: true,
    startDate: '2018-01-01',
    endDate: '2019-12-31',
    frequency: 'yearly',
    amount: 50000,
    toColumn3: 30000,
    annualStepUpPct: 10,
  };
  config.column2 = [c2];
  const rows = [
    { date: '01-01-2018', nav: '100.0000' },
    { date: '01-01-2019', nav: '125.0000' },
  ];
  const result = runStrategy(config, navBook({ 201: rows }));
  const swpRows = result.transactions.filter((row) => row.kind === 'c2-swp');
  assert.equal(swpRows.length, 2);
  // Year 1: 50,000 total, 30,000 to Column 3, 20,000 personal
  assert.equal(swpRows[0].settledAmount, 50000);
  assert.equal(swpRows[0].routedOnward, 30000);
  assert.equal(swpRows[0].settledAmount - swpRows[0].routedOnward, 20000);
  assert.equal(swpRows[0].units, -500); // 50,000 / 100
  // Year 2: 55,000 total, 33,000 to Column 3, 22,000 personal
  assert.equal(swpRows[1].settledAmount, 55000);
  assert.equal(swpRows[1].routedOnward, 33000);
  assert.equal(swpRows[1].settledAmount - swpRows[1].routedOnward, 22000);
  assert.equal(swpRows[1].units, -440); // 55,000 / 125
});
