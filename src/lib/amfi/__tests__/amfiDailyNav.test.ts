import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAmfiRawTextToRecords } from '../amfiSingleDayFetcher';
import { upsertDailyNavBatch, checkDateExistsInDb } from '../amfiDailyStorage';
test('parseAmfiRawTextToRecords parses standard and extended AMFI rows into structured records', () => {
  const rawSample = `
Scheme Code;NAV Name;Plan;Option;ISIN Div Payout/ISIN Growth;ISIN Div Reinvestment;Net Asset Value;Date
120503;ICICI Prudential Arbitrage Fund - Direct Plan - Growth;;;INF109K011V6;;15.4729;24-Sep-2026
118825;SBI Bluechip Fund;Direct;Growth;INF200K01123;;78.2500;24-Sep-2026
invalid line without numbers
999999;Invalid NAV Fund;;;;;N.A.;24-Sep-2026
`;
  const records = parseAmfiRawTextToRecords(rawSample);
  assert.equal(records.length, 2);
  assert.equal(records[0].schemeCode, '120503');
  assert.equal(records[0].nav, 15.4729);
  assert.equal(records[0].date, '2026-09-24');
  assert.equal(records[1].schemeCode, '118825');
  assert.equal(records[1].nav, 78.25);
});
test('upsertDailyNavBatch handles empty array gracefully without executing queries', async () => {
  const result = await upsertDailyNavBatch([]);
  assert.equal(result, 0);
});
test('checkDateExistsInDb returns 0 for non-existent future dates', async () => {
  if (!process.env.DATABASE_URL) return;
  const count = await checkDateExistsInDb('2099-01-01');
  assert.equal(typeof count, 'number');
  assert.equal(count, 0);
});
