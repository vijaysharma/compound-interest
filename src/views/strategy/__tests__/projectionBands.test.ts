import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isoDateToNavDate, navDateToISO } from '../../../utilities/dateUtils';
import { addMonths, toISO } from '../../../utilities/mutual-fund/mfDateHelpers';
import {
  RISK_PROFILES,
  calibrateForwardRate,
  deriveRateBand,
  extendNavHistory,
} from '../projection';
import type { NavType } from '../../../types/types';
export const smoothHistory = (years: number, annualRate: number, start = '2010-01-01'): NavType[] => {
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
  assert.equal(band.windowYears, 6);
  assert.ok(band.samples > 12);
  for (const rate of [band.weak, band.median, band.strong]) {
    assert.ok(Math.abs(rate - 0.1) < 0.0005, `expected ~10%, got ${rate}`);
  }
});
test('a fund with two regimes reports a spread, weakest to strongest', () => {
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
test('synthetic NAVs compound the last published NAV at scenario rate when cyclical is off', () => {
  const history: NavType[] = [{ date: isoDateToNavDate('2020-01-01'), nav: '100' }];
  const extended = extendNavHistory(history, 0.1, '2022-01-01', { cyclical: false });
  const byIso = new Map(extended.map((row) => [navDateToISO(row.date), Number(row.nav)]));
  assert.ok(Math.abs((byIso.get('2021-01-01') ?? 0) - 110) < 0.01);
  assert.ok(Math.abs((byIso.get('2022-01-01') ?? 0) - 121) < 0.01);
  assert.equal(byIso.has('2022-02-01'), false);
});
test('calibrateForwardRate grounds bull-run rates into realistic risk profile boundaries', () => {
  assert.equal(RISK_PROFILES.weak.benchmarkCagr, 0.085);
  assert.equal(RISK_PROFILES.median.benchmarkCagr, 0.120);
  assert.equal(RISK_PROFILES.strong.benchmarkCagr, 0.145);
  const bullRate = 0.20;
  const conservative = calibrateForwardRate(bullRate, 'weak');
  const moderate = calibrateForwardRate(bullRate, 'median');
  const risky = calibrateForwardRate(bullRate, 'strong');
  assert.ok(conservative >= 0.080 && conservative <= 0.095);
  assert.ok(moderate >= 0.110 && moderate <= 0.130);
  assert.ok(risky >= 0.140 && risky <= 0.160);
  assert.ok(conservative < moderate && moderate < risky);
  const debtRate = 0.065;
  assert.ok(calibrateForwardRate(debtRate, 'weak') <= 0.065);
  assert.equal(calibrateForwardRate(debtRate, 'median'), 0.065);
  assert.ok(calibrateForwardRate(debtRate, 'strong') <= 0.085);
});
