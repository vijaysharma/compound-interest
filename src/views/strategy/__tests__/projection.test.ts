import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isoDateToNavDate, navDateToISO } from '../../../utilities/dateUtils';
import { addMonths, toISO } from '../../../utilities/mutual-fund/mfDateHelpers';
import { runStrategy } from '../engine';
import { installmentDates } from '../schedule';
import {
  buildProjectedConfig,
  deriveRateBand,
  extendNavHistory,
  firstShortfall,
  horizonDate,
  projectedNavBook,
} from '../projection';
import { baseConfig } from './fixtures';
import type { NavType } from '../../../types/types';
/** Monthly NAVs compounding at exactly `annualRate` from ₹100 on 2010-01-01. */
const smoothHistory = (years: number, annualRate: number, start = '2010-01-01'): NavType[] => {
  const from = new Date(`${start}T00:00:00`);
  const rows: NavType[] = [];
  for (let month = 0; month <= years * 12; month += 1) {
    const date = addMonths(from, month);
    rows.push({
      date: isoDateToNavDate(toISO(date)),
      nav: (100 * (1 + annualRate) ** (month / 12)).toFixed(4),
    });
  }
  return rows;
};
test('a fund that grew at one steady rate reports that rate for every scenario', () => {
  const band = deriveRateBand(smoothHistory(12, 0.1));
  assert.ok(band);
  assert.equal(band.degraded, false);
  // The window is half the available history, so 12 years of NAVs gives 6.
  assert.equal(band.windowYears, 6);
  assert.ok(band.samples > 12);
  for (const rate of [band.weak, band.median, band.strong]) {
    assert.ok(Math.abs(rate - 0.1) < 0.0005, `expected ~10%, got ${rate}`);
  }
});
test('a fund with two regimes reports a spread, weakest to strongest', () => {
  // Six flat years followed by six at 20%: windows spanning the flat stretch
  // land near 0%, windows inside the second regime near 20%.
  const flat = smoothHistory(6, 0);
  const lastFlat = navDateToISO(flat[flat.length - 1].date);
  const rising = smoothHistory(6, 0.2, lastFlat).slice(1);
  const band = deriveRateBand([...flat, ...rising]);
  assert.ok(band);
  assert.equal(band.degraded, false);
  assert.ok(band.weak < band.median, 'weak should sit below median');
  assert.ok(band.median < band.strong, 'median should sit below strong');
  assert.ok(band.weak < 0.05, `weak should be near flat, got ${band.weak}`);
  assert.ok(band.strong > 0.15, `strong should be near the rising regime, got ${band.strong}`);
});
test('too little history collapses the band onto the full-period return', () => {
  const band = deriveRateBand(smoothHistory(1, 0.1));
  assert.ok(band);
  assert.equal(band.degraded, true);
  assert.equal(band.weak, band.median);
  assert.equal(band.median, band.strong);
  assert.ok(Math.abs(band.median - 0.1) < 0.005);
});
test('a fund with a single published NAV cannot be projected', () => {
  assert.equal(deriveRateBand([{ date: '01-01-2020', nav: '100' }]), null);
  assert.equal(deriveRateBand([]), null);
});
test('extending a history leaves every published NAV untouched', () => {
  const history = smoothHistory(2, 0.1);
  const extended = extendNavHistory(history, 0.1, '2015-01-01');
  assert.ok(extended.length > history.length);
  assert.deepEqual(extended.slice(0, history.length), history);
});
test('synthetic NAVs compound the last published NAV at the scenario rate', () => {
  const history: NavType[] = [{ date: isoDateToNavDate('2020-01-01'), nav: '100' }];
  const extended = extendNavHistory(history, 0.1, '2022-01-01');
  const byIso = new Map(extended.map((row) => [navDateToISO(row.date), Number(row.nav)]));
  assert.ok(Math.abs((byIso.get('2021-01-01') ?? 0) - 110) < 0.01);
  assert.ok(Math.abs((byIso.get('2022-01-01') ?? 0) - 121) < 0.01);
  // Nothing past the horizon.
  assert.equal(byIso.has('2022-02-01'), false);
});
test('a horizon already covered by published NAVs adds nothing', () => {
  const history = smoothHistory(2, 0.1);
  assert.equal(extendNavHistory(history, 0.1, '2010-06-01'), history);
});
test('the horizon is the as-of date plus the chosen number of years', () => {
  assert.equal(horizonDate('2026-09-21', 30), '2056-09-21');
  assert.equal(horizonDate('2026-09-21', 100), '2126-09-21');
});
/**
 * The invariant the whole projection rests on: extending the NAV history and
 * carrying the schedule forward must not disturb anything that already
 * happened, so the overlap with the real timeline stays identical.
 */
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
  const settings = { horizonYears: 30, annualIncreasePct: 6 };
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
  const projected = buildProjectedConfig(config, { horizonYears: 10, annualIncreasePct: 3 });
  assert.equal(projected.column1.withdrawals.length, 2);
  const continuation = projected.column1.withdrawals[1];
  // Instalments 2019/2020/2021 => two completed years of 10%, so the third
  // took 1,21,000 and the continuation picks up from there.
  assert.equal(continuation.amount, 121000);
  assert.equal(continuation.toColumn2, 48400);
  assert.equal(continuation.annualStepUpPct, 3);
  // It starts on the next instalment date, never overlapping the period it follows.
  assert.equal(continuation.startDate, '2022-01-01');
  assert.equal(continuation.endDate, projected.asOfDate);
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
  const projected = buildProjectedConfig(config, { horizonYears: 10, annualIncreasePct: 0 });
  assert.equal(projected.column1.withdrawals.length, 1);
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
  const projected = buildProjectedConfig(config, { horizonYears: 10, annualIncreasePct: 0 });
  assert.equal(projected.column2[0].swp.endDate, projected.asOfDate);
  assert.equal(projected.column2[1].swp.endDate, '2020-06-01');
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
  const settings = { horizonYears: 20, annualIncreasePct: 0 };
  const projectedConfig = buildProjectedConfig(config, settings);
  const projected = runStrategy(
    projectedConfig,
    projectedNavBook(config, book, { [config.column1.fund!.schemeCode]: 0 }, projectedConfig.asOfDate)
  );
  const shortfall = firstShortfall(projected, asOfDate);
  assert.ok(shortfall, 'a flat fund drawn at 40% a year must run short');
  assert.ok(shortfall > asOfDate);
});
test('a hundred-year monthly schedule is generated in full', () => {
  // The instalment cap used to be 1,200, which silently truncated exactly this.
  assert.equal(installmentDates('2020-01-01', '2120-01-01', 'monthly').length, 100 * 12 + 1);
});
