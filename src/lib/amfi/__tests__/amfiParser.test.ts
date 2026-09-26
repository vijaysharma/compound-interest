import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseAmfiText } from '../amfiParser';
import { parseAmfiDate, formatAmfiDate } from '../amfiDate';
import { generateAmfiChunks } from '../amfiChunker';
describe('AMFI date parsing and formatting', () => {
  it('parses DD-Mon-YYYY format', () => {
    const res = parseAmfiDate('24-Sep-2026');
    assert.deepEqual(res, { navDate: '24-09-2026', isoDate: '2026-09-24' });
  });
  it('parses DD-MM-YYYY format', () => {
    const res = parseAmfiDate('05-08-2024');
    assert.deepEqual(res, { navDate: '05-08-2024', isoDate: '2024-08-05' });
  });
  it('formats ISO date to AMFI DD-Mon-YYYY', () => {
    assert.equal(formatAmfiDate('2026-09-24'), '24-Sep-2026');
    assert.equal(formatAmfiDate('2023-01-01'), '01-Jan-2023');
  });
});
describe('AMFI chunker', () => {
  it('chunks longer than 90 days into <= 90 day intervals', () => {
    const chunks = generateAmfiChunks('2026-01-01', '2026-07-01');
    assert.ok(chunks.length >= 2);
    for (const chunk of chunks) {
      const start = new Date(chunk.fromIso).getTime();
      const end = new Date(chunk.toIso).getTime();
      const diffDays = (end - start) / (24 * 3600 * 1000);
      assert.ok(diffDays <= 90, `Chunk exceeds 90 days: ${diffDays}`);
    }
  });
  it('single chunk when <= 90 days', () => {
    const chunks = generateAmfiChunks('2026-01-01', '2026-01-31');
    assert.equal(chunks.length, 1);
    assert.equal(chunks[0].fromAmfi, '01-Jan-2026');
    assert.equal(chunks[0].toAmfi, '31-Jan-2026');
  });
});
describe('AMFI text parser', () => {
  it('parses realistic AMFI 8-column and 6-column lines, skipping headers and blanks', () => {
    const sample = `
Scheme Code;ISIN Div Payout/ ISIN Growth;ISIN Div Reinvestment;Scheme Name;Plan;Option;Net Asset Value;Date
 
Open Ended Schemes ( Equity Scheme )
 
Axis Mutual Fund
135762;INF846K01WO1;-;Axis Children's Fund;Direct Plan;Growth Option;29.6475;24-Sep-2026
119551;INF209KA12Z1;INF209KA13Z9;Aditya Birla Banking Fund;Direct Plan;GROWTH;106.9670;24-Sep-2026
 
148921;INF209KB1Y49;INF209KB1Z49;Aditya Birla Multi-Cap Fund;22.69;24-Sep-2026
malformed line without enough parts
invalidSchemeCode;INF123;INF456;Fund;10.0;24-Sep-2026
123456;INF123;INF456;Fund;NOT_A_NAV;24-Sep-2026
`;
    const res = parseAmfiText(sample);
    assert.equal(res.records.length, 3);
    assert.equal(res.skippedLines >= 5, true);
    const rec1 = res.records.find((r) => r.schemeCode === '135762');
    assert.ok(rec1);
    assert.equal(rec1?.nav, '29.6475');
    assert.equal(rec1?.date, '24-09-2026');
    assert.equal(rec1?.isoDate, '2026-09-24');
    assert.ok(rec1?.schemeName.includes('Direct Plan'));
    const rows = res.byScheme.get('135762');
    assert.ok(rows && rows.length === 1);
    assert.deepEqual(rows[0], { date: '24-09-2026', nav: '29.6475' });
  });
});
