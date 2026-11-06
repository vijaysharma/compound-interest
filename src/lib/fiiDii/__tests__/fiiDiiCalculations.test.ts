import test from 'node:test';
import assert from 'node:assert/strict';
import {
  processFIIDIIData,
  adjustFIIDIIPoints,
  formatShortDate,
  getFinancialYearRange,
} from '../fiiDiiCalculations';
import type { DbInstitutionalFlow, DbIndexPrice, DbMacroIndicator } from '@/lib/db';
test('formatShortDate formats daily and monthly dates accurately', () => {
  assert.equal(formatShortDate('2026-11-05', false), "5 Nov '26");
  assert.equal(formatShortDate('2026-11-01', true), "Nov '26");
});
test('getFinancialYearRange calculates Indian financial year dates', () => {
  const fy2025 = getFinancialYearRange('FY2025');
  assert.equal(fy2025.start, '2024-04-01');
  assert.equal(fy2025.end, '2025-03-31');
});
test('processFIIDIIData extracts latest index benchmarks and dates correctly', () => {
  const flows: DbInstitutionalFlow[] = [
    {
      trade_date: '2026-11-04',
      fii_buy_crores: '20000',
      fii_sell_crores: '15000',
      fii_net_crores: '5000',
      dii_buy_crores: '15000',
      dii_sell_crores: '18000',
      dii_net_crores: '-3000',
    },
    {
      trade_date: '2026-11-05',
      fii_buy_crores: '25000',
      fii_sell_crores: '18000',
      fii_net_crores: '7000',
      dii_buy_crores: '16000',
      dii_sell_crores: '19000',
      dii_net_crores: '-3000',
    },
  ];
  const nifty: DbIndexPrice[] = [
    { trade_date: '2026-11-04', index_name: 'NIFTY50', close_price: '24000.00' },
    { trade_date: '2026-11-05', index_name: 'NIFTY50', close_price: '24500.00' },
  ];
  const sensex: DbIndexPrice[] = [
    { trade_date: '2026-11-04', index_name: 'SENSEX', close_price: '78000.00' },
    { trade_date: '2026-11-05', index_name: 'SENSEX', close_price: '79500.00' },
  ];
  const macros: DbMacroIndicator[] = [
    { record_date: '2026-01-01', cpi_index: '200.0', ppp_factor: '24.0' },
  ];
  const result = processFIIDIIData(flows, nifty, sensex, macros, 'nominal', 'daily');
  assert.equal(result.summary.latestDate, '2026-11-05');
  assert.equal(result.summary.latestIndexDate, '2026-11-05');
  assert.equal(result.summary.latestNifty, 24500);
  assert.equal(result.summary.latestSensex, 79500);
  assert.equal(result.points[1].niftyClose, 24500);
  assert.equal(result.points[1].sensexClose, 79500);
  assert.equal(result.summary.niftyPeriodChangePercent, 2.08); // (24500 - 24000) / 24000 = +2.08%
  // Client adjustment preserves latestIndexDate
  const adjusted = adjustFIIDIIPoints(
    result.points,
    result.summary.cpiLatest,
    result.summary.pppLatest,
    'inflation',
    'daily',
    result.summary
  );
  assert.equal(adjusted.summary.latestIndexDate, '2026-11-05');
  assert.equal(adjusted.summary.latestNifty, 24500);
  assert.equal(adjusted.summary.latestSensex, 79500);
});
test('processFIIDIIData handles index data when flows are not yet published for today', () => {
  const flows: DbInstitutionalFlow[] = [
    {
      trade_date: '2026-11-04',
      fii_buy_crores: '20000',
      fii_sell_crores: '15000',
      fii_net_crores: '5000',
      dii_buy_crores: '15000',
      dii_sell_crores: '18000',
      dii_net_crores: '-3000',
    },
    {
      trade_date: '2026-11-05',
      fii_buy_crores: '25000',
      fii_sell_crores: '18000',
      fii_net_crores: '7000',
      dii_buy_crores: '16000',
      dii_sell_crores: '19000',
      dii_net_crores: '-3000',
    },
  ];
  const nifty: DbIndexPrice[] = [
    { trade_date: '2026-11-04', index_name: 'NIFTY50', close_price: '24000.00' },
    { trade_date: '2026-11-05', index_name: 'NIFTY50', close_price: '24500.00' },
    { trade_date: '2026-11-06', index_name: 'NIFTY50', close_price: '24938.90' },
  ];
  const sensex: DbIndexPrice[] = [
    { trade_date: '2026-11-04', index_name: 'SENSEX', close_price: '78000.00' },
    { trade_date: '2026-11-05', index_name: 'SENSEX', close_price: '79500.00' },
    { trade_date: '2026-11-06', index_name: 'SENSEX', close_price: '80753.81' },
  ];
  const macros: DbMacroIndicator[] = [
    { record_date: '2026-01-01', cpi_index: '200.0', ppp_factor: '24.0' },
  ];
  const result = processFIIDIIData(flows, nifty, sensex, macros, 'nominal', 'daily', false, flows[1]);
  assert.equal(result.summary.latestDate, '2026-11-06');
  assert.equal(result.summary.latestIndexDate, '2026-11-06');
  assert.equal(result.summary.latestNifty, 24938.9);
  assert.equal(result.summary.latestSensex, 80753.81);
  assert.equal(result.summary.periodEnd, '2026-11-06');
  assert.equal(result.summary.nominalLatestFiiNet, 7000);
  assert.equal(result.summary.nominalLatestDiiNet, -3000);
  assert.equal(result.points.length, 3);
  assert.equal(result.points[2].tradeDate, '2026-11-06');
  assert.equal(result.points[2].fiiNet, 0);
  assert.equal(result.points[2].diiNet, 0);
  assert.equal(result.points[2].niftyClose, 24938.9);
  assert.equal(result.points[2].sensexClose, 80753.81);
});
