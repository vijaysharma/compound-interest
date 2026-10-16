import test from 'node:test';
import assert from 'node:assert/strict';
import { handleGetHistoricalRates } from '../historicalRatesHandler';
test('handleGetHistoricalRates returns rate 1.0 immediately when base equals target', async () => {
  const result = await handleGetHistoricalRates('USD', 'USD', 30, '2026-03-01', '2026-03-01');
  assert.equal(result.success, true);
  assert.equal(result.base, 'USD');
  assert.equal(result.target, 'USD');
  assert.equal(result.points.length, 1);
  assert.equal(result.points[0].rate, 1);
  assert.equal(result.points[0].date, '2026-03-01');
});
test('handleGetHistoricalRates parses single-date Frankfurter response format', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes('api.frankfurter.dev/v1/2026-03-10')) {
        return {
          ok: true,
          json: async () => ({
            amount: 1,
            base: 'USD',
            date: '2026-03-10',
            rates: { INR: 94.96 },
          }),
        } as unknown as Response;
      }
      return { ok: false } as unknown as Response;
    };
    const res = await handleGetHistoricalRates('USD', 'INR', 1, '2026-03-10', '2026-03-10');
    assert.equal(res.success, true);
    assert.equal(res.points.length, 1);
    assert.equal(res.points[0].date, '2026-03-10');
    assert.equal(res.points[0].rate, 94.96);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
test('handleGetHistoricalRates parses date-range Frankfurter response format', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes('2026-03-01..2026-03-03')) {
        return {
          ok: true,
          json: async () => ({
            amount: 1,
            base: 'USD',
            start_date: '2026-03-01',
            end_date: '2026-03-03',
            rates: {
              '2026-03-03': { INR: 94.96 },
              '2026-03-02': { INR: 94.85 },
            },
          }),
        } as unknown as Response;
      }
      return { ok: false } as unknown as Response;
    };
    const res = await handleGetHistoricalRates('USD', 'INR', 30, '2026-03-01', '2026-03-03');
    assert.equal(res.success, true);
    assert.equal(res.points.length, 2);
    // Verified sorted in chronological order
    assert.equal(res.points[0].date, '2026-03-02');
    assert.equal(res.points[0].rate, 94.85);
    assert.equal(res.points[1].date, '2026-03-03');
    assert.equal(res.points[1].rate, 94.96);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
test('handleGetHistoricalRates downsamples large multi-year series over 500 points', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => {
      const simulatedRates: Record<string, { INR: number }> = {};
      for (let i = 0; i < 1200; i++) {
        const dateStr = `2020-01-01-${String(i).padStart(4, '0')}`;
        simulatedRates[dateStr] = { INR: 70 + (i * 0.01) };
      }
      return {
        ok: true,
        json: async () => ({
          amount: 1,
          base: 'USD',
          start_date: '2020-01-01',
          end_date: '2025-01-01',
          rates: simulatedRates,
        }),
      } as unknown as Response;
    };
    const res = await handleGetHistoricalRates('USD', 'INR', 1826, '2020-01-01', '2025-01-01');
    assert.equal(res.success, true);
    assert.ok(res.points.length <= 500, `Expected <= 500 points, got ${res.points.length}`);
    assert.ok(res.points.length > 200, `Expected > 200 points, got ${res.points.length}`);
    assert.equal(res.points[0].date, '2020-01-01-0000');
    assert.equal(res.points[res.points.length - 1].date, '2020-01-01-1199');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
test('computePresetDates produces correct 5Y and 10Y start years', async () => {
  const { computePresetDates } = await import('@/views/currency-converter/currencyDataUtils');
  const now = new Date();
  const currentYear = now.getFullYear();
  const res5Y = computePresetDates('5Y');
  assert.equal(parseInt(res5Y.start.slice(0, 4), 10), currentYear - 5);
  const res10Y = computePresetDates('10Y');
  assert.equal(parseInt(res10Y.start.slice(0, 4), 10), currentYear - 10);
});
