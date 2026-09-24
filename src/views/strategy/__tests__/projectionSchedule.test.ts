import { test } from 'node:test';
import assert from 'node:assert/strict';
import { navDateToISO } from '../../../utilities/dateUtils';
import { runStrategy } from '../engine';
import {
  buildProjectedConfig,
  firstShortfall,
  projectedNavBook,
} from '../projection';
import { baseConfig } from './fixtures';
import { smoothHistory } from './projectionBands.test';
test('projecting does not change a single transaction on or before the as-of date', () => {
  const history = smoothHistory(12, 0.1);
  const asOfDate = navDateToISO(history[history.length - 1].date);
  const config = baseConfig({ asOfDate });
  config.column1.investmentDate = '2010-01-01';
  config.column1.withdrawals = [
    {
      id: 'wd1',
      startDate: '2012-01-01',
      endDate: asOfDate,
      frequency: 'yearly',
      amount: 450000,
      toColumn2: 0,
      annualStepUpPct: 5,
    },
  ];
  const book = { [config.column1.fund!.schemeCode]: history };
  const actual = runStrategy(config, book);
  const settings = { horizonYears: 30 };
  const projectedConfig = buildProjectedConfig(config, settings);
  const projected = runStrategy(
    projectedConfig,
    projectedNavBook(config, book, { [config.column1.fund!.schemeCode]: 0.1 }, projectedConfig.asOfDate)
  );
  const overlap = projected.transactions.filter((row) => row.date <= asOfDate);
  assert.equal(overlap.length, actual.transactions.length);
  assert.deepEqual(overlap, actual.transactions);
});
test('the standing withdrawal carries on at the amount it had escalated to', () => {
  const asOfDate = '2021-01-01';
  const config = baseConfig({ asOfDate });
  config.column1.withdrawals = [
    {
      id: 'wd1',
      startDate: '2019-01-01',
      endDate: asOfDate,
      frequency: 'yearly',
      amount: 100000,
      toColumn2: 40000,
      annualStepUpPct: 10,
    },
  ];
  const projected = buildProjectedConfig(config, { horizonYears: 10 });
  assert.equal(projected.column1.withdrawals.length, 2);
  const continuation = projected.column1.withdrawals[1];
  assert.equal(continuation.amount, 121000);
  assert.equal(continuation.toColumn2, 48400);
  assert.equal(continuation.annualStepUpPct, 10);
  assert.equal(continuation.startDate, '2022-01-01');
  assert.equal(continuation.endDate, projected.asOfDate);
});
test('an SWP still running is extended to the horizon, a finished one is not', () => {
  const config = baseConfig({ asOfDate: '2021-01-01' });
  config.column2 = [
    {
      id: 'live',
      fund: { schemeCode: '200', schemeName: 'Live', color: '#000' },
      allocationPct: 50,
      sipStartDate: '2019-01-01',
      swp: {
        enabled: true,
        startDate: '2020-01-01',
        endDate: '2021-01-01',
        amount: 1000,
        frequency: 'monthly',
        toColumn3: 0,
      },
    },
    {
      id: 'done',
      fund: { schemeCode: '300', schemeName: 'Done', color: '#000' },
      allocationPct: 50,
      sipStartDate: '2019-01-01',
      swp: {
        enabled: true,
        startDate: '2019-01-01',
        endDate: '2020-06-01',
        amount: 1000,
        frequency: 'monthly',
        toColumn3: 0,
      },
    },
  ];
  const projected = buildProjectedConfig(config, { horizonYears: 10 });
  assert.equal(projected.column2[0].swp.endDate, projected.asOfDate);
  assert.equal(projected.column2[1].swp.endDate, '2020-06-01');
});
test('a monthly withdrawal whose last instalment was earlier in the month carries forward', () => {
  const asOfDate = '2026-09-24';
  const config = baseConfig({ asOfDate });
  config.column1.withdrawals = [
    {
      id: 'wd-sep',
      startDate: '2023-01-01',
      endDate: '2026-09-01',
      frequency: 'monthly',
      amount: 39370,
      toColumn2: 0,
      annualStepUpPct: 0,
    },
  ];
  const projected = buildProjectedConfig(config, { horizonYears: 10 });
  assert.equal(projected.column1.withdrawals.length, 2);
  const continuation = projected.column1.withdrawals[1];
  assert.equal(continuation.startDate, '2026-10-01');
  assert.equal(continuation.amount, 39370);
  assert.equal(continuation.endDate, projected.asOfDate);
});
test('a withdrawal larger than the corpus can sustain reports a shortfall date', () => {
  const history = smoothHistory(12, 0);
  const asOfDate = navDateToISO(history[history.length - 1].date);
  const config = baseConfig({ asOfDate });
  config.column1.investmentDate = '2010-01-01';
  config.column1.amount = 1000000;
  config.column1.withdrawals = [
    {
      id: 'wd1',
      startDate: '2021-01-01',
      endDate: asOfDate,
      frequency: 'yearly',
      amount: 400000,
      toColumn2: 0,
      annualStepUpPct: 0,
    },
  ];
  const book = { [config.column1.fund!.schemeCode]: history };
  const settings = { horizonYears: 20 };
  const projectedConfig = buildProjectedConfig(config, settings);
  const projected = runStrategy(
    projectedConfig,
    projectedNavBook(config, book, { [config.column1.fund!.schemeCode]: 0 }, projectedConfig.asOfDate)
  );
  const shortfall = firstShortfall(projected, asOfDate);
  assert.ok(shortfall, 'a flat fund drawn at 40% a year must run short');
  assert.ok(shortfall > asOfDate);
});
