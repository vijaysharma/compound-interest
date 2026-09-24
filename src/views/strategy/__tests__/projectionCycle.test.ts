import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isoDateToNavDate } from '../../../utilities/dateUtils';
import {
  buildProjectedConfig,
  extendNavHistory,
  historicalMaxDrawdown,
  horizonDate,
} from '../projection';
import { installmentDates } from '../schedule';
import { baseConfig } from './fixtures';
import { smoothHistory } from './projectionBands.test';
import type { NavType } from '../../../types/types';
test('cyclical mode introduces authentic market cycles and drawdowns', () => {
  const history: NavType[] = [{ date: isoDateToNavDate('2020-01-01'), nav: '100' }];
  const extended = extendNavHistory(history, 0.12, '2030-01-01', {
    scenarioKey: 'median',
    cyclical: true,
  });
  const navs = extended.map((r) => Number(r.nav));
  let peak = navs[0];
  let maxDrawdown = 0;
  let drawdownCount = 0;
  for (let i = 1; i < navs.length; i += 1) {
    const nav = navs[i];
    if (nav > peak) {
      peak = nav;
    } else {
      const dd = (peak - nav) / peak;
      if (dd > 0.05) drawdownCount += 1;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }
  }
  assert.ok(drawdownCount > 5, 'market projection must experience periodic pullbacks');
  assert.ok(
    maxDrawdown >= 0.10 && maxDrawdown <= 0.28,
    `expected ~10-28% drawdown, got ${(maxDrawdown * 100).toFixed(1)}%`
  );
});
test('macroeconomic horizon decay moderates returns over ultra-long horizons', () => {
  const history: NavType[] = [{ date: isoDateToNavDate('2020-01-01'), nav: '100' }];
  const extended = extendNavHistory(history, 0.15, '2120-01-01', { cyclical: false });
  const lastNav = Number(extended[extended.length - 1].nav);
  const unconstrained100y = 100 * 1.15 ** 100;
  assert.ok(
    lastNav < unconstrained100y * 0.1,
    'long-term returns must be tempered by macroeconomic reality'
  );
});
test('historicalMaxDrawdown detects drawdowns accurately and scales safe funds appropriately', () => {
  const steadyHistory = smoothHistory(10, 0.06);
  assert.equal(historicalMaxDrawdown(steadyHistory), 0);
  const extended = extendNavHistory(steadyHistory, 0.06, '2030-01-01', {
    scenarioKey: 'strong',
    cyclical: true,
  });
  const navs = extended.map((r) => Number(r.nav));
  let peak = navs[0];
  let maxDrawdown = 0;
  for (let i = 1; i < navs.length; i += 1) {
    const nav = navs[i];
    if (nav > peak) {
      peak = nav;
    } else {
      const dd = (peak - nav) / peak;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }
  }
  assert.ok(
    maxDrawdown < 0.04,
    `expected safe fund drawdown < 4%, got ${(maxDrawdown * 100).toFixed(1)}%`
  );
});
test('a horizon already covered by published NAVs adds nothing', () => {
  const history = smoothHistory(2, 0.1);
  assert.equal(extendNavHistory(history, 0.1, '2010-06-01'), history);
});
test('the horizon is the as-of date plus the chosen number of years', () => {
  assert.equal(horizonDate('2026-09-21', 30), '2056-09-21');
  assert.equal(horizonDate('2026-09-21', 100), '2126-09-21');
});
test('a withdrawal that already finished is not resurrected by the projection', () => {
  const config = baseConfig({ asOfDate: '2021-01-01' });
  config.column1.withdrawals = [
    {
      id: 'wd1',
      startDate: '2019-01-01',
      endDate: '2019-12-31',
      frequency: 'yearly',
      amount: 100000,
      toColumn2: 0,
      annualStepUpPct: 0,
    },
  ];
  const projected = buildProjectedConfig(config, { horizonYears: 10 });
  assert.equal(projected.column1.withdrawals.length, 1);
});
test('a hundred-year monthly schedule is generated in full', () => {
  assert.equal(installmentDates('2020-01-01', '2120-01-01', 'monthly').length, 100 * 12 + 1);
});
