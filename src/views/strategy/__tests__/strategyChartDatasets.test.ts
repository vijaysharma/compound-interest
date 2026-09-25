import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildStrategyDatasets } from '../strategyChartDatasets';
import { DEFAULT_PROJECTION_SETTINGS } from '../projectionProfiles';
import { baseConfig, C1, FLAT_TEN, column2Entry, navBook } from './fixtures';
import { runStrategy } from '../engine';
import { deriveRateBands, horizonDate, buildProjectedConfig, scenarioRates, projectedNavBook } from '../projection';
test('buildStrategyDatasets returns 3 actual series when projection is off', () => {
  const config = baseConfig();
  const book = navBook();
  const actual = runStrategy(config, book);
  const datasets = buildStrategyDatasets(config, actual, null, DEFAULT_PROJECTION_SETTINGS, false);
  assert.equal(datasets.length, 3);
  assert.equal(datasets[0].label, 'Core corpus value');
  assert.equal(datasets[1].label, 'Growth funds value');
  assert.equal(datasets[2].label, 'Combined value');
});
test('buildStrategyDatasets returns 6 series with distinct styling when projection is on', () => {
  const config = baseConfig({
    column1: {
      fund: C1,
      amount: 1000000,
      investmentDate: '2018-01-01',
      withdrawals: [
        {
          id: 'w1',
          startDate: '2019-01-01',
          endDate: '2021-01-01',
          frequency: 'yearly',
          amount: 100000,
          toColumn2: 50000,
          annualStepUpPct: 0,
        },
      ],
    },
    column2: [column2Entry('c2-1', '200', 100, '2019-01-01')],
  });
  const book = navBook({ '200': FLAT_TEN });
  const actual = runStrategy(config, book);
  const bands = deriveRateBands(config, book);
  const settings = { ...DEFAULT_PROJECTION_SETTINGS, enabled: true, horizonYears: 10 };
  const horizonIso = horizonDate(config.asOfDate, settings.horizonYears);
  const projectedConfig = buildProjectedConfig(config, settings);
  const rates = scenarioRates(bands, settings.scenarioKey);
  const projBook = projectedNavBook(config, book, rates, horizonIso, settings.scenarioKey);
  const projResult = runStrategy(projectedConfig, projBook);
  const outcome = {
    key: settings.scenarioKey,
    rates,
    result: projResult,
    futurePersonal: 100000,
    terminalValue: projResult.totals.totalValue,
    terminalValueToday: 100000,
    firstShortfallDate: null,
    exhaustedDate: null,
  };
  const datasets = buildStrategyDatasets(config, actual, outcome, settings, true);
  assert.equal(datasets.length, 6);
  const coreProj = datasets[3];
  const growthProj = datasets[4];
  const combProj = datasets[5];
  assert.match(coreProj.label, /Core corpus, proj/);
  assert.match(growthProj.label, /Growth funds, proj/);
  assert.match(combProj.label, /Combined, proj/);
  assert.deepEqual(coreProj.lineDash, [6, 4]);
  assert.deepEqual(growthProj.lineDash, [2, 3]);
  assert.deepEqual(combProj.lineDash, [10, 4]);
  assert.equal(coreProj.dashed, true);
  assert.equal(growthProj.dashed, true);
  assert.equal(combProj.dashed, true);
  assert.equal(coreProj.data[0].date, config.asOfDate);
  assert.equal(growthProj.data[0].date, config.asOfDate);
  assert.equal(combProj.data[0].date, config.asOfDate);
});
