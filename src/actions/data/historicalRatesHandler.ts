import { redisGet, redisSet } from '@/lib/redis';
import { DEFAULT_EXCHANGE_RATES } from '@/data/default_exchange_rates';
export interface CurrencyHistoricalPoint {
  date: string;
  rate: number;
}
const FRANKFURTER_SYMBOLS = new Set([
  'AUD', 'BRL', 'CAD', 'CHF', 'CNY', 'CZK', 'DKK', 'EUR',
  'GBP', 'HKD', 'HUF', 'IDR', 'ILS', 'INR', 'ISK', 'JPY',
  'KRW', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PLN', 'RON',
  'SEK', 'SGD', 'THB', 'TRY', 'USD', 'ZAR',
]);
async function fetchFromFrankfurter(
  cleanBase: string,
  cleanTarget: string,
  startIso: string,
  endIso: string
): Promise<CurrencyHistoricalPoint[]> {
  const isSingleDate = startIso === endIso;
  const url = isSingleDate
    ? `https://api.frankfurter.dev/v1/${startIso}?base=${cleanBase}&symbols=${cleanTarget}`
    : `https://api.frankfurter.dev/v1/${startIso}..${endIso}?base=${cleanBase}&symbols=${cleanTarget}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    date?: string;
    rates?: Record<string, unknown>;
  };
  if (!data?.rates) return [];
  if (isSingleDate && typeof data.rates[cleanTarget] === 'number') {
    return [
      {
        date: data.date || startIso,
        rate: data.rates[cleanTarget] as number,
      },
    ];
  }
  const points = Object.entries(data.rates as Record<string, Record<string, number>>)
    .map(([date, symbols]) => ({
      date,
      rate: symbols?.[cleanTarget] ?? 0,
    }))
    .filter((p) => p.rate > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  return points;
}
async function fetchTriangulatedFrankfurter(
  cleanBase: string,
  cleanTarget: string,
  startIso: string,
  endIso: string
): Promise<CurrencyHistoricalPoint[]> {
  const baseRateToUsd = DEFAULT_EXCHANGE_RATES[cleanBase] ?? null;
  const targetRateToUsd = DEFAULT_EXCHANGE_RATES[cleanTarget] ?? null;
  // Case A: cleanTarget is in Frankfurter, cleanBase is non-Frankfurter (e.g. AED -> INR)
  if (FRANKFURTER_SYMBOLS.has(cleanTarget) && baseRateToUsd && baseRateToUsd > 0) {
    const usdToTargetPoints = await fetchFromFrankfurter('USD', cleanTarget, startIso, endIso);
    if (usdToTargetPoints.length > 0) {
      return usdToTargetPoints.map((p) => ({
        date: p.date,
        rate: p.rate / baseRateToUsd,
      }));
    }
  }
  // Case B: cleanBase is in Frankfurter, cleanTarget is non-Frankfurter (e.g. INR -> AED)
  if (FRANKFURTER_SYMBOLS.has(cleanBase) && targetRateToUsd && targetRateToUsd > 0) {
    const usdToBasePoints = await fetchFromFrankfurter('USD', cleanBase, startIso, endIso);
    if (usdToBasePoints.length > 0) {
      return usdToBasePoints.map((p) => ({
        date: p.date,
        rate: targetRateToUsd / p.rate,
      }));
    }
  }
  return [];
}
async function fetchFromCurrencyApi(
  cleanBase: string,
  cleanTarget: string,
  startIso: string,
  endIso: string
): Promise<CurrencyHistoricalPoint[]> {
  const isSingleDate = startIso === endIso;
  const baseLower = cleanBase.toLowerCase();
  const targetLower = cleanTarget.toLowerCase();
  if (isSingleDate) {
    const urls = [
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${startIso}/v1/currencies/${baseLower}.min.json`,
      `https://${startIso}.currency-api.pages.dev/v1/currencies/${baseLower}.min.json`,
    ];
    for (const url of urls) {
      try {
        const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const data = (await res.json()) as Record<string, Record<string, number>>;
          const rate = data?.[baseLower]?.[targetLower];
          if (typeof rate === 'number' && rate > 0) {
            return [{ date: startIso, rate }];
          }
        }
      } catch {
        // try next url
      }
    }
    return [];
  }
  const startDate = new Date(startIso);
  const endDate = new Date(endIso);
  const minDate = new Date('2024-03-02');
  const actualStart = startDate < minDate ? minDate : startDate;
  if (actualStart > endDate) return [];
  const daySpan = Math.max(1, Math.round((endDate.getTime() - actualStart.getTime()) / (24 * 3600 * 1000)));
  const stepDays = daySpan <= 30 ? 2 : daySpan <= 90 ? 4 : daySpan <= 365 ? 14 : 30;
  const sampleDates: string[] = [];
  const curr = new Date(actualStart);
  while (curr <= endDate) {
    sampleDates.push(curr.toISOString().slice(0, 10));
    curr.setDate(curr.getDate() + stepDays);
  }
  const lastIso = endDate.toISOString().slice(0, 10);
  if (!sampleDates.includes(lastIso)) {
    sampleDates.push(lastIso);
  }
  const results = await Promise.all(
    sampleDates.map(async (d) => {
      try {
        const url = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${d}/v1/currencies/${baseLower}.min.json`;
        const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(6000) });
        if (res.ok) {
          const data = (await res.json()) as Record<string, Record<string, number>>;
          const rate = data?.[baseLower]?.[targetLower];
          if (typeof rate === 'number' && rate > 0) {
            return { date: d, rate };
          }
        }
      } catch {
        // ignore individual point failure
      }
      return null;
    })
  );
  return results.filter((p): p is CurrencyHistoricalPoint => p !== null).sort((a, b) => a.date.localeCompare(b.date));
}
export async function handleGetHistoricalRates(
  base: string,
  target: string,
  days = 30,
  startDateStr?: string,
  endDateStr?: string
): Promise<{ success: boolean; base: string; target: string; points: CurrencyHistoricalPoint[] }> {
  const cleanBase = (base || 'USD').toUpperCase().trim();
  const cleanTarget = (target || 'INR').toUpperCase().trim();
  if (cleanBase === cleanTarget) {
    const today = new Date().toISOString().slice(0, 10);
    return {
      success: true,
      base: cleanBase,
      target: cleanTarget,
      points: [{ date: startDateStr || today, rate: 1 }],
    };
  }
  const cacheKey = startDateStr && endDateStr
    ? `cache:rates:history:${cleanBase}:${cleanTarget}:${startDateStr}:${endDateStr}`
    : `cache:rates:history:${cleanBase}:${cleanTarget}:${days}`;
  const cached = await redisGet<CurrencyHistoricalPoint[]>(cacheKey);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return {
      success: true,
      base: cleanBase,
      target: cleanTarget,
      points: cached,
    };
  }
  const now = new Date();
  const endIso = endDateStr || now.toISOString().slice(0, 10);
  let startIso = startDateStr;
  if (!startIso) {
    const startDate = new Date();
    startDate.setDate(now.getDate() - days);
    startIso = startDate.toISOString().slice(0, 10);
  }
  let points: CurrencyHistoricalPoint[] = [];
  // 1. Try Frankfurter directly if both are supported
  if (FRANKFURTER_SYMBOLS.has(cleanBase) && FRANKFURTER_SYMBOLS.has(cleanTarget)) {
    try {
      points = await fetchFromFrankfurter(cleanBase, cleanTarget, startIso, endIso);
    } catch {
      // fallback
    }
  }
  // 2. Try triangulation via USD if one currency is in Frankfurter
  if (points.length === 0 && (FRANKFURTER_SYMBOLS.has(cleanBase) || FRANKFURTER_SYMBOLS.has(cleanTarget))) {
    try {
      points = await fetchTriangulatedFrankfurter(cleanBase, cleanTarget, startIso, endIso);
    } catch {
      // fallback
    }
  }
  // 3. Fallback to @fawazahmed0/currency-api
  if (points.length === 0) {
    try {
      points = await fetchFromCurrencyApi(cleanBase, cleanTarget, startIso, endIso);
    } catch {
      // fallback
    }
  }
  // 4. If still empty, synthesize at least base/target live exchange rate points
  if (points.length === 0) {
    const baseUsd = DEFAULT_EXCHANGE_RATES[cleanBase] ?? (cleanBase === 'USD' ? 1 : null);
    const targetUsd = DEFAULT_EXCHANGE_RATES[cleanTarget] ?? (cleanTarget === 'USD' ? 1 : null);
    if (baseUsd && targetUsd && baseUsd > 0) {
      const liveRate = targetUsd / baseUsd;
      points = [
        { date: startIso, rate: liveRate },
        { date: endIso, rate: liveRate },
      ];
    }
  }
  if (points.length > 0) {
    if (points.length > 500) {
      const stride = Math.ceil(points.length / 350);
      const sampled: CurrencyHistoricalPoint[] = [];
      for (let i = 0; i < points.length; i += stride) {
        sampled.push(points[i]);
      }
      if (sampled[sampled.length - 1].date !== points[points.length - 1].date) {
        sampled.push(points[points.length - 1]);
      }
      points = sampled;
    }
    redisSet(cacheKey, points, 12 * 3600).catch(() => {});
    return {
      success: true,
      base: cleanBase,
      target: cleanTarget,
      points,
    };
  }
  return {
    success: false,
    base: cleanBase,
    target: cleanTarget,
    points: [],
  };
}
