import { ensureTables, getDb } from '@/lib/db';
import { DEFAULT_EXCHANGE_RATES } from '@/data/default_exchange_rates';
import { redisGet, redisSet } from '@/lib/redis';
import { DB_TTL_MS, OPEN_EXCHANGE_API, memoryState } from './constants';
export async function handleGetExchangeRates(): Promise<{
  result: string;
  base_code: string;
  rates: Record<string, number>;
}> {
  const redisRates = await redisGet<Record<string, number>>('cache:rates:usd');
  if (redisRates) {
    return {
      result: 'success',
      base_code: 'USD',
      rates: redisRates,
    };
  }
  if (memoryState.exchangeRates && Date.now() - memoryState.exchangeRates.timestamp < 10 * 60 * 1000) {
    return {
      result: 'success',
      base_code: 'USD',
      rates: memoryState.exchangeRates.rates,
    };
  }
  let storedPayload: { rates?: Record<string, number> } | null = null;
  try {
    const sql = getDb();
    await ensureTables(sql);
    const rows = (await sql`
      SELECT payload, updated_at FROM inflation_sources WHERE source = 'exchange-rates'
    `) as Array<{ payload: { rates?: Record<string, number> }; updated_at: string }>;
    if (rows.length > 0 && rows[0].payload && rows[0].payload.rates) {
      storedPayload = rows[0].payload;
      const isFresh = Date.now() - new Date(rows[0].updated_at).getTime() < DB_TTL_MS;
      if (isFresh) {
        memoryState.exchangeRates = { rates: rows[0].payload.rates, timestamp: Date.now() };
        redisSet('cache:rates:usd', rows[0].payload.rates, 21600).catch(() => {});
        return {
          result: 'success',
          base_code: 'USD',
          rates: rows[0].payload.rates,
        };
      }
    }
  } catch (dbErr) {
    console.warn('DB read failed in getExchangeRatesAction:', dbErr);
  }
  try {
    const upstream = await fetch(OPEN_EXCHANGE_API, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
    });
    if (upstream.ok) {
      const payload = (await upstream.json()) as { rates?: Record<string, number> };
      if (payload && payload.rates && typeof payload.rates === 'object') {
        try {
          const sql = getDb();
          await sql`
            INSERT INTO inflation_sources (source, payload, updated_at)
            VALUES ('exchange-rates', ${JSON.stringify(payload)}::jsonb, NOW())
            ON CONFLICT (source) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
          `;
        } catch {
          // DB persistence failure is non-fatal
        }
        memoryState.exchangeRates = { rates: payload.rates, timestamp: Date.now() };
        redisSet('cache:rates:usd', payload.rates, 21600).catch(() => {});
        return {
          result: 'success',
          base_code: 'USD',
          rates: payload.rates,
        };
      }
    }
  } catch (fetchErr) {
    console.warn('Upstream exchange rates fetch failed:', fetchErr);
  }
  if (storedPayload && storedPayload.rates) {
    redisSet('cache:rates:usd', storedPayload.rates, 21600).catch(() => {});
    return {
      result: 'success',
      base_code: 'USD',
      rates: storedPayload.rates,
    };
  }
  return {
    result: 'success',
    base_code: 'USD',
    rates: DEFAULT_EXCHANGE_RATES,
  };
}
