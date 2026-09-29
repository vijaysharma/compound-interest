/**
 * Fetches market data for FII/DII institutional flows, index prices (Nifty/Sensex),
 * and macroeconomic factors (CPI, PPP) from free/public financial APIs.
 */
export interface LiveFiiDiiRecord {
  tradeDate: string; // YYYY-MM-DD
  fiiBuyCrores: number;
  fiiSellCrores: number;
  fiiNetCrores: number;
  diiBuyCrores: number;
  diiSellCrores: number;
  diiNetCrores: number;
}
export interface IndexPricePoint {
  tradeDate: string; // YYYY-MM-DD
  closePrice: number;
}
const NSE_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
/**
 * Normalizes dates like "28-Sep-2026" or "28-09-2026" to "YYYY-MM-DD".
 */
export function parseNseDate(dateStr: string): string {
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const months: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };
  const parts = trimmed.split(/[-/ ]/);
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    let month = parts[1].toLowerCase();
    const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    if (months[month]) {
      month = months[month];
    } else {
      month = month.padStart(2, '0');
    }
    return `${year}-${month}-${day}`;
  }
  return new Date(trimmed).toISOString().slice(0, 10);
}
/**
 * Fetches the latest daily FII/DII net flows from NSE India API.
 */
export async function fetchNSELiveFiiDii(): Promise<LiveFiiDiiRecord | null> {
  const endpoints = [
    'https://www.nseindia.com/api/fiidiiTradeReact',
    'https://www.nseindia.com/api/fiidii',
  ];
  let cookieString = '';
  try {
    const initRes = await fetch('https://www.nseindia.com', {
      headers: {
        'User-Agent': NSE_USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 0 },
    });
    const setCookie = initRes.headers.get('set-cookie');
    if (setCookie) {
      cookieString = setCookie.split(';')[0];
    }
  } catch (err) {
    console.warn('[FII/DII] Failed to prime NSE session cookie:', err);
  }
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        headers: {
          'User-Agent': NSE_USER_AGENT,
          Accept: 'application/json, text/plain, */*',
          Referer: 'https://www.nseindia.com/reports-fii-dii',
          ...(cookieString ? { Cookie: cookieString } : {}),
        },
        next: { revalidate: 0 },
      });
      if (!res.ok) continue;
      const raw = await res.json();
      if (!Array.isArray(raw) || raw.length === 0) continue;
      let tradeDate = '';
      let fiiBuy = 0;
      let fiiSell = 0;
      let diiBuy = 0;
      let diiSell = 0;
      for (const item of raw) {
        const cat = String(item.category || '').toUpperCase();
        const dateStr = item.date || item.tradeDate;
        if (dateStr && !tradeDate) {
          tradeDate = parseNseDate(String(dateStr));
        }
        const buy = parseFloat(String(item.buyValue || '0').replace(/,/g, '')) || 0;
        const sell = parseFloat(String(item.sellValue || '0').replace(/,/g, '')) || 0;
        if (cat.includes('FII') || cat.includes('FPI')) {
          fiiBuy = buy;
          fiiSell = sell;
        } else if (cat.includes('DII')) {
          diiBuy = buy;
          diiSell = sell;
        }
      }
      if (tradeDate && (fiiBuy > 0 || diiBuy > 0 || fiiSell > 0 || diiSell > 0)) {
        return {
          tradeDate,
          fiiBuyCrores: fiiBuy,
          fiiSellCrores: fiiSell,
          fiiNetCrores: Math.round((fiiBuy - fiiSell) * 100) / 100,
          diiBuyCrores: diiBuy,
          diiSellCrores: diiSell,
          diiNetCrores: Math.round((diiBuy - diiSell) * 100) / 100,
        };
      }
    } catch (err) {
      console.warn(`[FII/DII] Error fetching from ${endpoint}:`, err);
    }
  }
  return null;
}
/**
 * Fetches historical index closing prices from Yahoo Finance API.
 */
export async function fetchYahooIndexPrices(
  symbol: '^NSEI' | '^BSESN',
  range = '5y'
): Promise<IndexPricePoint[]> {
  const isMax = range === 'max' || range === 'all' || range === 'ALL';
  const url = isMax
    ? `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=1167609600&period2=${Math.floor(Date.now() / 1000)}&interval=1d`
    : `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=1d`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; RupeeCalcBot/1.0)',
      Accept: 'application/json',
    },
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    throw new Error(`Yahoo Finance failed for ${symbol} with status ${res.status}`);
  }
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) return [];
  const timestamps: number[] = result.timestamp || [];
  const closes: (number | null)[] = result.indicators?.quote?.[0]?.close || [];
  const points: IndexPricePoint[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const close = closes[i];
    if (close !== null && close !== undefined && Number.isFinite(close) && close > 0) {
      const d = new Date(timestamps[i] * 1000);
      const tradeDate = d.toISOString().slice(0, 10);
      points.push({
        tradeDate,
        closePrice: Math.round(close * 100) / 100,
      });
    }
  }
  return points;
}
/**
 * Fetches annual PPP (INR per international $) from World Bank API.
 */
export async function fetchWorldBankPPP(): Promise<Record<string, number>> {
  const url = 'https://api.worldbank.org/v2/country/IND/indicator/PA.NUS.PPP?format=json&date=2007:2026';
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return {};
    const [, records] = await res.json();
    const map: Record<string, number> = {};
    if (Array.isArray(records)) {
      for (const r of records) {
        if (r.date && typeof r.value === 'number') {
          map[r.date] = Math.round(r.value * 10000) / 10000;
        }
      }
    }
    return map;
  } catch (err) {
    console.warn('[FII/DII] Failed to fetch World Bank PPP:', err);
    return {};
  }
}
/**
 * Fetches annual CPI from World Bank API.
 */
export async function fetchWorldBankCPI(): Promise<Record<string, number>> {
  const url = 'https://api.worldbank.org/v2/country/IND/indicator/FP.CPI.TOTL?format=json&date=2007:2026';
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return {};
    const [, records] = await res.json();
    const map: Record<string, number> = {};
    if (Array.isArray(records)) {
      for (const r of records) {
        if (r.date && typeof r.value === 'number') {
          map[r.date] = Math.round(r.value * 100) / 100;
        }
      }
    }
    return map;
  } catch (err) {
    console.warn('[FII/DII] Failed to fetch World Bank CPI:', err);
    return {};
  }
}
