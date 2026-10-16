import { redisGet, redisSet } from '@/lib/redis';
export interface CurrencyHistoricalPoint {
  date: string;
  rate: number;
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
  try {
    const isSingleDate = startIso === endIso;
    const url = isSingleDate
      ? `https://api.frankfurter.dev/v1/${startIso}?base=${cleanBase}&symbols=${cleanTarget}`
      : `https://api.frankfurter.dev/v1/${startIso}..${endIso}?base=${cleanBase}&symbols=${cleanTarget}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        date?: string;
        rates?: Record<string, unknown>;
      };
      if (data?.rates) {
        let points: CurrencyHistoricalPoint[] = [];
        if (isSingleDate && typeof data.rates[cleanTarget] === 'number') {
          points = [
            {
              date: data.date || startIso,
              rate: data.rates[cleanTarget] as number,
            },
          ];
        } else {
          points = Object.entries(data.rates as Record<string, Record<string, number>>)
            .map(([date, symbols]) => ({
              date,
              rate: symbols?.[cleanTarget] ?? 0,
            }))
            .filter((p) => p.rate > 0)
            .sort((a, b) => a.date.localeCompare(b.date));
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
        }
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
