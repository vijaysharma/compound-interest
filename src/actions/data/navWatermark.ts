import { redisGet, redisSet } from '@/lib/redis';
import { navFreshnessCeiling } from '../../utilities/navCalendar';
import { probeMarketWatermark as probeImpl } from './navWatermarkProbe';
import type { NavWatermark } from './navWatermarkTypes';
export * from './navWatermarkTypes';
export * from './navSchemeGate';
export { probeIntervalSeconds, schemeIntervalSeconds } from '../../utilities/navBackoff';
export { PROBE_BASE_INTERVAL_SECONDS, PROBE_MAX_INTERVAL_SECONDS } from '../../utilities/navBackoff';
const WATERMARK_KEY = 'nav:market:watermark';
const WATERMARK_TTL_SECONDS = 7 * 24 * 60 * 60;
let watermarkMemo: { value: NavWatermark | null; expiresAt: number } | null = null;
const WATERMARK_MEMO_MS = 30_000;
function safeParse(raw: string): NavWatermark | null {
  try {
    return JSON.parse(raw) as NavWatermark;
  } catch {
    return null;
  }
}
async function readWatermarkUncached(): Promise<NavWatermark | null> {
  const raw = await redisGet<NavWatermark | string>(WATERMARK_KEY);
  if (!raw) return null;
  const parsed = typeof raw === 'string' ? safeParse(raw) : raw;
  if (!parsed || typeof parsed.date !== 'string') return null;
  return {
    date: parsed.date,
    observedAt: Number(parsed.observedAt) || 0,
    noAdvanceCount: Number(parsed.noAdvanceCount) || 0,
  };
}
export async function readWatermark(): Promise<NavWatermark | null> {
  if (watermarkMemo && watermarkMemo.expiresAt > Date.now()) return watermarkMemo.value;
  const value = await readWatermarkUncached();
  watermarkMemo = { value, expiresAt: Date.now() + WATERMARK_MEMO_MS };
  return value;
}
export async function writeWatermark(next: NavWatermark): Promise<void> {
  await redisSet(WATERMARK_KEY, next, WATERMARK_TTL_SECONDS);
  watermarkMemo = null;
}
export async function resolveFreshnessCeiling(
  endDate: string,
  seedDate?: string | null
): Promise<string> {
  const watermark = await readWatermark();
  if (watermark?.date) return endDate < watermark.date ? endDate : watermark.date;
  if (seedDate) return endDate < seedDate ? endDate : seedDate;
  return navFreshnessCeiling(endDate);
}
export async function probeMarketWatermark(
  options: { force?: boolean } = {}
): Promise<{ watermark: NavWatermark | null; advanced: boolean; probed: boolean }> {
  return probeImpl(readWatermark, writeWatermark, options);
}
