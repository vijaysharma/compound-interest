import { redisGet, redisSet } from '@/lib/redis';
export interface CurrencyHistoricalPoint {
  date: string;
  rate: number;
}
export async function handleGetHistoricalRates(
  base: string,
  target: string,
  days = 30
): Promise<{ success: boolean; base: string; target: string; points: CurrencyHistoricalPoint[] }> {
  const cleanBase = (base || 'USD').toUpperCase().trim();
  const cleanTarget = (target || 'INR').toUpperCase().trim();
  if (cleanBase === cleanTarget) {
    const today = new Date().toISOString().slice(0, 10);
    return {
      success: true,
      base: cleanBase,
      target: cleanTarget,
      points: [{ date: today, rate: 1 }],
    };
  }
  const cacheKey = `cache:rates:history:${cleanBase}:${cleanTarget}:${days}`;
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
  const endIso = now.toISOString().slice(0, 10);
  const startDate = new Date();
  startDate.setDate(now.getDate() - days);
  const startIso = startDate.toISOString().slice(0, 10);
  try {
    const url = `https://api.frankfurter.dev/v1/${startIso}..${endIso}?base=${cleanBase}&symbols=${cleanTarget}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        rates?: Record<string, Record<string, number>>;
      };
      if (data?.rates) {
        const points: CurrencyHistoricalPoint[] = Object.entries(data.rates)
          .map(([date, symbols]) => ({
            date,
            rate: symbols[cleanTarget] ?? 0,
          }))
          .filter((p) => p.rate > 0)
          .sort((a, b) => a.date.localeCompare(b.date));
        if (points.length > 0) {
          redisSet(cacheKey, points, 12 * 3600).catch(() => {});
          return {
            success: true,
            base: cleanBase,
            target: cleanTarget,
            points,
          };
        }
      }
    }
  } catch (err) {
    console.warn('Failed to fetch historical exchange rates from primary source:', err);
  }
  return {
    success: false,
    base: cleanBase,
    target: cleanTarget,
    points: [],
  };
}
